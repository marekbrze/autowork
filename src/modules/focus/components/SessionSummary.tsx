import { Check, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { formatClock } from '../types/focus';

interface SummaryItem {
  id: string;
  text: string;
}

interface CompletedItem extends SummaryItem {
  seconds: number;
}

interface SessionSummaryProps {
  completed: CompletedItem[];
  dismissed: SummaryItem[];
  totalSeconds: number;
  onClearCompleted: () => void;
  onNewSession: () => void;
}

/**
 * Ekran podsumowania (krok 7 — celebracja). Zrobione taski + łączny czas +
 * „Nieaktualne" w osobnej sekcji + „Usuń skończone" (czyści completed i
 * dismissed — ADR 0017). Prezentacyjny.
 *
 * DESIGN: moment sygnaturowy — przy ≥1 zrobionym tasku pixel „LEVEL UP!" na
 * zielonym arcade-banerze + animacja `celebrate` (reduced-motion → instant).
 */
export function SessionSummary({ completed, dismissed, totalSeconds, onClearCompleted, onNewSession }: SessionSummaryProps) {
  const hasResolved = completed.length > 0 || dismissed.length > 0;
  const celebrate = completed.length > 0;

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'rounded-2xl border p-8 text-center',
          celebrate ? 'animate-celebrate border-brand-300 bg-card shadow-sm' : 'border-dashed',
        )}
      >
        {celebrate && (
          <>
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-brand-700 text-primary-foreground ring-4 ring-brand-300/60">
              <Check className="size-8" />
            </div>
            <span
              className="inline-block rounded-lg bg-brand-700 px-4 py-2 font-pixel leading-none text-primary-foreground"
              style={{ fontSize: 'clamp(1rem, 6vw, 1.5rem)' }}
            >
              LEVEL UP!
            </span>
          </>
        )}
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
          {celebrate ? 'Session complete' : 'End of session'}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {celebrate ? (
            <>
              You did <strong className="text-foreground tabular-nums">{completed.length}</strong>{' '}
              {pluralTask(completed.length)} · time{' '}
              <strong className="text-foreground tabular-nums">{formatClock(totalSeconds)}</strong>
            </>
          ) : dismissed.length > 0 ? (
            'Nothing got done this time — only no-longer-relevant items set aside.'
          ) : (
            'Nothing got done this time — everything was set aside.'
          )}
        </p>
      </div>

      {completed.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">Done ({completed.length})</h3>
          <ul className="divide-y rounded-xl border bg-card">
            {completed.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="min-w-0 truncate" title={t.text}>
                  {t.text}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-muted-foreground">{formatClock(t.seconds)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dismissed.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">Not relevant ({dismissed.length})</h3>
          <ul className="divide-y rounded-xl border bg-card">
            {dismissed.map((t) => (
              <li key={t.id} className="px-3 py-2.5 text-sm text-muted-foreground line-through">
                {t.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasResolved && (
        <Button type="button" variant="destructive" className="h-11" onClick={onClearCompleted}>
          <Trash2 /> Delete finished
        </Button>
      )}

      <div>
        <Button type="button" variant="ghost" onClick={onNewSession}>
          New session
        </Button>
      </div>
    </div>
  );
}

/** English plural for "task": 1 task, otherwise tasks. */
function pluralTask(n: number): string {
  return n === 1 ? 'task' : 'tasks';
}
