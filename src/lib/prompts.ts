import type { ProcessRequest } from "./schema";
import { MAX_CHANGES, MAX_LEARNING_ITEMS } from "./schema";

const TONE_INSTRUCTIONS: Record<string, string> = {
  executive: "Use a direct, authoritative, executive tone. Be decisive and strategic.",
  neutral_pro: "Use a neutral, professional tone. Clear and balanced.",
  diplomatic: "Use a diplomatic, tactful tone. Be considerate and measured.",
  casual: "Use a casual, relaxed tone. Natural and approachable.",
  friendly: "Use a warm, friendly tone. Personable and engaging.",
  funny: "Use a light, witty tone. Inject humor where appropriate without undermining the message.",
  very_concise: "Be extremely concise. Remove all filler. Every word must earn its place.",
  very_clear: "Prioritize clarity and pedagogy. Explain concepts simply. Use short sentences.",
};

const REWRITE_INSTRUCTIONS: Record<string, string> = {
  none: "Make only minimal corrections (spelling, grammar, punctuation). Do NOT rewrite or restructure sentences. Preserve the original wording as much as possible. Only fix clear errors and make micro-improvements.",
  light: "Correct errors and lightly clarify. You may shorten slightly or improve word choice, but keep the original structure and voice intact.",
  medium: "Correct errors, reorganize sentences for better flow, remove redundancies. You may restructure paragraphs but preserve the overall meaning and key points.",
  strong: "Rewrite freely for maximum clarity and impact. You may completely restructure, but you MUST preserve the original meaning and all key information. Do not invent new content.",
};

// --- Call 1: fast, just the corrected/translated text ---

export function buildProcessSystemPrompt(req: ProcessRequest): string {
  const isTranslation = req.mode === "translate_proofread";

  const roleDesc = isTranslation
    ? "You are an expert translator, proofreader, and editor."
    : "You are an expert proofreader and editor.";

  const toneInstr = TONE_INSTRUCTIONS[req.tonePreset] || TONE_INSTRUCTIONS.neutral_pro;
  const rewriteInstr = REWRITE_INSTRUCTIONS[req.rewriteStrength] || REWRITE_INSTRUCTIONS.none;

  const structureNote = req.rewriteStrength === "none" || req.rewriteStrength === "light"
    ? "IMPORTANT: Preserve the original paragraph structure exactly. Do not merge or split paragraphs."
    : "You may adjust paragraph structure if it improves readability, but keep the overall organization similar.";

  const translationNote = isTranslation
    ? `\nTranslate the text to ${req.targetLang?.toUpperCase()}. The translation must sound natural in the target language, not literal. Adapt idioms and expressions.`
    : "";

  const customNote = req.customInstructions
    ? `\n## Custom instructions (from the user — MUST be followed)\n${req.customInstructions}`
    : "";

  const emailNote = req.emailMode
    ? `\n## Email formatting (HIGHEST PRIORITY — overrides other rules)
This text is an email. You MUST ensure the output contains:
1. The VERY FIRST LINE must be a suggested email subject line, prefixed with "Subject: ". Infer it from the email content. Keep it short and professional.
2. Then a blank line, then the email body.
3. The body MUST start with a greeting (e.g. "Bonjour," / "Hello," / "Guten Tag,"). Add one if missing.
4. The body MUST end with a closing formula + signature. Add them if missing. Use exactly:
   - French: on a new line "Meilleures salutations," then on the next line "Renault John Lecoultre"
   - English: on a new line "Best regards," then on the next line "Renault John Lecoultre"
   - German: on a new line "Mit freundlichen Grüßen," then on the next line "Renault John Lecoultre"
5. If the text already has a greeting or closing, keep it (fix if needed) but do NOT duplicate.
6. Adapt greeting formality to the tone preset.
Adding salutations and a subject line is NOT "inventing content" — it is required email formatting.`
    : "";

  return `${roleDesc}

## Your task
${isTranslation ? "Translate, proofread, and edit" : "Proofread and edit"} the user's text according to the instructions below.
${emailNote}

## Tone
${toneInstr}

## Rewrite level
${rewriteInstr}

## Structure
${structureNote}
${translationNote}
${customNote}

## Editorial rules
- Never invent new content or add information not present in the original (exception: email salutations if email mode is enabled).
- Preserve the original meaning faithfully.
- Produce clean Markdown output (paragraphs, lists, bold/italic as appropriate).
- Keep the same Markdown structure the user used (if they used lists, keep lists; if plain paragraphs, keep paragraphs).

## Output format
Return ONLY the corrected/translated text. No explanations, no JSON, no commentary. Just the final text in Markdown.`;
}

export function buildProcessUserPrompt(req: ProcessRequest): string {
  const parts: string[] = [];
  if (req.mode === "translate_proofread" && req.targetLang) {
    parts.push(`[Translate to ${req.targetLang.toUpperCase()}]`);
  }
  parts.push("");
  parts.push(req.inputText);
  return parts.join("\n");
}

// --- Call 2: explain changes + learning ---

export function buildExplainSystemPrompt(req: Pick<ProcessRequest, "mode" | "targetLang" | "rewriteStrength">): string {
  const isTranslation = req.mode === "translate_proofread";
  const rewriteInstr = REWRITE_INSTRUCTIONS[req.rewriteStrength] || REWRITE_INSTRUCTIONS.none;

  const translationNote = isTranslation
    ? `The text will be translated to ${req.targetLang?.toUpperCase()}. Include items with category "translation" or "anglicism" where relevant.`
    : "";

  return `You are a linguistic analyst. You will receive a text to analyze.
Identify all spelling, grammar, punctuation, style, clarity, concision, and tone issues.
For each issue, show a short "before" snippet and the suggested "after" correction.

Rewrite level context: ${rewriteInstr}
${translationNote}

## LANGUAGE RULE (MANDATORY)
You MUST detect the language of the input text and write ALL "explanation", "rule", "title" values in THAT SAME language.
- French input → French explanations. Example: "explanation": "Le participe passé s'accorde avec le sujet quand il est employé avec être."
- English input → English explanations. Example: "explanation": "Use a comma before a coordinating conjunction joining two independent clauses."
- German input → German explanations. Example: "explanation": "Das Verb steht im Nebensatz am Ende."
NEVER write explanations in English if the input text is in French or German. This is the most important rule.

You MUST return ONLY valid JSON (no markdown fences, no extra text). The JSON must conform to this exact schema:

{
  "changes": [
    {
      "id": "c1",
      "category": "spelling|grammar|punctuation|style|clarity|concision|tone|translation|anglicism|formatting",
      "before": "original snippet",
      "after": "suggested correction",
      "explanation": "(in the same language as the input text)",
      "rule": "(in the same language as the input text, optional)",
      "severity": "info|important"
    }
  ],
  "learning": [
    {
      "id": "l1",
      "title": "(in the same language as the input text)",
      "explanation": "(in the same language as the input text)",
      "exampleBefore": "optional example before",
      "exampleAfter": "optional example after",
      "category": "spelling|grammar|punctuation|style|clarity|concision|tone|translation|anglicism|formatting"
    }
  ]
}

## Constraints
- "changes": maximum ${MAX_CHANGES} items. Focus on the most important ones.
- "learning": maximum ${MAX_LEARNING_ITEMS} items. Pick the most useful recurring lessons.
- Return ONLY the JSON object. No other text before or after.
- REMINDER: all human-readable strings MUST be in the same language as the input text.`;
}

export function buildExplainUserPrompt(originalText: string): string {
  return originalText;
}
