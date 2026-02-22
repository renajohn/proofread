import express from "express";
import cors from "cors";
import type { ProcessRequest } from "../lib/schema.js";
import { chatCompletion } from "../lib/llmClient.js";
import {
  buildProcessSystemPrompt,
  buildProcessUserPrompt,
  buildExplainSystemPrompt,
  buildExplainUserPrompt,
} from "../lib/prompts.js";
import { safeParseLLMJson } from "../lib/safeParse.js";
import { INPUT_MAX_CHARS, MAX_CHANGES, MAX_LEARNING_ITEMS } from "../lib/schema.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function validateInput(body: ProcessRequest): string | null {
  if (!body.inputText || body.inputText.trim().length < 2) {
    return "inputText is required (min 2 chars)";
  }
  if (body.inputText.length > INPUT_MAX_CHARS * 1.5) {
    return `inputText too long (max ~${INPUT_MAX_CHARS} chars)`;
  }
  if (body.mode === "translate_proofread" && !body.targetLang) {
    return "targetLang is required in translate_proofread mode";
  }
  return null;
}

// Call 1: fast — just the corrected/translated text (no JSON overhead)
app.post("/api/process", async (req, res) => {
  const body = req.body as ProcessRequest;

  const validationError = validateInput(body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const systemPrompt = buildProcessSystemPrompt(body);
  const userPrompt = buildProcessUserPrompt(body);
  const startTime = Date.now();

  try {
    const result = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    const latencyMs = Date.now() - startTime;

    res.json({
      outputMarkdown: result.content.trim(),
      meta: {
        rewriteStrength: body.rewriteStrength,
        tonePreset: body.tonePreset,
        targetLang: body.targetLang,
        model: result.model,
        latencyMs,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown LLM error";
    res.status(502).json({ error: `LLM error: ${message}` });
  }
});

// Call 2: explain — changes + learning (parallel with call 1)
app.post("/api/explain", async (req, res) => {
  const body = req.body as {
    inputText: string;
    mode: ProcessRequest["mode"];
    rewriteStrength: ProcessRequest["rewriteStrength"];
    targetLang?: ProcessRequest["targetLang"];
  };

  if (!body.inputText || body.inputText.trim().length < 2) {
    res.status(400).json({ error: "inputText is required" });
    return;
  }

  const systemPrompt = buildExplainSystemPrompt(body);
  const userPrompt = buildExplainUserPrompt(body.inputText);
  const startTime = Date.now();

  try {
    const result = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    const latencyMs = Date.now() - startTime;
    const parsed = safeParseLLMJson(result.content);

    res.json({
      changes: parsed.changes.slice(0, MAX_CHANGES),
      learning: parsed.learning.slice(0, MAX_LEARNING_ITEMS),
      meta: { model: result.model, latencyMs },
      ...(parsed.parseWarning ? { parseWarning: parsed.parseWarning } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown LLM error";
    res.status(502).json({ error: `LLM error: ${message}` });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
