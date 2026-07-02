import { useCallback, useEffect, useRef, useState } from 'react';

interface UseFocusTimerArgs {
  /** Sekundy już policzone (persystowane na tasku) — start/wznowienie stąd. */
  initialElapsed: number;
  /** Czy licznik tyka. */
  running: boolean;
  /** Persystuj elapsed na tasku. Wołane throttled (co ~5s) + przy unmount. */
  onPersist: (elapsedSeconds: number) => void;
}

/** Minimalny kształt Wake Lock Sentinela (API nie wszędzie dostępne / nie w lib.dom). */
interface WakeLockSentinelHandle {
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
}
interface WakeLockNavigator {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelHandle>;
  };
}

const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

/**
 * Licznik sesji `focus` — liczy **w górę** od `initialElapsed` (model B, ADR 0016).
 *
 * Mechanizm **timestamp-based** (ADR 0053): liczymy wall-clock od wznowienia, a nie
 * akumulujemy ticki. Dzięki temu timer jest **zawsze poprawny po powrocie** z tła /
 * uśpionej karty (Edge Sleeping Tabs) — nawet jeśli ticki zostały porzucone, wartość
 * snapuje do właściwego czasu przy kolejnym recompute (co sekundę lub na
 * `visibilitychange`). Tykaniem napędza **Web Worker** (jego timer jest dławiony
 * słabiej w tle niż main-thread), z fallbackiem na `setInterval`. Wake Lock trzyma
 * ekran przy życiu, gdy karta jest widoczna i licznik leci.
 *
 * `onPersist` wołane throttled (co ~5 s); przy przejściach stanów (Done/Skip/Dismiss/
 * Exit) wołać ręcznie `flush()`. Flushuje też przy unmount.
 */
export function useFocusTimer({ initialElapsed, running, onPersist }: UseFocusTimerArgs) {
  const [elapsed, setElapsed] = useState(initialElapsed);
  const onPersistRef = useRef(onPersist);
  onPersistRef.current = onPersist;
  const lastFlushRef = useRef(initialElapsed);

  // Model timestamp-based: `baseRef` = sekundy zamrożone przy pauzie/zmianie taska;
  // `resumedAtRef` = ms (wall-clock) ostatniego wznowienia, `null` gdy zapauzowane.
  const baseRef = useRef(initialElapsed);
  const resumedAtRef = useRef<number | null>(null);
  const runningRef = useRef(running);
  runningRef.current = running;

  const workerRef = useRef<Worker | null>(null);
  const fallbackIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinelHandle | null>(null);

  /** Bieżący elapsed policzony ze znacznika czasu (zawsze poprawny, bez dryftu). */
  const compute = useCallback(() => {
    if (resumedAtRef.current == null) return baseRef.current;
    return baseRef.current + Math.floor((Date.now() - resumedAtRef.current) / 1000);
  }, []);

  /** Throttled flush — persystuj co ~5 s (wołane z każdego ticku i resyncu). */
  const maybeFlush = useCallback((next: number) => {
    if (next - lastFlushRef.current >= 5) {
      lastFlushRef.current = next;
      onPersistRef.current(next);
    }
  }, []);

  /** Reakcja na tick (Workera lub fallback) — przelicz ze znacznika + ew. flush. */
  const onTick = useCallback(() => {
    if (resumedAtRef.current == null) return; // zapauzowane — ignoruj
    const next = compute();
    setElapsed(next);
    maybeFlush(next);
  }, [compute, maybeFlush]);

  const stopFallback = useCallback(() => {
    if (fallbackIdRef.current != null) {
      window.clearInterval(fallbackIdRef.current);
      fallbackIdRef.current = null;
    }
  }, []);

  const stopTick = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    stopFallback();
  }, [stopFallback]);

  /** Uruchom tykanie — preferuj Workera, przy porażce fallback na main-thread. */
  const ensureTick = useCallback(() => {
    if (workerRef.current || fallbackIdRef.current != null) return;
    try {
      const worker = new Worker(new URL('../workers/timer-tick.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = () => onTick();
      worker.onerror = () => {
        worker.terminate();
        workerRef.current = null;
        if (fallbackIdRef.current == null) {
          fallbackIdRef.current = window.setInterval(onTick, 1000);
        }
      };
      workerRef.current = worker;
    } catch {
      workerRef.current = null;
      fallbackIdRef.current = window.setInterval(onTick, 1000);
    }
  }, [onTick]);

  const releaseWakeLock = useCallback(async () => {
    const handle = wakeLockRef.current;
    if (!handle) return;
    wakeLockRef.current = null;
    try {
      await handle.release();
    } catch {
      // już zwolniony — ignoruj
    }
  }, []);

  const acquireWakeLock = useCallback(async () => {
    if (!wakeLockSupported) return;
    if (typeof document === 'undefined' || document.visibilityState !== 'visible') return;
    if (wakeLockRef.current) return;
    try {
      const nav = navigator as Navigator & WakeLockNavigator;
      const handle = await nav.wakeLock!.request('screen');
      wakeLockRef.current = handle;
      handle.addEventListener('release', () => {
        // system zwolnił (np. karta ukryta) — zaznacz, by re-acquire na powrót
        if (wakeLockRef.current === handle) wakeLockRef.current = null;
      });
    } catch {
      wakeLockRef.current = null; // odmowa / niedostępne — cicha degradacja
    }
  }, []);

  // Reset przy zmianie bieżącego taska (nowy `initialElapsed` / wznowienie).
  // `running` czytamy przez ref, by nie resetować przy każdej zmianie `running`.
  useEffect(() => {
    baseRef.current = initialElapsed;
    lastFlushRef.current = initialElapsed;
    resumedAtRef.current = runningRef.current ? Date.now() : null;
    setElapsed(initialElapsed);
  }, [initialElapsed]);

  // Start/stop tykania + Wake Locka przy przejściach `running`.
  useEffect(() => {
    if (running) {
      resumedAtRef.current = Date.now();
      setElapsed(compute());
      ensureTick();
      void acquireWakeLock();
    } else {
      if (resumedAtRef.current != null) {
        baseRef.current = compute(); // zamroź bieżącą wartość
        resumedAtRef.current = null;
      }
      setElapsed(baseRef.current);
      stopTick();
      void releaseWakeLock();
    }
    return () => {
      stopTick();
      void releaseWakeLock();
    };
  }, [running, compute, ensureTick, acquireWakeLock, stopTick, releaseWakeLock]);

  // Resync przy powrocie do karty — snap do właściwego czasu nawet jeśli ticki
  // zostały całkowicie porzucone przez uśpioną kartę. + re-acquire Wake Locka.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (resumedAtRef.current != null) {
        const next = compute();
        setElapsed(next);
        maybeFlush(next);
        void acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [compute, maybeFlush, acquireWakeLock]);

  // Flush przy unmount — ostatnia wartość (precyzyjna, ze znacznika) nie ginie.
  useEffect(() => {
    return () => onPersistRef.current(compute());
  }, [compute]);

  /** Wymuś flush bieżącej wartości (przy Done/Skip/Dismiss/Exit). */
  const flush = useCallback(() => {
    const value = compute();
    onPersistRef.current(value);
    lastFlushRef.current = value;
  }, [compute]);

  return { elapsed, flush };
}
