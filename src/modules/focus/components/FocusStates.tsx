import { AlertTriangle, Play, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Auxiliary `focus` states at the container level (FocusView) — split out as
 * presentational components so each gets its own story (empty/error/undo/resume).
 */

interface DismissUndoToastProps {
  text: string;
  onUndo: () => void;
}

/**
 * Dismiss undo toast (#3). Lives at the FocusView level (not FocusTaskScreen), so
 * it survives the jump to the summary when the last task is dismissed (ADR 0017 promises undo).
 */
export function DismissUndoToast({ text, onUndo }: DismissUndoToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 flex w-[min(92vw,30rem)] -translate-x-1/2 items-center gap-2 rounded-lg border bg-background px-4 py-2 shadow-lg"
    >
      <span className="min-w-0 flex-1 truncate text-sm">Marked "{text}" as not relevant.</span>
      <Button type="button" variant="link" size="sm" onClick={onUndo}>
        Undo
      </Button>
    </div>
  );
}

interface SessionResumeBannerProps {
  /** Position (1-based) in the interrupted session. */
  position: number;
  total: number;
  onResume: () => void;
  onAbandon: () => void;
}

/**
 * Session resume banner (#2). Appears above the filter when entering `/focus`
 * with a persisted snapshot of an interrupted session. Opt-in — does not drop the
 * user into the middle of a session without asking (Exit / refresh / browser-back).
 */
export function SessionResumeBanner({ position, total, onResume, onAbandon }: SessionResumeBannerProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-400/40 bg-brand-300/30 px-4 py-3">
      <Play className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <p className="min-w-0 flex-1 text-sm">
        You have a paused session <span className="font-semibold tabular-nums">{position}/{total}</span> — resume from the
        same task?
      </p>
      <Button type="button" size="sm" onClick={onResume}>
        Resume session
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onAbandon}>
        Discard
      </Button>
    </div>
  );
}

interface ReadErrorStateProps {
  onReload: () => void;
}

/**
 * Storage read error state (#10). When `readError` — the hook falls back to `[]`,
 * which without this state showed a misleading list empty-state ("no attributes").
 * Here: a clear failure message + refresh (localStorage is read once, at startup).
 */
export function ReadErrorState({ onReload }: ReadErrorStateProps) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-8 text-center">
      <AlertTriangle className="mx-auto size-6 text-destructive" aria-hidden />
      <h2 className="mt-2 text-lg font-semibold">Couldn't load your tasks</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Saved data may be corrupted. Refresh the page — if it keeps happening, clear your browser storage.
      </p>
      <Button type="button" variant="outline" className="mt-4" onClick={onReload}>
        <RotateCw /> Refresh
      </Button>
    </div>
  );
}
