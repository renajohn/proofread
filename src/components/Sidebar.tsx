import type { Mode, TonePreset, RewriteStrength, Lang } from "@/lib/schema";
import { TONE_LABELS, REWRITE_LABELS, LANG_LABELS } from "@/lib/schema";

const REWRITE_STEPS: RewriteStrength[] = ["none", "light", "medium", "strong"];

type SidebarProps = {
  mode: Mode;
  tonePreset: TonePreset;
  rewriteStrength: RewriteStrength;
  targetLang: Lang;
  customInstructions: string;
  emailMode: boolean;
  autoCopy: boolean;
  onModeChange: (v: Mode) => void;
  onToneChange: (v: TonePreset) => void;
  onRewriteChange: (v: RewriteStrength) => void;
  onTargetLangChange: (v: Lang) => void;
  onCustomInstructionsChange: (v: string) => void;
  onEmailModeChange: (v: boolean) => void;
  onAutoCopyChange: (v: boolean) => void;
  onSubmit: () => void;
  loading: boolean;
};

export default function Sidebar({
  mode,
  tonePreset,
  rewriteStrength,
  targetLang,
  customInstructions,
  emailMode,
  autoCopy,
  onModeChange,
  onToneChange,
  onRewriteChange,
  onTargetLangChange,
  onCustomInstructionsChange,
  onEmailModeChange,
  onAutoCopyChange,
  onSubmit,
  loading,
}: SidebarProps) {
  return (
    <aside className="flex flex-col gap-5 p-5 border-l border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 overflow-y-auto">
      {/* Mode */}
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
          Mode
        </legend>
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="mode"
              value="proofread"
              checked={mode === "proofread"}
              onChange={() => onModeChange("proofread")}
              className="accent-blue-600"
            />
            Proofread
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="mode"
              value="translate_proofread"
              checked={mode === "translate_proofread"}
              onChange={() => onModeChange("translate_proofread")}
              className="accent-blue-600"
            />
            Translate + Proofread
          </label>
        </div>
      </fieldset>

      {/* Tone */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 block">
          Ton
        </label>
        <select
          value={tonePreset}
          onChange={(e) => onToneChange(e.target.value as TonePreset)}
          className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-sm"
        >
          {Object.entries(TONE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Rewrite strength */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 block">
          Réécriture — {REWRITE_LABELS[rewriteStrength]}
        </label>
        <input
          type="range"
          min={0}
          max={REWRITE_STEPS.length - 1}
          value={REWRITE_STEPS.indexOf(rewriteStrength)}
          onChange={(e) => onRewriteChange(REWRITE_STEPS[Number(e.target.value)]!)}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
          {REWRITE_STEPS.map((s) => (
            <span key={s}>{REWRITE_LABELS[s]}</span>
          ))}
        </div>
      </div>

      {/* Target language (only in translate mode) */}
      {mode === "translate_proofread" && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 block">
            Langue cible
          </label>
          <select
            value={targetLang}
            onChange={(e) => onTargetLangChange(e.target.value as Lang)}
            className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-sm"
          >
            {Object.entries(LANG_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      )}

      {/* Email mode */}
      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          checked={emailMode}
          onChange={(e) => onEmailModeChange(e.target.checked)}
          className="accent-blue-600"
        />
        Email (formules d&apos;usage)
      </label>

      {/* Auto-copy */}
      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          checked={autoCopy}
          onChange={(e) => onAutoCopyChange(e.target.checked)}
          className="accent-blue-600"
        />
        Auto-copie
      </label>

      {/* Custom instructions */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 block">
          Instructions (optionnel)
        </label>
        <textarea
          value={customInstructions}
          onChange={(e) => onCustomInstructionsChange(e.target.value)}
          placeholder="Ex: Vouvoyer le destinataire, éviter le jargon..."
          rows={3}
          className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-sm resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Correction en cours..." : "Corriger"}
        </button>
      </div>
    </aside>
  );
}
