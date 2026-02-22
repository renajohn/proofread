import { INPUT_MAX_CHARS } from "@/lib/schema";

type EditorPanelProps = {
  value: string;
  onChange: (v: string) => void;
};

export default function EditorPanel({ value, onChange }: EditorPanelProps) {
  const isOverLimit = value.length > INPUT_MAX_CHARS;

  return (
    <div className="flex flex-col gap-1 min-h-0">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Texte à relire / traduire
        </label>
        <span className={`text-xs ${isOverLimit ? "text-amber-600 font-medium" : "text-zinc-400"}`}>
          {value.length.toLocaleString()} / {INPUT_MAX_CHARS.toLocaleString()} chars
          {isOverLimit && " — texte long, la réponse pourrait être plus lente"}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Collez votre texte ici..."
        className="w-full flex-1 min-h-[200px] rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}
