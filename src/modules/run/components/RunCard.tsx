import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { formatDuration, runProgress, STEP_LABEL } from '../types/run';
import type { Run } from '../types/run';

interface RunCardProps {
  run: Run;
  /** Przyciski akcji (Kontynuuj / Szczegóły / Un-archive / Delete) — komponuje lista. */
  actions?: ReactNode;
}

/**
 * Karta Runa na listach (aktywne / archiwum). Nazwa linkuje do Szczegółów;
 * mini-progres + podpowiedź kroku resume. Akcje wstrzykiwane przez `actions`.
 */
export function RunCard({ run, actions }: RunCardProps) {
  const progress = runProgress(run);
  const isActive = run.state === 'in_progress';

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <Link
          to={`/run/${run.id}`}
          title={run.name}
          className="block truncate font-medium leading-tight hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded"
        >
          {run.name}
        </Link>
        {isActive && (
          <p className="text-xs text-muted-foreground">
            Resumes at: <span className="text-foreground">{STEP_LABEL[run.lastReachedStep]}</span>
          </p>
        )}
        {run.state === 'archived' && (
          <p className="text-xs text-muted-foreground">Archived</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`${run.stats.doneCount} of ${run.stats.totalTasks} done`}
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {run.stats.doneCount}/{run.stats.totalTasks} · {formatDuration(run.stats.timeSpentSec)}
        </p>
      </div>

      {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
    </div>
  );
}
