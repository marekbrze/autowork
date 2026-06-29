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
import type { Run } from '@/modules/run/types/run';

interface DominantRunCardProps {
  run: Run;
  onContinue: () => void;
  onStartNew: () => void;
  /** Archiwizacja ukończonego dominantu (harden #1). */
  onArchive: () => void;
}

/**
 * Dominująca karta ostatnio-pracowanego Runa — serce „pasa startowego" dashboardu
 * (ADR 0026). Progres na pierwszym planie (duży pasek + % + rozbicie), Kontynuuj
 * jako primary CTA, Szczegóły secondary, „+ nowy przejazd" obok jako akcja trzecia.
 * Kafelki statystyk celowo pominięte — to runway, nie strona statystyk (to Szczegóły).
 */
export function DominantRunCard({ run, onContinue, onStartNew, onArchive }: DominantRunCardProps) {
  const progress = runProgress(run);
  const remaining = runRemaining(run);
  const completed = isRunCompleted(run);

  return (
    <section
      aria-label={`Ostatni Run: ${run.name}`}
      className="space-y-5 rounded-xl border bg-card p-6 shadow-sm"
    >
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Kontynuuj, gdzie skończyłeś
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
            <span className="font-medium text-emerald-700 dark:text-emerald-400">Przejazd ukończony</span>
          ) : (
            <>
              Wznowisz w: <span className="font-medium text-foreground">{STEP_LABEL[run.lastReachedStep]}</span>
            </>
          )}
        </p>
      </div>

      {/* Progres na pierwszym planie — główny motywator (ADR 0026). */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">Progres</span>
          <span className="text-2xl font-semibold tabular-nums">{progress}%</span>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progres: ${progress}%, ${run.stats.doneCount} z ${run.stats.totalTasks} wykonanych`}
        >
          <div
            className={`h-full rounded-full ${completed ? 'bg-emerald-500' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {run.stats.totalTasks === 0 ? (
          // harden #3: świeży run bez tasków — zapraszająca linijka zamiast rozbicia zer.
          <p className="text-sm text-muted-foreground">
            Jeszcze bez tasków — <span className="font-medium text-foreground">zacznij od brain dumpu</span>.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground tabular-nums">
            <span className="font-medium text-foreground">{run.stats.doneCount}</span> z{' '}
            {run.stats.totalTasks} zrobione · zostały{' '}
            <span className="font-medium text-foreground">{remaining}</span> ·{' '}
            {formatDuration(run.stats.timeSpentSec)} w focus
          </p>
        )}
      </div>

      {/* harden #1: ukończony dominant → Archiwizuj (primary); inaczej Kontynuuj (primary). */}
      <div className="flex flex-wrap items-center gap-2">
        {completed ? (
          <Button size="lg" onClick={onArchive}>
            <Archive /> Archiwizuj ten przejazd
          </Button>
        ) : (
          <Button size="lg" onClick={onContinue}>
            Kontynuuj
          </Button>
        )}
        <Link to={`/run/${run.id}`} className={cn(buttonVariants({ variant: 'outline' }))}>
          Szczegóły
        </Link>
        <Button variant="ghost" size="sm" onClick={onStartNew}>
          <Plus /> nowy przejazd
        </Button>
      </div>
    </section>
  );
}
