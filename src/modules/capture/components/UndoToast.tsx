import { Button } from '@/components/ui/button';

interface UndoToastProps {
  /** Tekst ostatnio usuniętego stresora. */
  text: string;
  /** Ile usuniętych wpisów jest jeszcze do cofnięcia (łącznie z tym pokazywanym). */
  remaining: number;
  onUndo: () => void;
}

/**
 * Toast „cofnij usunięcie" — obsługuje stos szybkich usunięć: pokazuje najnowszy,
 * a po jego cofnięciu pojawia się kolejny. `remaining` > 1 sygnalizuje więcej w stosie.
 */
export function UndoToast({ text, remaining, onUndo }: UndoToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 flex w-[min(92vw,30rem)] -translate-x-1/2 items-center gap-2 rounded-lg border bg-background px-4 py-2 shadow-lg"
    >
      <span className="min-w-0 flex-1 truncate text-sm">
        Deleted "{text}".
        {remaining > 1 && (
          <span className="text-muted-foreground"> ({remaining - 1} more to undo)</span>
        )}
      </span>
      <Button type="button" variant="link" size="sm" onClick={onUndo}>
        Undo
      </Button>
    </div>
  );
}
