type LLMOutput = {
  correctedText: string;
  explanation: string;
};

export function safeParseLLMJson(raw: string): LLMOutput & { parseWarning?: string } {
  // 1) Try direct JSON.parse
  try {
    const parsed = JSON.parse(raw);
    return normalize(parsed);
  } catch {
    // continue
  }

  // 2) Try extracting JSON block from markdown code fences
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      return normalize(parsed);
    } catch {
      // continue
    }
  }

  // 3) Try extracting first { ... } block (greedy)
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      const parsed = JSON.parse(braceMatch[0]);
      return normalize(parsed);
    } catch {
      // continue
    }
  }

  // 4) Fallback: treat the whole response as corrected text
  return {
    correctedText: raw.trim(),
    explanation: "",
    parseWarning: "Impossible de parser la réponse JSON du LLM. Explication indisponible.",
  };
}

function normalize(obj: Record<string, unknown>): LLMOutput {
  return {
    correctedText: typeof obj.correctedText === "string" ? obj.correctedText : "",
    explanation: typeof obj.explanation === "string" ? obj.explanation : "",
  };
}
