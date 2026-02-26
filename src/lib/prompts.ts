import type { ProcessRequest } from "./schema";

const TONE_INSTRUCTIONS: Record<string, string> = {
  executive: `TONE: Executive / Authoritative.
Write like a senior leader communicating a decision. Short, assertive sentences. No hedging ("I think", "maybe", "perhaps"). Use action verbs. Example: instead of "It might be a good idea to consider updating the policy", write "We are updating the policy effective immediately."`,
  neutral_pro: `TONE: Neutral / Professional.
Standard business tone. Clear, balanced, no strong personality. Avoid overly casual or overly formal language. This is the baseline — straightforward and polished.`,
  diplomatic: `TONE: Diplomatic / Tactful.
Soften direct statements. Use "we" instead of "you". Add cushioning phrases like "It may be worth considering…", "I'd suggest…", "One option could be…". Avoid blaming or commanding language. Example: instead of "You missed the deadline", write "It seems the deadline may have been overlooked — would it be possible to prioritize this?"`,
  casual: `TONE: Casual / Relaxed.
Write like you're talking to a colleague you know well. Use contractions (don't, it's, we'll). Shorter sentences. Drop unnecessary formality. Example: instead of "Please find attached the requested document", write "Here's the doc you asked for."`,
  friendly: `TONE: Warm / Friendly.
Be personable and enthusiastic. Use positive language, show interest. Add warmth: "Great question!", "Happy to help!", "Thanks so much for…". Example: instead of "The report is ready", write "Good news — the report is ready! Let me know if you have any questions."`,
  funny: `TONE: Light / Witty.
Inject subtle humor, wordplay, or a light touch where it fits. Don't force jokes — let the humor feel natural. Exaggerate slightly for effect when appropriate. Example: instead of "The meeting ran long", write "The meeting bravely soldiered on past the two-hour mark."`,
  very_concise: `TONE: Ultra-concise.
Strip everything to the bare minimum. Remove filler words, pleasantries, redundancies. Every word must earn its place. Prefer bullet points over paragraphs when possible. If it can be said in 5 words, don't use 15.`,
  very_clear: `TONE: Clear / Pedagogical.
Prioritize readability and understanding. Use short sentences. One idea per sentence. Explain any technical or ambiguous terms. Use concrete examples. Prefer active voice. Structure with clear logical flow.`,
};

const REWRITE_INSTRUCTIONS: Record<string, string> = {
  none: "Make only minimal corrections (spelling, grammar, punctuation). Do NOT rewrite or restructure sentences. Preserve the original wording as much as possible. Only fix clear errors and make micro-improvements. Exception: you MUST still adapt word choice to match the requested tone.",
  light: "Correct errors and lightly clarify. You may shorten slightly or improve word choice, but keep the original structure intact. Adapt vocabulary and phrasing to match the requested tone.",
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

## Tone (IMPORTANT — always apply, even at low rewrite levels)
${toneInstr}
Even if the rewrite level is low, you MUST adjust word choice, greetings, and phrasing to match this tone. Tone changes are NOT considered rewriting — they are corrections.

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

