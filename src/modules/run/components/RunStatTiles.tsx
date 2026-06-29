import { formatDuration, isRunCompleted, runProgress, runRemaining } from '../types/run';
import type { Run } from '../types/run';

interface RunStatTilesProps {
  run: Run;
}

/**
 * Kafelki dużych liczb — rdzeń „widocznego obiektu ze statystykami" (ADR 0020):
 * czas w focus · wykonane/zostało · progres %, plus pasek progresem i rozbicie.
 */
export function RunStatTiles({ run }: RunStatTilesProps) {
  const progress = runProgress(run);
  const remaining = runRemaining(run);
  const completed = isRunCompleted(run);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Tile value={formatDuration(run.stats.timeSpentSec)} label="w focus" />
        <Tile
          value={`${run.stats.doneCount} / ${run.stats.totalTasks}`}
          label="wykonane"
        />
        <Tile value={`${progress}%`} label="progres" />
      </div>

      {/* Pasek progresem */}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progres: ${progress}%`}
      >
        <div
          className={`h-full rounded-full transition-all ${completed ? 'bg-emerald-500' : 'bg-primary'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Rozbicie */}
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{run.stats.doneCount}</span> wykonane ·{' '}
        <span className="font-medium text-foreground">{run.stats.dismissedCount}</span> nieaktualne ·{' '}
        <span className="font-medium text-foreground">{remaining}</span> zostały
      </p>
    </div>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
