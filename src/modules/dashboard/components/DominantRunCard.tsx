import { Link } from 'react-router-dom';
import { Archive, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  formatDuration,
  isRunCompleted,
  runProgress,
  runRemaining,
  STEP_LABEL,
} from '@/modules/run/types/run';
import { formatMinutes } from '@/shared/format';
import type { Run } from '@/modules/run/types/run';

interface DominantRunCardProps {
  run: Run;
  onContinue: () => void;
  onStartNew: () => void;
  /** Archiving a completed dominant (harden #1). */
  onArchive: () => void;
}

/**
 * The dominant card of the most-recently-worked Run — the heart of the dashboard's "runway"
 * (ADR 0026). Progress front and center (a large bar + % + breakdown), Continue
 * as the primary CTA, Details secondary, "+ new run" next to it as a third action.
 * Stat tiles deliberately omitted — this is a runway, not a stats page (that's Details).
 */
export function DominantRunCard({ run, onContinue, onStartNew, onArchive }: DominantRunCardProps) {
  const progress = runProgress(run);
  const remaining = runRemaining(run);
  const completed = isRunCompleted(run);

  return (
    <section
      aria-label={`Latest run: ${run.name}`}
      className="space-y-5 rounded-xl border bg-card p-6 shadow-sm"
    >
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Continue where you left off
        </p>
        <Link
          to={`/run/${run.id}`}
          title={run.name}
          className="block truncate text-xl font-semibold tracking-tight hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded"
        >
          {run.name}
        </Link>
        <p className="text-sm text-muted-foreground">
          {completed ? (
            <span className="font-medium text-emerald-700 dark:text-emerald-400">Run complete</span>
          ) : (
            <>
              Resumes at: <span className="font-medium text-foreground">{STEP_LABEL[run.lastReachedStep]}</span>
            </>
          )}
        </p>
      </div>

      {/* Progress front and center — the main motivator (ADR 0026). */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-2xl font-semibold tabular-nums">{progress}%</span>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${progress}%, ${run.stats.doneCount} of ${run.stats.totalTasks} done`}
        >
          <div
            className={`h-full rounded-full ${completed ? 'bg-emerald-500' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {run.stats.totalTasks === 0 ? (
          // harden #3: a fresh run with no tasks — an inviting line instead of a zero-breakdown.
          <p className="text-sm text-muted-foreground">
            No tasks yet — <span className="font-medium text-foreground">start with a brain dump</span>.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground tabular-nums">
            <span className="font-medium text-foreground">{run.stats.doneCount}</span> of{' '}
            {run.stats.totalTasks} done ·{' '}
            <span className="font-medium text-foreground">{remaining}</span> left ·{' '}
            {formatDuration(run.stats.timeSpentSec)} in focus
            {run.stats.estimatedTotalMin > 0 && (
              <>
                {' '}· ~<span className="font-medium text-foreground">{formatMinutes(run.stats.estimatedTotalMin)}</span> estimated
              </>
            )}
          </p>
        )}
      </div>

      {/* harden #1: a completed dominant → Archive (primary); otherwise Continue (primary). */}
      <div className="flex flex-wrap items-center gap-2">
        {completed ? (
          <Button size="lg" onClick={onArchive}>
            <Archive /> Archive this run
          </Button>
        ) : (
          <Button size="lg" onClick={onContinue}>
            Continue
          </Button>
        )}
        <Link to={`/run/${run.id}`} className={cn(buttonVariants({ variant: 'outline' }))}>
          Details
        </Link>
        <Button variant="ghost" size="sm" onClick={onStartNew}>
          <Plus /> new run
        </Button>
      </div>
    </section>
  );
}
