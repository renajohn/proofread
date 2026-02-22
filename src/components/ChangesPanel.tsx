import type { ChangeItem } from "@/lib/schema";

type ChangesPanelProps = {
  changes: ChangeItem[];
};

const CATEGORY_COLORS: Record<string, string> = {
  spelling: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  grammar: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  punctuation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  style: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  clarity: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  concision: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  tone: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  translation: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  anglicism: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  formatting: "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300",
};

export default function ChangesPanel({ changes }: ChangesPanelProps) {
  if (changes.length === 0) {
    return (
      <div className="text-sm text-zinc-400 py-4 text-center">
        Aucun changement à afficher
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {changes.map((item) => (
        <div
          key={item.id}
          className="rounded-md border border-zinc-200 dark:border-zinc-700 p-3 text-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.style}`}
            >
              {item.category}
            </span>
            {item.severity === "important" && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                important
              </span>
            )}
            {item.rule && (
              <span className="text-xs text-zinc-400 italic">{item.rule}</span>
            )}
          </div>
          <div className="flex flex-col gap-1 mb-2">
            <div className="flex items-start gap-2">
              <span className="text-xs text-zinc-400 mt-0.5 shrink-0">avant</span>
              <span className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded px-1.5 py-0.5 line-through">
                {item.before}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs text-zinc-400 mt-0.5 shrink-0">après</span>
              <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded px-1.5 py-0.5">
                {item.after}
              </span>
            </div>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">{item.explanation}</p>
        </div>
      ))}
    </div>
  );
}
