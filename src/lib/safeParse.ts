import type { ChangeItem, LearningItem } from "./schema";

type LLMOutput = {
  outputMarkdown: string;
  changes: ChangeItem[];
  learning: LearningItem[];
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

  // 4) Fallback: treat the whole response as markdown output
  return {
    outputMarkdown: raw.trim(),
    changes: [],
    learning: [],
    parseWarning: "Impossible de parser la réponse structurée du LLM. Explications indisponibles.",
  };
}

function normalize(obj: Record<string, unknown>): LLMOutput {
  return {
    outputMarkdown: typeof obj.outputMarkdown === "string" ? obj.outputMarkdown : "",
    changes: Array.isArray(obj.changes) ? obj.changes.map(normalizeChange) : [],
    learning: Array.isArray(obj.learning) ? obj.learning.map(normalizeLearning) : [],
  };
}

function normalizeChange(item: Record<string, unknown>, index: number): ChangeItem {
  return {
    id: typeof item.id === "string" ? item.id : `c${index}`,
    category: validateCategory(item.category) ?? "style",
    before: String(item.before ?? ""),
    after: String(item.after ?? ""),
    explanation: String(item.explanation ?? ""),
    rule: typeof item.rule === "string" ? item.rule : undefined,
    severity: item.severity === "important" ? "important" : "info",
  };
}

function normalizeLearning(item: Record<string, unknown>, index: number): LearningItem {
  return {
    id: typeof item.id === "string" ? item.id : `l${index}`,
    title: String(item.title ?? ""),
    explanation: String(item.explanation ?? ""),
    exampleBefore: typeof item.exampleBefore === "string" ? item.exampleBefore : undefined,
    exampleAfter: typeof item.exampleAfter === "string" ? item.exampleAfter : undefined,
    category: validateCategory(item.category) ?? "style",
  };
}

const VALID_CATEGORIES = new Set([
  "spelling", "grammar", "punctuation", "style", "clarity",
  "concision", "tone", "translation", "anglicism", "formatting",
]);

function validateCategory(val: unknown): ChangeItem["category"] | undefined {
  if (typeof val === "string" && VALID_CATEGORIES.has(val)) {
    return val as ChangeItem["category"];
  }
  return undefined;
}
