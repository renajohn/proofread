import { useState, useEffect, useCallback, useRef } from "react";
import type {
  Mode,
  TonePreset,
  RewriteStrength,
  Lang,
} from "@/lib/schema";
import Sidebar from "@/components/Sidebar";
import EditorPanel from "@/components/EditorPanel";
import OutputPanel from "@/components/OutputPanel";
import ClipboardCallout from "@/components/ClipboardCallout";

const STORAGE_KEY = "proofread-settings";

type PersistedSettings = {
  mode: Mode;
  tonePreset: TonePreset;
  rewriteStrength: RewriteStrength;
  targetLang: Lang;
  customInstructions: string;
  emailMode: boolean;
  autoCopy: boolean;
};

function loadSettings(): Partial<PersistedSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const saved = loadSettings();

export default function App() {
  // Sidebar state (restored from localStorage)
  const [mode, setMode] = useState<Mode>(saved.mode ?? "proofread");
  const [tonePreset, setTonePreset] = useState<TonePreset>(saved.tonePreset ?? "neutral_pro");
  const [rewriteStrength, setRewriteStrength] = useState<RewriteStrength>(saved.rewriteStrength ?? "light");
  const [targetLang, setTargetLang] = useState<Lang>(saved.targetLang ?? "en");
  const [customInstructions, setCustomInstructions] = useState(saved.customInstructions ?? "");
  const [emailMode, setEmailMode] = useState(saved.emailMode ?? false);
  const [autoCopy, setAutoCopy] = useState(saved.autoCopy ?? false);

  // Editor state
  const [inputText, setInputText] = useState("");
  const [outputMarkdown, setOutputMarkdown] = useState("");
  const [explanation, setExplanation] = useState("");
  const [clipboardText, setClipboardText] = useState<string | null>(null);
  const dismissedClipRef = useRef<string | null>(null);

  // Read clipboard on mount + whenever the tab regains focus
  useEffect(() => {
    function readClipboard() {
      if (!navigator.clipboard?.readText) return;
      navigator.clipboard.readText().then((text) => {
        if (text.trim() && text.trim() !== dismissedClipRef.current?.trim()) {
          setClipboardText(text);
        }
      }).catch(() => {});
    }

    readClipboard();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") readClipboard();
    }

    window.addEventListener("focus", readClipboard);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", readClipboard);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [autoCopied, setAutoCopied] = useState(false);

  // Persist sidebar settings to localStorage
  useEffect(() => {
    const settings: PersistedSettings = { mode, tonePreset, rewriteStrength, targetLang, customInstructions, emailMode, autoCopy };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [mode, tonePreset, rewriteStrength, targetLang, customInstructions, emailMode, autoCopy]);

  const handleSubmit = useCallback(async (overrideText?: string) => {
    const text = overrideText ?? inputText;
    if (!text.trim() || loading) return;

    setLoading(true);
    setError(null);
    setOutputMarkdown("");
    setExplanation("");
    setLatencyMs(null);

    const tl = mode === "translate_proofread" ? targetLang : undefined;

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          inputText: text,
          tonePreset,
          customInstructions: customInstructions || undefined,
          rewriteStrength,
          targetLang: tl,
          emailMode: emailMode || undefined,
          outputFormat: "markdown" as const,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setOutputMarkdown(data.outputMarkdown);
      setExplanation(data.explanation ?? "");
      setLatencyMs(data.meta.latencyMs);

      if (autoCopy && navigator.clipboard?.writeText) {
        const bodyMatch = (data.outputMarkdown as string).match(/^Subject:\s*.+\n\n?/i);
        const body = bodyMatch ? (data.outputMarkdown as string).slice(bodyMatch[0].length) : data.outputMarkdown;
        navigator.clipboard.writeText(body).then(() => {
          setAutoCopied(true);
          setTimeout(() => setAutoCopied(false), 2000);
        }).catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, mode, targetLang, tonePreset, customInstructions, rewriteStrength, emailMode, autoCopy]);

  function handleClipboardCorrect() {
    if (!clipboardText) return;
    setInputText(clipboardText);
    dismissedClipRef.current = clipboardText;
    setClipboardText(null);
    handleSubmit(clipboardText);
  }

  return (
    <div className="flex h-screen">
      {/* Main content */}
      <main className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto min-w-0">
        <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Proofread
        </h1>

        {clipboardText && clipboardText.trim() !== inputText.trim() && (
          <ClipboardCallout
            text={clipboardText}
            loading={loading}
            onCorrect={handleClipboardCorrect}
            onDismiss={() => { dismissedClipRef.current = clipboardText; setClipboardText(null); }}
          />
        )}

        {/* Side by side on large screens, stacked on small */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <EditorPanel value={inputText} onChange={setInputText} />
          <OutputPanel markdown={outputMarkdown} loading={loading} autoCopied={autoCopied} />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {explanation && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">{explanation}</p>
            {latencyMs !== null && (
              <p className="mt-1 text-xs text-blue-500 dark:text-blue-400">
                {(latencyMs / 1000).toFixed(1)}s
              </p>
            )}
          </div>
        )}
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
          autoCopy={autoCopy}
          onAutoCopyChange={setAutoCopy}
          onSubmit={() => handleSubmit()}
          loading={loading}
        />
      </div>
    </div>
  );
}
