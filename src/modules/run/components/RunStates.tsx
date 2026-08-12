import { AlertTriangle, Archive, CheckCircle2, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Auxiliary `run` states split out as presentational components — so each
 * has its own story (read-error / completed). Neutral shadcn — a celebratory
 * visual treatment is a future `proto-design`.
 */

interface RunReadErrorProps {
  onReload: () => void;
}

/**
 * A storage read-error state (LE-1). On `readError`, the hook falls back to `[]`,
 * which without this state showed a misleading list empty-state ("no runs"). Here: a clear
 * failure message + refresh (localStorage read once, on start).
 */
export function RunReadError({ onReload }: RunReadErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/10 p-8 text-center"
    >
      <AlertTriangle className="mx-auto size-6 text-destructive" aria-hidden />
      <h2 className="mt-2 text-lg font-semibold">Couldn't load your runs</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Saved data may be corrupted. Refresh the page — if it keeps happening,
        switch scenarios in the dev toolbar.
      </p>
      <Button type="button" variant="outline" className="mt-4" onClick={onReload}>
        <RotateCw /> Refresh
      </Button>
    </div>
  );
}

interface RunCompletedProps {
  onArchive: () => void;
}

/**
 * The completed-Run state (ST-1). All tasks done → celebration + a natural
 * next action (archive). It replaces the "Continue" section on Details, because
 * continuing makes no sense when there's nothing left to do.
 */
export function RunCompleted({ onArchive }: RunCompletedProps) {
  return (
    <section
      // Earned celebration moment (DESIGN.md motion #1): brand-green wash + scale-in.
      // Pixel face stays reserved for `focus`; here Nunito extrabold carries the joy.
      className="animate-celebrate space-y-4 rounded-xl border border-brand-400/50 bg-brand-300/60 p-6"
      aria-label="Run complete"
    >
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-10 shrink-0 text-brand-700" aria-hidden />
        <div className="space-y-0.5">
          <h3 className="text-xl font-extrabold tracking-tight text-brand-700">Run complete</h3>
          <p className="text-sm text-muted-foreground">
            Every task in this run is done. Archive it to keep the win in your history.
          </p>
        </div>
      </div>
      <Button type="button" size="lg" onClick={onArchive}>
        <Archive /> Archive this run
      </Button>
    </section>
  );
}
