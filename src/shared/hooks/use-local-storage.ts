import { useCallback, useEffect, useRef, useState } from 'react';

export interface LocalStorageStatus {
  /** Ostatni zapis nie powiódł się (quota/disabled). Stan NIE został zaktualizowany. */
  writeError: boolean;
  /** Nie udało się odczytać/zdeserializować danych przy starcie — start od wartości początkowej. */
  readError: boolean;
  /** Ponów ostatni nieudany zapis. */
  retry: () => void;
  /** Ukryj komunikat błędu (nie rozwiązuje problemu). */
  dismiss: () => void;
}

/**
 * Persystencja prototypu. W odróżnieniu od naiwnego hooka:
 * - przy nieudanym zapisie NIE aktualizuje stanu (UI zawsze odzwierciedla to, co faktycznie zapisane),
 *   zamiast tego raportuje `writeError` i pamięta ostatnią failed wartość do `retry`;
 * - przy uszkodzonym odczycie (zły JSON) raportuje `readError` zamiast cichego fallbacku;
 * - synchronizuje się ze zmianami z innych kart (zdarzenie `storage`).
 *
 * Zwraca krotkę `[value, setValue, removeValue, status]`. Pierwsze trzy elementy są
 * wstecznie kompatybilne z poprzednią sygnaturą `[value, setValue, removeValue]`.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // --- odczyt: raz, przy pierwszym renderze ---
  const initRef = useRef<{ value: T; failed: boolean } | null>(null);
  if (initRef.current === null) {
    try {
      const item = window.localStorage.getItem(key);
      initRef.current = { value: item ? (JSON.parse(item) as T) : initialValue, failed: false };
    } catch {
      initRef.current = { value: initialValue, failed: true };
    }
  }

  const [storedValue, setStoredValue] = useState<T>(initRef.current.value);
  const [writeError, setWriteError] = useState(false);
  const [readError, setReadError] = useState(initRef.current.failed);
  const pendingRef = useRef<T | null>(null);

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

  const setValue = useCallback(
    (value: T | ((val: T) => T)): boolean => {
      const next = value instanceof Function ? value(storedValue) : value;
      if (persist(next)) {
        setStoredValue(next);
        pendingRef.current = null;
        setWriteError(false);
        return true;
      }
      // nie aktualizujemy stanu — UI musi odzwierciedlać to, co faktycznie zapisane
      pendingRef.current = next;
      setWriteError(true);
      return false;
    },
    [storedValue, persist],
  );

  const retry = useCallback(() => {
    if (pendingRef.current !== null && persist(pendingRef.current)) {
      setStoredValue(pendingRef.current);
      pendingRef.current = null;
      setWriteError(false);
    }
  }, [persist]);

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
    } catch {
      // usuwanie jest best-effort
    }
  }, [key, initialValue]);

  // --- multi-tab: synchronizuj zmiany z innych kart (storage event) ---
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        const next = e.newValue ? (JSON.parse(e.newValue) as T) : initialValue;
        setStoredValue(next);
        pendingRef.current = null;
        setWriteError(false);
      } catch {
        // ignorujemy uszkodzony zewnętrzny zapis
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, initialValue]);

  return [
    storedValue,
    setValue,
    removeValue,
    { writeError, readError, retry, dismiss },
  ] as const;
}
