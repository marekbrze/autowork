import { useCallback, useEffect, useRef, useState } from 'react';

interface UseFocusTimerArgs {
  /** Seconds already counted (persisted on the task) — start/resume from here. */
  initialElapsed: number;
  /** Current task id — reset the counter ONLY when it changes (FT-1). */
  taskKey: string | null;
  /** Czy licznik tyka. */
  running: boolean;
  /** Persist elapsed on the task. Called throttled (every ~5s) + on unmount. */
  onPersist: (elapsedSeconds: number) => void;
}

/** Minimal shape of a Wake Lock Sentinel (the API isn't available everywhere / not in lib.dom). */
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
 * The `focus` session counter — counts **up** from `initialElapsed` (model B, ADR 0016).
 *
 * Mechanizm **timestamp-based** (ADR 0053): liczymy wall-clock od wznowienia, a nie
 * we accumulate ticks. Thanks to this the timer is **always correct on return** from the background /
 * a sleeping tab (Edge Sleeping Tabs) — even if ticks were dropped, the value
 * snaps to the correct time on the next recompute (every second or on
 * `visibilitychange`). Ticking is driven by a **Web Worker** (its timer is throttled
 * less in the background than the main thread), with a fallback to `setInterval`. A Wake Lock keeps
 * the screen alive when the tab is visible and the counter is running.
 *
 * `onPersist` is called throttled (every ~5 s); on state transitions (Done/Skip/Dismiss/
 * Exit) call `flush()` manually. It also flushes on unmount.
 */
export function useFocusTimer({ initialElapsed, taskKey, running, onPersist }: UseFocusTimerArgs) {
  const [elapsed, setElapsed] = useState(initialElapsed);
  const onPersistRef = useRef(onPersist);
  onPersistRef.current = onPersist;
  const lastFlushRef = useRef(initialElapsed);

  // Timestamp-based model: `baseRef` = seconds frozen on pause/task-change;
  // `resumedAtRef` = ms (wall-clock) ostatniego wznowienia, `null` gdy zapauzowane.
  const baseRef = useRef(initialElapsed);
  const resumedAtRef = useRef<number | null>(null);
  const runningRef = useRef(running);
  runningRef.current = running;

  const workerRef = useRef<Worker | null>(null);
  const fallbackIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinelHandle | null>(null);

  /** Current elapsed computed from the timestamp (always correct, no drift). */
  const compute = useCallback(() => {
    if (resumedAtRef.current == null) return baseRef.current;
    // FT-2: lower clamp — a system clock rollback (NTP / user) on a hidden
    // tab must not make the timer count below the frozen `baseRef`.
    const next = baseRef.current + Math.floor((Date.now() - resumedAtRef.current) / 1000);
    return Math.max(baseRef.current, next);
  }, []);

  /** Throttled flush — persist every ~5 s (called from every tick and resync). */
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

  /** Start ticking — prefer the Worker, fall back to main-thread on failure. */
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
      // already released — ignore
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
        // system released (e.g. tab hidden) — mark to re-acquire on return
        if (wakeLockRef.current === handle) wakeLockRef.current = null;
      });
    } catch {
      wakeLockRef.current = null; // refused / unavailable — silent degradation
    }
  }, []);

  // FT-1: reset ONLY when the current task changes (`taskKey` = id), not on every
  // change to `initialElapsed` — that updates every flush (self-broadcast) and cross-tab
  // (`storage`), so keying on the value rolled the timer back in multi-tab. Therefore
  // `initialElapsed` is read from the closure (the value from the task-change render) and is deliberately NOT
  // in deps — that's what eliminates the re-fire on flush.
  useEffect(() => {
    baseRef.current = initialElapsed;
    lastFlushRef.current = initialElapsed;
    resumedAtRef.current = runningRef.current ? Date.now() : null;
    setElapsed(initialElapsed);
    // `initialElapsed` celowo poza deps — patrz komentarz nad efektem (FT-1).
  }, [taskKey]);

  // Start/stop ticking + Wake Lock on `running` transitions.
  useEffect(() => {
    if (running) {
      resumedAtRef.current = Date.now();
      setElapsed(compute());
      ensureTick();
      void acquireWakeLock();
    } else {
      if (resumedAtRef.current != null) {
        baseRef.current = compute(); // freeze the current value
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

  // Resync on return to the tab — snap to the correct time even if ticks
  // were entirely dropped by a sleeping tab. + re-acquire the Wake Lock.
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

  // Flush on unmount — the last value (precise, from the timestamp) isn't lost.
  useEffect(() => {
    return () => onPersistRef.current(compute());
  }, [compute]);

  /** Force a flush of the current value (on Done/Skip/Dismiss/Exit). */
  const flush = useCallback(() => {
    const value = compute();
    onPersistRef.current(value);
    lastFlushRef.current = value;
  }, [compute]);

  return { elapsed, flush };
}
