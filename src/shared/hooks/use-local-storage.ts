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
 * - synchronizuje się ze zmianami z innych kart (zdarzenie `storage`) ORAZ z innymi instancjami
 *   tego samego klucza w tej samej karcie (własne zdarzenie `use-local-storage:<key>`) — to drugie
 *   rozwiązuje problem synchronizacji wielu instancji tego samego klucza w jednym drzewie komponentów
 *   (np. statystyki Runa vs. ekran lejka; patrz R2-1);
 * - reinicjalizuje się przy zmianie `key` (namespaced klucze per-Run przełączane ze zmianą aktywnego Runa).
 *
 * Zwraca krotkę `[value, setValue, removeValue, status]`. Pierwsze trzy elementy są
 * wstecznie kompatybilne z poprzednią sygnaturą `[value, setValue, removeValue]`.
 */

/** Zdarzenie broadcastu same-tab dla danego klucza. */
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
  // --- odczyt: raz, przy pierwszym renderze (dla bieżącego `key`) ---
  const initRef = useRef<{ value: T; failed: boolean; key: string } | null>(null);
  if (initRef.current === null || initRef.current.key !== key) {
    initRef.current = { ...readValue(key, initialValue), key };
  }

  const [storedValue, setStoredValue] = useState<T>(initRef.current.value);
  const [writeError, setWriteError] = useState(false);
  const [readError, setReadError] = useState(initRef.current.failed);
  const pendingRef = useRef<T | null>(null);

  // --- reinicjalizacja przy zmianie `key` (per-Run namespaced klucze) ---
  useEffect(() => {
    const r = readValue(key, initialValue);
    setStoredValue(r.value);
    setReadError(r.failed);
    pendingRef.current = null;
    setWriteError(false);
    // initialValue celowo poza deps — reinit TYLKO przy zmianie key
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /** Broadcast nowej wartości do innych instancji tego samego klucza w tej samej karcie. */
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
      // nie aktualizujemy stanu — UI musi odzwierciedlać to, co faktycznie zapisane
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
      // usuwanie jest best-effort
    }
  }, [key, initialValue, broadcast]);

  // --- synchronizacja: cross-tab (`storage`) + same-tab (broadcast) ---
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      const r = readValue(key, initialValue);
      setStoredValue(r.value);
      pendingRef.current = null;
      setWriteError(false);
    };
    const onBroadcast = (e: Event) => {
      // ignorujemy własny dispatch (stan już ustawiony); dla innych instancji — aktualizuj
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
