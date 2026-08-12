import { useActiveRun } from '@/shared/active-run';
import { useRuns } from '../hooks/use-runs';
import { cn } from '@/lib/utils';

/**
 * The active-Run chip in the shell header (ADR 0044, PR-10). **Display-only** — it shows
 * which Run the user is currently working on in the funnel, so they don't have to return to the Dashboard to
 * confirm. Switching happens via the Dashboard (Create/Continue); an in-funnel switcher
 * is deferred (Later).
 *
 * No active Run → the chip doesn't render (the Dashboard is where you pick).
 * A long name → `truncate` + `title` (hover) — PR-15.
 *
 * Token: `--brand-400` (DESIGN.md: „chips, selected states" z ciemnym tekstem), pill
 * `rounded-full`, Nunito (pixel face tylko dla celebrcji).
 */
export function ActiveRunChip({ className }: { className?: string }) {
  const { activeRunId } = useActiveRun();
  const { getRun } = useRuns();
  const run = activeRunId ? getRun(activeRunId) : undefined;
  if (!run) return null;

  return (
    <span
      aria-label={`Active run: ${run.name}`}
      title={run.name}
      className={cn(
        'inline-flex max-w-[14rem] items-center gap-1.5 rounded-full bg-brand-400 px-3 py-1',
        'text-xs font-semibold text-foreground',
        className,
      )}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-brand-700" />
      <span className="truncate">{run.name}</span>
    </span>
  );
}
