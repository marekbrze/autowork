import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { pluralize } from '@/lib/utils';

import type { Stressor } from '../types/stressor';

/**
 * A committed sequence of pairwise comparisons ("which is more stressful: A or B?").
 * The order is computed by an adaptive insertion sort: each successive stressor
 * is placed in the right spot via binary search over comparisons
 * — ~n·log(n) questions instead of a full n². The "smart algorithm" of the capture module.
 */
export type PairingState =
  | { phase: 'intro' }
  | {
      phase: 'compare';
      sorted: Stressor[];
      queue: Stressor[];
      x: Stressor; // the stressor currently being inserted
      lo: number;
      hi: number;
      mid: number; // index in sorted we're comparing x against
      count: number; // number of questions asked so far
    }
  | { phase: 'done'; order: Stressor[]; count: number };

interface PairingFlowProps {
  stressors: Stressor[];
  onApply: (orderedIds: string[]) => void;
  onClose: () => void;
  /** Storybook only — lets a given state render without clicking. */
  initialState?: PairingState;
  /** Storybook only — show the abandon confirmation right away. */
  initialConfirmAbandon?: boolean;
}

const PRIMARY_ID = 'pairing-primary-action';

export function PairingFlow({ stressors, onApply, onClose, initialState, initialConfirmAbandon }: PairingFlowProps) {
  const [state, setState] = useState<PairingState>(initialState ?? { phase: 'intro' });
  const [confirmAbandon, setConfirmAbandon] = useState(initialConfirmAbandon ?? false);

  // Focus the primary action on every state change.
  useEffect(() => {
    const el = document.getElementById(PRIMARY_ID) as HTMLButtonElement | null;
    el?.focus();
  }, [state, confirmAbandon]);

  // Aborting mid-sequence requires confirmation (progress would be lost).
  const compareCount = state.phase === 'compare' ? state.count : 0;
  const requestClose = useCallback(() => {
    if (compareCount > 0 && !confirmAbandon) {
      setConfirmAbandon(true);
    } else {
      onClose();
    }
  }, [compareCount, confirmAbandon, onClose]);

  // Esc = close (with mid-sequence confirmation).
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
      // x more stressful → should be earlier (before sorted[mid])
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

      // position found — insert x at newLo
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
              Pairing
            </h3>
            <p className="text-sm text-muted-foreground">
              Pick what stresses you more — I'll build an order from it.
            </p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Cancel pairing"
            onClick={requestClose}
          >
            <X />
          </Button>
        </div>

        {confirmAbandon ? (
          <div className="space-y-4">
            <p className="text-sm">
              Cancel pairing? Your progress ({state.phase === 'compare' ? state.count : 0}{' '}
              {pluralize(state.phase === 'compare' ? state.count : 0, [
                'question',
                'questions',
              ])}){' '}
              won't be saved.
            </p>
            <div className="flex gap-2">
              <Button
                id={PRIMARY_ID}
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={onClose}
              >
                Discard
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmAbandon(false)}>
                Back to pairing
              </Button>
            </div>
          </div>
        ) : state.phase === 'intro' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We'll go through pairs of stressors. You need to finish to get an order. Esc = cancel
              with no changes.
            </p>
            <Button id={PRIMARY_ID} type="button" className="w-full" onClick={start}>
              Start ({total} {pluralize(total, ['stressor', 'stressors'])})
            </Button>
          </div>
        ) : state.phase === 'compare' ? (
          <div className="space-y-4">
            <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">
              Question {state.count + 1}
            </p>
            <p className="text-center text-[0.7rem] text-muted-foreground/70">
              Stressor {state.sorted.length + 1} of {total}
            </p>
            <p className="text-center text-sm font-medium">What stresses you more?</p>
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
              Done — ordered after {state.count}{' '}
              {pluralize(state.count, ['question', 'questions'])}:
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
                Apply
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
