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
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Why are you doing this?</h3>
        <p className="text-sm text-muted-foreground/70">No motivation material for this stressor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Why are you doing this?</h3>
      {doneVision && (
        <p className="text-sm font-medium">
          <span aria-hidden className="mr-1.5">
            {doneVision.emoji}
          </span>
          {doneVision.text}
        </p>
      )}
      {reasons.length > 0 && (
        <ul className="space-y-1">
          {reasons.map((r) => {
            const positive = r.valence === 'positive';
            return (
              <li key={r.id} className="flex gap-1.5 text-sm">
                <span
                  aria-hidden
                  className={cn('shrink-0', positive ? 'text-foreground' : 'text-destructive')}
                  title={positive ? 'gain' : 'avoiding pain'}
                >
                  {positive ? '✓' : '⚠'}
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
