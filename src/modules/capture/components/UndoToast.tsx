import { Button } from '@/components/ui/button';

interface UndoToastProps {
  /** Text of the most recently deleted stressor. */
  text: string;
  /** How many deleted entries are still undoable (including the one shown). */
  remaining: number;
  onUndo: () => void;
}

/**
 * "Undo delete" toast — handles a stack of rapid deletions: shows the most recent one,
 * and after undoing it the next one appears. `remaining` > 1 signals more in the stack.
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
