import { cn } from '@/lib/utils';
import type { EstimatedTime } from '@/modules/decompose/types/task';

import { formatClock } from '../types/focus';

interface FocusTimerProps {
  /** Policzone sekundy (licznik w górę). */
  elapsedSeconds: number;
  /** Próg = oszacowanie taska (min); po przekroczeniu render czerwony. */
  thresholdMinutes?: EstimatedTime;
  /** Czy wstrzymany — sygnalizowane wizualnie. */
  paused?: boolean;
}

/**
 * Prezentacyjny licznik focus (model B, ADR 0016): liczy w górę, próg =
 * oszacowanie; po przekroczeniu prógu renderuje się na czerwono (`overtime`).
 */
export function FocusTimer({ elapsedSeconds, thresholdMinutes, paused }: FocusTimerProps) {
  const overThreshold = thresholdMinutes != null && elapsedSeconds > thresholdMinutes * 60;
  return (
    <div className="flex flex-col items-center">
      <div
        role="timer"
        aria-live="off"
        aria-label={`Elapsed ${formatClock(elapsedSeconds)}${thresholdMinutes ? ` of ${thresholdMinutes} min` : ''}${
          overThreshold ? ', over estimate' : ''
        }${paused ? ', paused' : ''}`}
        className={cn(
          'font-extrabold tabular-nums tracking-tight text-7xl sm:text-8xl transition-colors',
          overThreshold ? 'text-overtime' : 'text-foreground',
          paused && 'opacity-60',
        )}
      >
        {formatClock(elapsedSeconds)}
      </div>
      <div className="mt-2 text-sm font-semibold tabular-nums text-muted-foreground">
        {thresholdMinutes != null ? (
          <>
            target {thresholdMinutes} min
            {overThreshold && <span className="text-overtime"> · over</span>}
          </>
        ) : (
          <span className="text-muted-foreground/70">no time estimate</span>
        )}
        {paused && <span className="ml-1 text-muted-foreground">· paused</span>}
      </div>
    </div>
  );
}
