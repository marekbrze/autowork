import { createContext, type ReactNode, useContext, useMemo } from 'react';

import { useLocalStorage } from '@/shared/hooks/use-local-storage';

/**
 * Aktywny Run (`activeRunId`) — Run, którego lejka (stresory, zadania, …) user aktualnie
 * widzi w ekranach `capture`/`decompose`/`process`/`focus` (ADR 0044). Ustawiany przy Create /
 * Continue; wyczyszczany przy Delete/Archive aktywnego. Trzymany w localStorage `run:active`.
 *
 * Żyje w `shared/` (nie w module `run`), by hooki lejka (`capture`/`decompose`) mogły go czytać
 * bez cyklu zależności: `run` nie importuje już hooków lejka (statystyki per-Run czyta bezpośrednio),
 * a lejek importuje ten kontekst → `capture/decompose → shared`, bez sprzężenia zwrotnego do `run`.
 */

const STORAGE_KEY = 'run:active';

interface ActiveRunValue {
  /** id aktywnego Runa, albo `null` gdy żaden nieaktywny (→ guard tras lejka przekieruje na Dashboard). */
  activeRunId: string | null;
  /** Ustaw aktywny Run (`null` czyści). Zwraca `false` przy awarii zapisu. */
  setActiveRun: (runId: string | null) => boolean;
}

const ActiveRunContext = createContext<ActiveRunValue | null>(null);

export function ActiveRunProvider({ children }: { children: ReactNode }) {
  const [activeRunId, setActive] = useLocalStorage<string | null>(STORAGE_KEY, null);

  const value = useMemo<ActiveRunValue>(
    () => ({
      activeRunId,
      setActiveRun: (runId: string | null) => setActive(runId),
    }),
    [activeRunId, setActive],
  );

  return <ActiveRunContext.Provider value={value}>{children}</ActiveRunContext.Provider>;
}

/** Dostęp do pełnego API aktywnego Runa (wymaga `ActiveRunProvider` w drzewie). */
export function useActiveRun(): ActiveRunValue {
  const ctx = useContext(ActiveRunContext);
  if (!ctx) throw new Error('useActiveRun must be used within <ActiveRunProvider>');
  return ctx;
}

/**
 * id aktywnego Runa (lub `null`). Dla hooków lejka, które potrzebują tylko wartości.
 * Akceptuje opcjonalny override — np. RunDetails scope'uje po URL `:runId`, nie po aktywnym.
 */
export function useActiveRunId(override?: string): string | null {
  const ctx = useContext(ActiveRunContext);
  if (override !== undefined) return override;
  return ctx?.activeRunId ?? null;
}
