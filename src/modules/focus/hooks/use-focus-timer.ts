import { useCallback, useEffect, useRef, useState } from 'react';

interface UseFocusTimerArgs {
  /** Sekundy już policzone (persystowane na tasku) — start/wznowienie stąd. */
  initialElapsed: number;
  /** Czy licznik tyka. */
  running: boolean;
  /** Persystuj elapsed na tasku. Wołane throttled (co ~5s) + przy unmount. */
  onPersist: (elapsedSeconds: number) => void;
}

/**
 * Licznik sesji `focus` — liczy **w górę** od `initialElapsed` (model B, ADR 0016).
 * Tyka co 1 s gdy `running`. `onPersist` wołane throttled (co ~5 s), żeby nie
 * hammerować localStorage co tick; przy przejściach stanów (Done/Skip/Dismiss/
 * Exit) wołać ręcznie `flush()`. Flushuje też przy unmount (np. nawigacja w bok).
 */
export function useFocusTimer({ initialElapsed, running, onPersist }: UseFocusTimerArgs) {
  const [elapsed, setElapsed] = useState(initialElapsed);
  const onPersistRef = useRef(onPersist);
  onPersistRef.current = onPersist;
  const lastFlushRef = useRef(initialElapsed);
  const elapsedRef = useRef(initialElapsed);
  elapsedRef.current = elapsed;

  // Reset przy zmianie bieżącego taska (nowy `initialElapsed` / wznowienie).
  useEffect(() => {
    setElapsed(initialElapsed);
    lastFlushRef.current = initialElapsed;
  }, [initialElapsed]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next - lastFlushRef.current >= 5) {
          lastFlushRef.current = next;
          onPersistRef.current(next);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // Flush przy unmount — ostatnia wartość nie ginie.
  useEffect(() => {
    return () => onPersistRef.current(elapsedRef.current);
  }, []);

  /** Wymuś flush bieżącej wartości (przy Done/Skip/Dismiss/Exit). */
  const flush = useCallback(() => {
    onPersistRef.current(elapsedRef.current);
    lastFlushRef.current = elapsedRef.current;
  }, []);

  return { elapsed, flush };
}
