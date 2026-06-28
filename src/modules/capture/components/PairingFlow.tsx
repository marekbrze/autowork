import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { pluralize } from '@/lib/utils';

import type { Stressor } from '../types/stressor';

/**
 * Zobowiązany ciąg porównań parami („który bardziej stresuje: A czy B?").
 * Kolejność wyliczana adaptacyjnym insertion sortem: każdy kolejny stresor
 * wstawiany jest na właściwe miejsce przez wyszukiwanie binarne po porównaniach
 * — ~n·log(n) pytań zamiast pełnego n². "Mądry algorytm" z modułu capture.
 */
export type PairingState =
  | { phase: 'intro' }
  | {
      phase: 'compare';
      sorted: Stressor[];
      queue: Stressor[];
      x: Stressor; // aktualnie wstawiany stresor
      lo: number;
      hi: number;
      mid: number; // indeks w sorted, z którym porównujemy x
      count: number; // liczba zadanych pytań
    }
  | { phase: 'done'; order: Stressor[]; count: number };

interface PairingFlowProps {
  stressors: Stressor[];
  onApply: (orderedIds: string[]) => void;
  onClose: () => void;
  /** Tylko dla Storybooka — pozwala renderować dany stan bez klikania. */
  initialState?: PairingState;
  /** Tylko dla Storybooka — pokaż od razu potwierdzenie przerwania. */
  initialConfirmAbandon?: boolean;
}

const PRIMARY_ID = 'pairing-primary-action';

export function PairingFlow({ stressors, onApply, onClose, initialState, initialConfirmAbandon }: PairingFlowProps) {
  const [state, setState] = useState<PairingState>(initialState ?? { phase: 'intro' });
  const [confirmAbandon, setConfirmAbandon] = useState(initialConfirmAbandon ?? false);

  // Focus na główną akcję przy każdej zmianie stanu.
  useEffect(() => {
    const el = document.getElementById(PRIMARY_ID) as HTMLButtonElement | null;
    el?.focus();
  }, [state, confirmAbandon]);

  // Przerwanie mid-sequence wymaga potwierdzenia (postęp by przepadł).
  const compareCount = state.phase === 'compare' ? state.count : 0;
  const requestClose = useCallback(() => {
    if (compareCount > 0 && !confirmAbandon) {
      setConfirmAbandon(true);
    } else {
      onClose();
    }
  }, [compareCount, confirmAbandon, onClose]);

  // Esc = zamknij (z potwierdzeniem mid-sequence).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose]);

  const beginCompare = (sorted: Stressor[], queue: Stressor[], x: Stressor, count: number) => {
    const lo = 0;
    const hi = sorted.length - 1;
    setState({
      phase: 'compare',
      sorted,
      queue,
      x,
      lo,
      hi,
      mid: Math.floor((lo + hi) / 2),
      count,
    });
  };

  const start = () => {
    if (stressors.length < 2) {
      onClose();
      return;
    }
    const sorted = [stressors[0]];
    const queue = stressors.slice(1);
    beginCompare(sorted, queue, queue[0], 0);
  };

  const answer = (xMoreStressful: boolean) => {
    setState((prev) => {
      if (prev.phase !== 'compare') return prev;
      const { sorted, queue, x, lo, hi, mid, count } = prev;
      let newLo = lo;
      let newHi = hi;
      // x bardziej stresujący → ma być wcześniej (przed sorted[mid])
      if (xMoreStressful) newHi = mid - 1;
      else newLo = mid + 1;
      const nextCount = count + 1;

      if (newLo <= newHi) {
        return {
          phase: 'compare',
          sorted,
          queue,
          x,
          lo: newLo,
          hi: newHi,
          mid: Math.floor((newLo + newHi) / 2),
          count: nextCount,
        };
      }

      // pozycja znaleziona — wstaw x na newLo
      const sorted2 = [...sorted];
      sorted2.splice(newLo, 0, x);
      const queue2 = queue.slice(1);

      if (queue2.length === 0) {
        return { phase: 'done', order: sorted2, count: nextCount };
      }

      const nextX = queue2[0];
      const nLo = 0;
      const nHi = sorted2.length - 1;
      return {
        phase: 'compare',
        sorted: sorted2,
        queue: queue2,
        x: nextX,
        lo: nLo,
        hi: nHi,
        mid: Math.floor((nLo + nHi) / 2),
        count: nextCount,
      };
    });
  };

  const total = stressors.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
    >
      <div
        className="w-full max-w-md space-y-6 rounded-xl border bg-background p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pairing-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="pairing-title" className="text-lg font-semibold">
              Parowanie
            </h3>
            <p className="text-sm text-muted-foreground">
              Wybierz, co bardziej stresuje — ułożę z tego kolejność.
            </p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Anuluj parowanie"
            onClick={requestClose}
          >
            <X />
          </Button>
        </div>

        {confirmAbandon ? (
          <div className="space-y-4">
            <p className="text-sm">
              Przerwać parowanie? Postęp ({state.phase === 'compare' ? state.count : 0}{' '}
              {pluralize(state.phase === 'compare' ? state.count : 0, [
                'pytanie',
                'pytania',
                'pytań',
              ])}){' '}
              nie zostanie zapisany.
            </p>
            <div className="flex gap-2">
              <Button
                id={PRIMARY_ID}
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={onClose}
              >
                Przerwij
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmAbandon(false)}>
                Wracaj do parowania
              </Button>
            </div>
          </div>
        ) : state.phase === 'intro' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Przejdziemy przez pary stresorów. Musisz dojść do końca, żeby dostać ułożenie. Esc =
              anuluj bez zmian.
            </p>
            <Button id={PRIMARY_ID} type="button" className="w-full" onClick={start}>
              Zacznij ({total} {pluralize(total, ['stresor', 'stresory', 'stresorów'])})
            </Button>
          </div>
        ) : state.phase === 'compare' ? (
          <div className="space-y-4">
            <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">
              Pytanie {state.count + 1}
            </p>
            <p className="text-center text-[0.7rem] text-muted-foreground/70">
              Stresor {state.sorted.length + 1} z {total}
            </p>
            <p className="text-center text-sm font-medium">Co bardziej cię stresuje?</p>
            <div className="grid gap-2">
              <Button
                id={PRIMARY_ID}
                type="button"
                variant="outline"
                size="lg"
                className="h-auto whitespace-normal py-3 text-left"
                onClick={() => answer(true)}
              >
                {state.x.text}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-auto whitespace-normal py-3 text-left"
                onClick={() => answer(false)}
              >
                {state.sorted[state.mid].text}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Gotowe — ułożyłem kolejność po {state.count}{' '}
              {pluralize(state.count, ['pytaniu', 'pytaniach', 'pytaniach'])}:
            </p>
            <ol className="space-y-1 text-sm">
              {state.order.map((s, i) => (
                <li key={s.id} className="flex gap-2">
                  <span className="w-6 shrink-0 text-muted-foreground tabular-nums">{i + 1}.</span>
                  <span className="truncate">{s.text}</span>
                </li>
              ))}
            </ol>
            <div className="flex gap-2">
              <Button
                id={PRIMARY_ID}
                type="button"
                className="flex-1"
                onClick={() => onApply(state.order.map((s) => s.id))}
              >
                Zastosuj
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Anuluj
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
