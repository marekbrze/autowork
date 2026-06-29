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
        aria-label={`Upłynęło ${formatClock(elapsedSeconds)}${thresholdMinutes ? ` z ${thresholdMinutes} minut` : ''}${
          overThreshold ? ', przekroczono oszacowanie' : ''
        }`}
        className={cn(
          'font-semibold tabular-nums tracking-tight text-6xl',
          overThreshold ? 'text-destructive' : 'text-foreground',
        )}
      >
        {formatClock(elapsedSeconds)}
      </div>
      <div className="mt-1 text-sm tabular-nums text-muted-foreground">
        {thresholdMinutes != null ? (
          <>
            próg: {thresholdMinutes} min
            {overThreshold && <span className="text-destructive"> · przekroczono</span>}
          </>
        ) : (
          <span className="text-muted-foreground/70">bez oszacowania czasu</span>
        )}
        {paused && <span className="ml-1">· pauza</span>}
      </div>
    </div>
  );
}
