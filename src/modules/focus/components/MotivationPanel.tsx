import { Sparkles } from 'lucide-react';

import type { DoneVision } from '@/shared/types';
import { cn } from '@/lib/utils';
import type { Reason } from '@/modules/decompose/types/reason';

interface MotivationPanelProps {
  doneVision?: DoneVision;
  reasons: Reason[];
}

/**
 * Materiał motywacyjny (WHY z `decompose`) — **zawsze widoczny** na ekranie
 * zadania w `focus` (payoff budowania powodów + wizji efektu). Powody z walencją:
 * pozytywna (zysk, ✓) / negatywna (uniknięcie bólu, ⚠ — `destructive`).
 */
export function MotivationPanel({ doneVision, reasons }: MotivationPanelProps) {
  if (!doneVision && reasons.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Sparkles className="size-4 text-brand-600" aria-hidden /> Why this matters
        </h3>
        <p className="text-sm text-muted-foreground/70">No motivation material for this stressor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
        <Sparkles className="size-4 text-brand-600" aria-hidden /> Why this matters
      </h3>
      {doneVision && (
        <p className="rounded-lg bg-brand-300/40 px-3 py-2 text-sm font-semibold text-foreground">
          <span aria-hidden className="mr-1.5">
            {doneVision.emoji}
          </span>
          {doneVision.text}
        </p>
      )}
      {reasons.length > 0 && (
        <ul className="space-y-1.5">
          {reasons.map((r) => {
            const positive = r.valence === 'positive';
            return (
              <li key={r.id} className="flex gap-2 text-sm">
                <span
                  aria-hidden
                  className={cn('mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-xs font-bold', positive ? 'bg-brand-700 text-primary-foreground' : 'bg-overtime/15 text-overtime')}
                  title={positive ? 'gain' : 'avoiding pain'}
                >
                  {positive ? '✓' : '!'}
                </span>
                <span className="text-muted-foreground">{r.text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
