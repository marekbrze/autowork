import { Check, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

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
 */
export function SessionSummary({ completed, dismissed, totalSeconds, onClearCompleted, onNewSession }: SessionSummaryProps) {
  const hasResolved = completed.length > 0 || dismissed.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-dashed p-8 text-center">
        {completed.length > 0 && (
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check />
          </div>
        )}
        <h2 className="text-xl font-semibold tracking-tight">
          {completed.length > 0 ? 'Sesja zakończona' : 'Koniec sesji'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {completed.length > 0 ? (
            <>
              Zrobiłeś <strong className="text-foreground tabular-nums">{completed.length}</strong>{' '}
              {pluralZadanie(completed.length)} · czas{' '}
              <strong className="text-foreground tabular-nums">{formatClock(totalSeconds)}</strong>
            </>
          ) : dismissed.length > 0 ? (
            'Nic nie zostało zrobione teraz — tylko nieaktualne odłożone.'
          ) : (
            'Nic nie zostało zrobione teraz — wszystko odłożone.'
          )}
        </p>
      </div>

      {completed.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Zrobione ({completed.length})
          </h3>
          <ul className="divide-y rounded-lg border">
            {completed.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 truncate" title={t.text}>
                  {t.text}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{formatClock(t.seconds)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dismissed.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Nieaktualne ({dismissed.length})
          </h3>
          <ul className="divide-y rounded-lg border">
            {dismissed.map((t) => (
              <li key={t.id} className="px-3 py-2 text-sm text-muted-foreground line-through">
                {t.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasResolved && (
        <Button type="button" variant="destructive" onClick={onClearCompleted}>
          <Trash2 /> Usuń skończone
        </Button>
      )}

      <div>
        <Button type="button" variant="ghost" onClick={onNewSession}>
          Nowa sesja
        </Button>
      </div>
    </div>
  );
}

/** Polska odmiana „zadanie". */
function pluralZadanie(n: number): string {
  if (n === 1) return 'zadanie';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'zadania';
  return 'zadań';
}
