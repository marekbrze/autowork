import { useCallback, useEffect, useRef, useState } from 'react';

export interface LocalStorageStatus {
  /** The last write failed (quota/disabled). State was NOT updated. */
  writeError: boolean;
  /** Failed to read/deserialize data on startup — starts from the initial value. */
  readError: boolean;
  /** Retry the last failed write. */
  retry: () => void;
  /** Hide the error message (does not fix the problem). */
  dismiss: () => void;
}

/**
 * Prototype persistence. Unlike a naive hook:
 * - on a failed write it does NOT update state (the UI always reflects what is actually persisted),
 *   instead it reports `writeError` and remembers the last failed value for `retry`;
 * - on a corrupted read (bad JSON) it reports `readError` instead of a silent fallback;
 * - it syncs with changes from other tabs (`storage` event) AND with other instances
 *   of the same key in the same tab (custom `use-local-storage:<key>` event) — the latter
 *   solves the problem of syncing multiple instances of the same key in a single component tree
 *   (e.g. Run stats vs. funnel screen; see R2-1);
 * - it reinitializes when `key` changes (per-Run namespaced keys are switched when the active Run changes).
 *
 * Returns a tuple `[value, setValue, removeValue, status]`. The first three elements are
 * backward-compatible with the previous signature `[value, setValue, removeValue]`.
 */

/** Same-tab broadcast event for a given key. */
function broadcastEvent(key: string): string {
  return `use-local-storage:${key}`;
}

function readValue<T>(key: string, initialValue: T): { value: T; failed: boolean } {
  try {
    const item = window.localStorage.getItem(key);
  return { value: item ? (JSON.parse(item) as T) : initialValue, failed: false };
  } catch {
    return { value: initialValue, failed: true };
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  // --- read: once, on first render (for the current `key`) ---
  const initRef = useRef<{ value: T; failed: boolean; key: string } | null>(null);
  if (initRef.current === null || initRef.current.key !== key) {
    initRef.current = { ...readValue(key, initialValue), key };
  }

  const [storedValue, setStoredValue] = useState<T>(initRef.current.value);
  const [writeError, setWriteError] = useState(false);
  const [readError, setReadError] = useState(initRef.current.failed);
  const pendingRef = useRef<T | null>(null);

  // --- reinitialize on `key` change (per-Run namespaced keys) ---
  useEffect(() => {
    const r = readValue(key, initialValue);
    setStoredValue(r.value);
    setReadError(r.failed);
    pendingRef.current = null;
    setWriteError(false);
    // initialValue intentionally excluded from deps — reinit ONLY on key change.
  }, [key]);

  const persist = useCallback(
    (value: T): boolean => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    [key],
  );

  /** Broadcast the new value to other instances of the same key in the same tab. */
  const broadcast = useCallback(
    (value: T) => {
      window.dispatchEvent(new CustomEvent(broadcastEvent(key), { detail: value }));
    },
    [key],
  );

  const setValue = useCallback(
    (value: T | ((val: T) => T)): boolean => {
      const next = value instanceof Function ? value(storedValue) : value;
      if (persist(next)) {
        setStoredValue(next);
        pendingRef.current = null;
        setWriteError(false);
        broadcast(next);
        return true;
      }
      // do not update state — the UI must reflect what is actually persisted
      pendingRef.current = next;
      setWriteError(true);
      return false;
    },
    [storedValue, persist, broadcast],
  );

  const retry = useCallback(() => {
    if (pendingRef.current !== null && persist(pendingRef.current)) {
      const next = pendingRef.current;
      setStoredValue(next);
      pendingRef.current = null;
      setWriteError(false);
      broadcast(next);
    }
  }, [persist, broadcast]);

  const dismiss = useCallback(() => {
    setWriteError(false);
    setReadError(false);
  }, []);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      pendingRef.current = null;
      setWriteError(false);
      setStoredValue(initialValue);
      broadcast(initialValue);
    } catch {
      // deletion is best-effort
    }
  }, [key, initialValue, broadcast]);

  // --- sync: cross-tab (`storage`) + same-tab (broadcast) ---
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      const r = readValue(key, initialValue);
      setStoredValue(r.value);
      pendingRef.current = null;
      setWriteError(false);
    };
    const onBroadcast = (e: Event) => {
      // ignore our own dispatch (state already set); for other instances — update
      setStoredValue((e as CustomEvent<T>).detail);
      pendingRef.current = null;
      setWriteError(false);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(broadcastEvent(key), onBroadcast as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(broadcastEvent(key), onBroadcast as EventListener);
    };
  }, [key, initialValue]);

  return [
    storedValue,
    setValue,
    removeValue,
    { writeError, readError, retry, dismiss },
  ] as const;
}
