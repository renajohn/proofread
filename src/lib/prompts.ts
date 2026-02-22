import type { ProcessRequest } from "./schema";

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
Return ONLY a JSON object with exactly two keys:
- "correctedText": the corrected/translated text in Markdown.
- "explanation": a short paragraph (2-4 sentences) in the SAME language as the input text, summarizing the main corrections you made. Be specific about what you changed and why. If no corrections were needed, say so.

Example:
{"correctedText": "The corrected text here...", "explanation": "Summary of corrections..."}

Return ONLY the JSON object. No markdown fences, no extra text before or after.`;
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

