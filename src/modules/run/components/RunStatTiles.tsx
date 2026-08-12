import { formatDuration, runProgress, runRemaining } from '../types/run';
import { formatMinutes } from '@/shared/format';
import type { Run } from '../types/run';

interface RunStatTilesProps {
  run: Run;
}

/**
 * Big-number tiles — the core of the "visible object with stats" (ADR 0020):
 * time in focus · done/left · progress %, plus a progress bar and a breakdown.
 */
export function RunStatTiles({ run }: RunStatTilesProps) {
  const progress = runProgress(run);
  const remaining = runRemaining(run);
  const totalEst = run.stats.estimatedTotalMin;
  const remEst = run.stats.estimatedRemainingMin;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile value={formatDuration(run.stats.timeSpentSec)} label="in focus" />
        <Tile
          value={`${run.stats.doneCount} / ${run.stats.totalTasks}`}
          label="done"
        />
        <Tile value={`${progress}%`} label="progress" />
        {/* Total estimated time — the size of the work (ADR 0060). No estimates → "—" + a tooltip
            explaining it (ET-3 a11y/clarity; otherwise a screen reader reads "estimated dash"). */}
        <Tile
          value={totalEst > 0 ? formatMinutes(totalEst) : '—'}
          label="estimated"
          title={totalEst > 0 ? undefined : 'No time estimates yet'}
        />
      </div>

      {/* Pasek progresem */}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${progress}%`}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Rozbicie */}
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{run.stats.doneCount}</span> done ·{' '}
        <span className="font-medium text-foreground">{run.stats.dismissedCount}</span> not relevant ·{' '}
        <span className="font-medium text-foreground">{remaining}</span> left
      </p>

      {/* Remaining estimate — how much work is left (ADR 0060). Guard `remEst > 0` (ET-1): hide when
          there's no estimated work left (Run completed / all estimated done). The
          "Estimated:" prefix scopes the line (ET-2) — distinguishes it from the "N left" task counter above. */}
      {totalEst > 0 && remEst > 0 && (
        <p className="text-sm text-muted-foreground tabular-nums">
          Estimated: ~<span className="font-medium text-foreground">{formatMinutes(remEst)}</span> left of ~
          <span className="font-medium text-foreground">{formatMinutes(totalEst)}</span>
        </p>
      )}
    </div>
  );
}

function Tile({ value, label, title }: { value: string; label: string; title?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center" title={title}>
      <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
