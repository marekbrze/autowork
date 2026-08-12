import { createContext, type ReactNode, useContext, useMemo } from 'react';

import { useLocalStorage } from '@/shared/hooks/use-local-storage';

/**
 * Active Run (`activeRunId`) — the Run whose funnel (stressors, tasks, …) the user is currently
 * viewing on the `capture`/`decompose`/`process`/`focus` screens (ADR 0044). Set on Create /
 * Continue; cleared on Delete/Archive of the active Run. Stored in localStorage `run:active`.
 *
 * Lives in `shared/` (not in the `run` module) so funnel hooks (`capture`/`decompose`) can read it
 * without a dependency cycle: `run` no longer imports funnel hooks (per-Run stats are read directly),
 * and the funnel imports this context → `capture/decompose → shared`, with no feedback loop into `run`.
 */

const STORAGE_KEY = 'run:active';

interface ActiveRunValue {
  /** id of the active Run, or `null` when none is active (→ funnel route guard redirects to Dashboard). */
  activeRunId: string | null;
  /** Set the active Run (`null` clears it). Returns `false` on write failure. */
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

/** Access to the full active Run API (requires `ActiveRunProvider` in the tree). */
export function useActiveRun(): ActiveRunValue {
  const ctx = useContext(ActiveRunContext);
  if (!ctx) throw new Error('useActiveRun must be used within <ActiveRunProvider>');
  return ctx;
}

/**
 * id of the active Run (or `null`). For funnel hooks that only need the value.
 * Accepts an optional override — e.g. RunDetails scopes by URL `:runId`, not by the active one.
 */
export function useActiveRunId(override?: string): string | null {
  const ctx = useContext(ActiveRunContext);
  if (override !== undefined) return override;
  return ctx?.activeRunId ?? null;
}
