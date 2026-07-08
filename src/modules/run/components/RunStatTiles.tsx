import { formatDuration, runProgress, runRemaining } from '../types/run';
import { formatMinutes } from '@/shared/format';
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
        {/* Łączny czas szacunkowy — rozmiar pracy (ADR 0060). Brak szacunków → „—". */}
        <Tile value={totalEst > 0 ? formatMinutes(totalEst) : '—'} label="estimated" />
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

      {/* Pozostały szacunek — ile pracy zostało (ADR 0060). Guard `remEst > 0` (ET-1): ukryj, gdy
          nie ma już wyestymowanej pracy (Run ukończony / wszystkie wyestymowane done). Prefiks
          „Estimated:" scope'uje linię (ET-2) — odróżnia od licznika tasków „N left" wyżej. */}
      {totalEst > 0 && remEst > 0 && (
        <p className="text-sm text-muted-foreground tabular-nums">
          Estimated: ~<span className="font-medium text-foreground">{formatMinutes(remEst)}</span> left of ~
          <span className="font-medium text-foreground">{formatMinutes(totalEst)}</span>
        </p>
      )}

      {/* Statystyki liczone na żywo z tasków lejka (run/stats.ts). Prototype: dane globalne,
          nie per-Run — pełne spięcie per-Run odłożone (ADR 0020). */}
      <p className="text-xs text-muted-foreground/80">
        Live stats from your tasks — per-run breakdown comes later.
      </p>
    </div>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
