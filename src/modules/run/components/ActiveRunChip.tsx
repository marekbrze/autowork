import { useActiveRun } from '@/shared/active-run';
import { useRuns } from '../hooks/use-runs';
import { cn } from '@/lib/utils';

/**
 * Chip aktywnego Runa w nagłówku shellu (ADR 0044, PR-10). **Display-only** — pokazuje,
 * którym Runem user aktualnie pracuje w lejku, żeby nie musiał wracać na Dashboard, by
 * się upewnić. Switching odbywa się przez Dashboard (Create/Continue); in-funnel switcher
 * odłożony (Later).
 *
 * Brak aktywnego Runa → chip się nie renderuje (Dashboard jest miejscem wyboru).
 * Długa nazwa → `truncate` + `title` (hover) — PR-15.
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
