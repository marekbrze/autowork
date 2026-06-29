import { AlertTriangle, Play, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Stany pomocnicze `focus` na poziomie kontenera (FocusView) — wydzielone jako
 * komponenty prezentacyjne, by każdy miał osobną story (empty/error/undo/resume).
 */

interface DismissUndoToastProps {
  text: string;
  onUndo: () => void;
}

/**
 * Toast undo Dismiss (#3). Żyje na poziomie FocusView (nie FocusTaskScreen), więc
 * przeżywa skok do podsumowania przy dismiss ostatniego taska (ADR 0017 obiecuje undo).
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
  /** Pozycja (1-based) w przerwanej sesji. */
  position: number;
  total: number;
  onResume: () => void;
  onAbandon: () => void;
}

/**
 * Banner wznawiania sesji (#2). Pojawia się nad filtrem, gdy wejściu w `/focus`
 * towarzyszy persystowany snapshot przerwanej sesji. Opt-in — nie wrzuca usera
 * w środek sesji bez pytania (Exit / refresh / browser-back).
 */
export function SessionResumeBanner({ position, total, onResume, onAbandon }: SessionResumeBannerProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
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
 * Stan błędu odczytu storage (#10). Gdy `readError` — hook fallbackuje do `[]`, co
 * bez tego stanu pokazywało mylny empty-state listy („brak atrybutów"). Tu: jasny
 * komunikat awarii + odśwież (localStorage czytany raz, przy starcie).
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
