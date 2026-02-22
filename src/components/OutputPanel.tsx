import { useState } from "react";

type OutputPanelProps = {
  markdown: string;
  loading: boolean;
};

function parseSubject(markdown: string): { subject: string | null; body: string } {
  const match = markdown.match(/^Subject:\s*(.+)\n/i);
  if (!match) return { subject: null, body: markdown };
  return {
    subject: match[1]!.trim(),
    body: markdown.slice(match[0].length).replace(/^\n/, ""),
  };
}

export default function OutputPanel({ markdown, loading }: OutputPanelProps) {
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const label = (
    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
      Résultat (Markdown)
    </label>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-1 min-h-0">
        {label}
        <div className="w-full flex-1 min-h-[200px] rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Correction en cours...
          </div>
        </div>
      </div>
    );
  }

  if (!markdown) {
    return (
      <div className="flex flex-col gap-1 min-h-0">
        {label}
        <div className="w-full flex-1 min-h-[200px] rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 flex items-center justify-center">
          <span className="text-sm text-zinc-400">Le résultat apparaîtra ici</span>
        </div>
      </div>
    );
  }

  const { subject, body } = parseSubject(markdown);

  async function handleCopySubject() {
    if (!subject) return;
    await navigator.clipboard.writeText(subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  }

  async function handleCopyBody() {
    await navigator.clipboard.writeText(body);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  }

  return (
    <div className="flex flex-col gap-1 min-h-0">
      {label}
      {subject && (
        <div className="flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-1.5">
          <span className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400 shrink-0">Objet</span>
          <span className="text-sm text-blue-900 dark:text-blue-200 flex-1 truncate">{subject}</span>
          <button
            onClick={handleCopySubject}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            {copiedSubject ? "Copié" : "Copier"}
          </button>
        </div>
      )}
      <div className="relative w-full flex-1 min-h-[200px] rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-y-auto">
        <button
          onClick={handleCopyBody}
          className="absolute top-2 right-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:underline"
        >
          {copiedBody ? "Copié !" : "Copier"}
        </button>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans px-3 py-2 pr-16">{body}</pre>
      </div>
    </div>
  );
}
