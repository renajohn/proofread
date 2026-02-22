import { useState } from "react";
import type {
  Mode,
  TonePreset,
  RewriteStrength,
  Lang,
  ChangeItem,
  LearningItem,
} from "@/lib/schema";
import Sidebar from "@/components/Sidebar";
import EditorPanel from "@/components/EditorPanel";
import OutputPanel from "@/components/OutputPanel";
import ChangesPanel from "@/components/ChangesPanel";
import LearningPanel from "@/components/LearningPanel";

type TabId = "changes" | "learning";

export default function App() {
  // Sidebar state
  const [mode, setMode] = useState<Mode>("proofread");
  const [tonePreset, setTonePreset] = useState<TonePreset>("neutral_pro");
  const [rewriteStrength, setRewriteStrength] = useState<RewriteStrength>("light");
  const [targetLang, setTargetLang] = useState<Lang>("en");
  const [customInstructions, setCustomInstructions] = useState("");
  const [emailMode, setEmailMode] = useState(false);

  // Editor state
  const [inputText, setInputText] = useState("");
  const [outputMarkdown, setOutputMarkdown] = useState("");
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [learning, setLearning] = useState<LearningItem[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("changes");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  async function handleSubmit() {
    if (!inputText.trim() || loading) return;

    setLoading(true);
    setExplaining(true);
    setError(null);
    setParseWarning(null);
    setOutputMarkdown("");
    setChanges([]);
    setLearning([]);
    setLatencyMs(null);

    const tl = mode === "translate_proofread" ? targetLang : undefined;

    // Fire both calls in parallel
    const processPromise = fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        inputText,
        tonePreset,
        customInstructions: customInstructions || undefined,
        rewriteStrength,
        targetLang: tl,
        emailMode: emailMode || undefined,
        outputFormat: "markdown" as const,
      }),
    });

    const explainPromise = fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputText,
        mode,
        rewriteStrength,
        targetLang: tl,
      }),
    });

    // Handle corrected text as soon as it arrives
    processPromise
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setOutputMarkdown(data.outputMarkdown);
        setLatencyMs(data.meta.latencyMs);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      })
      .finally(() => {
        setLoading(false);
      });

    // Handle explanations as soon as they arrive
    explainPromise
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setChanges(data.changes ?? []);
        setLearning(data.learning ?? []);
        if (data.parseWarning) {
          setParseWarning(data.parseWarning);
        }
      })
      .catch((err) => {
        setParseWarning(
          `Explications indisponibles : ${err instanceof Error ? err.message : "erreur"}`
        );
      })
      .finally(() => {
        setExplaining(false);
      });
  }

  return (
    <div className="flex h-screen">
      {/* Main content */}
      <main className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto min-w-0">
        <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Proofread
        </h1>

        {/* Side by side on large screens, stacked on small */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <EditorPanel value={inputText} onChange={setInputText} />
          <OutputPanel markdown={outputMarkdown} loading={loading} />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {parseWarning && (
          <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {parseWarning}
          </div>
        )}

        {/* Tabs: Changes | Learning */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setActiveTab("changes")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "changes"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Changements{changes.length > 0 ? ` (${changes.length})` : ""}
            </button>
            <button
              onClick={() => setActiveTab("learning")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "learning"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Apprentissage{learning.length > 0 ? ` (${learning.length})` : ""}
            </button>
            {explaining && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-zinc-400">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyse en cours...
              </span>
            )}
            {!explaining && latencyMs !== null && (
              <span className="ml-auto text-xs text-zinc-400">
                {(latencyMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>

          {activeTab === "changes" && <ChangesPanel changes={changes} />}
          {activeTab === "learning" && <LearningPanel items={learning} />}
        </div>
      </main>

      {/* Sidebar */}
      <div className="w-64 shrink-0">
        <Sidebar
          mode={mode}
          tonePreset={tonePreset}
          rewriteStrength={rewriteStrength}
          targetLang={targetLang}
          customInstructions={customInstructions}
          onModeChange={setMode}
          onToneChange={setTonePreset}
          onRewriteChange={setRewriteStrength}
          onTargetLangChange={setTargetLang}
          onCustomInstructionsChange={setCustomInstructions}
          emailMode={emailMode}
          onEmailModeChange={setEmailMode}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
}
