import type { LearningItem } from "@/lib/schema";

type LearningPanelProps = {
  items: LearningItem[];
};

export default function LearningPanel({ items }: LearningPanelProps) {
  if (items.length === 0) {
    return (
      <div className="text-sm text-zinc-400 py-4 text-center">
        Aucun point d&apos;apprentissage
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-md border border-zinc-200 dark:border-zinc-700 p-3 text-sm"
        >
          <h4 className="font-medium text-zinc-800 dark:text-zinc-200 mb-1">
            {item.title}
          </h4>
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">{item.explanation}</p>
          {(item.exampleBefore || item.exampleAfter) && (
            <div className="flex flex-col gap-1 text-xs">
              {item.exampleBefore && (
                <div className="flex items-start gap-2">
                  <span className="text-zinc-400 shrink-0">avant</span>
                  <span className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded px-1.5 py-0.5">
                    {item.exampleBefore}
                  </span>
                </div>
              )}
              {item.exampleAfter && (
                <div className="flex items-start gap-2">
                  <span className="text-zinc-400 shrink-0">après</span>
                  <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded px-1.5 py-0.5">
                    {item.exampleAfter}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
