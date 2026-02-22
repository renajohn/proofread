import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import type { ProcessRequest } from "../lib/schema.js";
import { chatCompletion } from "../lib/llmClient.js";
import {
  buildProcessSystemPrompt,
  buildProcessUserPrompt,
} from "../lib/prompts.js";
import { safeParseLLMJson } from "../lib/safeParse.js";
import { INPUT_MAX_CHARS } from "../lib/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3001;

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
    const parsed = safeParseLLMJson(result.content);

    res.json({
      outputMarkdown: parsed.correctedText,
      explanation: parsed.explanation,
      meta: {
        rewriteStrength: body.rewriteStrength,
        tonePreset: body.tonePreset,
        targetLang: body.targetLang,
        model: result.model,
        latencyMs,
      },
      ...(parsed.parseWarning ? { parseWarning: parsed.parseWarning } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown LLM error";
    res.status(502).json({ error: `LLM error: ${message}` });
  }
});

// Serve Vite-built frontend in production
const distPath = path.resolve(__dirname, "../../dist");
app.use(express.static(distPath));
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
