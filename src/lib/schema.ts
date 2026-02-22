export type Mode = "proofread" | "translate_proofread";

export type TonePreset =
  | "executive"
  | "neutral_pro"
  | "diplomatic"
  | "casual"
  | "friendly"
  | "funny"
  | "very_concise"
  | "very_clear";

export type RewriteStrength = "none" | "light" | "medium" | "strong";

export type Lang = "fr" | "en" | "de";

export type ProcessRequest = {
  mode: Mode;
  inputText: string;
  tonePreset: TonePreset;
  customInstructions?: string;
  rewriteStrength: RewriteStrength;
  targetLang?: Lang;
  emailMode?: boolean;
  outputFormat: "markdown";
};

export type ChangeCategory =
  | "spelling"
  | "grammar"
  | "punctuation"
  | "style"
  | "clarity"
  | "concision"
  | "tone"
  | "translation"
  | "anglicism"
  | "formatting";

export type ChangeItem = {
  id: string;
  category: ChangeCategory;
  before: string;
  after: string;
  explanation: string;
  rule?: string;
  severity: "info" | "important";
  location?: {
    startChar?: number;
    endChar?: number;
    sentenceIndex?: number;
  };
};

export type LearningItem = {
  id: string;
  title: string;
  explanation: string;
  exampleBefore?: string;
  exampleAfter?: string;
  category: ChangeCategory;
};

export type ProcessResponse = {
  outputMarkdown: string;
  changes: ChangeItem[];
  learning: LearningItem[];
  meta: {
    detectedSourceLang?: Lang;
    targetLang?: Lang;
    rewriteStrength: RewriteStrength;
    tonePreset: TonePreset;
    model: string;
    latencyMs: number;
  };
};

export const TONE_LABELS: Record<TonePreset, string> = {
  executive: "Directeur / Executive",
  neutral_pro: "Professionnel neutre",
  diplomatic: "Diplomatique",
  casual: "Casual",
  friendly: "Amical",
  funny: "Drôle / léger",
  very_concise: "Très concis",
  very_clear: "Très clair / pédagogique",
};

export const LANG_LABELS: Record<Lang, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
};

export const REWRITE_LABELS: Record<RewriteStrength, string> = {
  none: "None",
  light: "Light",
  medium: "Medium",
  strong: "Strong",
};

export const INPUT_MAX_CHARS = 12000;
export const MAX_CHANGES = 25;
export const MAX_LEARNING_ITEMS = 5;
