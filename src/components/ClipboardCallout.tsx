type ClipboardCalloutProps = {
  text: string;
  loading: boolean;
  onCorrect: () => void;
  onDismiss: () => void;
};

export default function ClipboardCallout({ text, loading, onCorrect, onDismiss }: ClipboardCalloutProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
          Presse-papier
        </p>
        <p className="text-sm text-blue-900 dark:text-blue-100 line-clamp-2 whitespace-pre-line">
          {text}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        <button
          onClick={onCorrect}
          disabled={loading}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Corriger
        </button>
        <button
          onClick={onDismiss}
          className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          aria-label="Fermer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
