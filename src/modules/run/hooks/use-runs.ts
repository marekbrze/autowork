import { useCallback } from 'react';

import { useLocalStorage, type LocalStorageStatus } from '@/shared/hooks/use-local-storage';
import { useActiveRun } from '@/shared/active-run';
import { clearRunFunnelData } from '@/shared/funnel-storage';
import { generateId } from '@/shared/types';

import type { ReviewItem, Run } from '../types/run';

const STORAGE_KEY = 'run:runs';

/** Default run name = date/time (per ENTITY_MAP). */
function defaultRunName(): string {
  const stamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return `Run · ${stamp}`;
}

export function useRuns() {
  const [runs, setRuns, , storage] = useLocalStorage<Run[]>(STORAGE_KEY, []);
  const { activeRunId, setActiveRun } = useActiveRun();

  const getRun = useCallback((id: string): Run | undefined => runs.find((r) => r.id === id), [runs]);

  /** Tworzy nowy Run (nazwa = data/godzina, krok brain-dump, zerowe statystyki) i ustawia go aktywnym.
   *  Zwraca Run | null (null = awaria zapisu). */
  const createRun = useCallback(
    (name?: string): Run | null => {
      const now = new Date().toISOString();
      const run: Run = {
        id: generateId(),
        name: name?.trim() || defaultRunName(),
        state: 'in_progress',
        lastReachedStep: 'brain-dump',
        stats: { timeSpentSec: 0, doneCount: 0, dismissedCount: 0, totalTasks: 0 },
        reviewItems: [],
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
      };
      const ok = setRuns((prev) => [run, ...prev]);
      if (ok) setActiveRun(run.id); // nowy Run staje się aktywnym → jego lejek od teraz widać (ADR 0044)
      return ok ? run : null;
    },
    [setRuns, setActiveRun],
  );

  const renameRun = useCallback(
    (id: string, name: string): boolean => {
      const trimmed = name.trim();
      return setRuns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, name: trimmed || r.name, updatedAt: new Date().toISOString() } : r,
        ),
      );
    },
    [setRuns],
  );

  const archiveRun = useCallback(
    (id: string): boolean => {
      const ok = setRuns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, state: 'archived', updatedAt: new Date().toISOString() } : r)),
      );
      if (ok && activeRunId === id) setActiveRun(null); // archiwizacja aktywnego → brak aktywnego (ADR 0044)
      return ok;
    },
    [setRuns, activeRunId, setActiveRun],
  );

  const unarchiveRun = useCallback(
    (id: string): boolean =>
      setRuns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, state: 'in_progress', updatedAt: new Date().toISOString() } : r,
        ),
      ),
    [setRuns],
  );

  const deleteRun = useCallback(
    (id: string): boolean => {
      const ok = setRuns((prev) => prev.filter((r) => r.id !== id));
      if (ok) {
        clearRunFunnelData(id); // kaskada: usuń dane lejka tego Runa (ADR 0044)
        if (activeRunId === id) setActiveRun(null); // usunięto aktywnego → brak aktywnego
      }
      return ok;
    },
    [setRuns, activeRunId, setActiveRun],
  );

  /** Oznacza pozycję w przeglądzie jako aktualną (relevant) lub przeterminowaną (stale). */
  const setReviewItemStale = useCallback(
    (runId: string, itemId: string, stale: boolean): boolean =>
      setRuns((prev) =>
        prev.map((r) =>
          r.id === runId
            ? {
                ...r,
                reviewItems: r.reviewItems.map((it) => (it.id === itemId ? { ...it, stale } : it)),
                updatedAt: new Date().toISOString(),
              }
            : r,
        ),
      ),
    [setRuns],
  );

  /** Usuwa z przeglądu wszystkie pozycje oflagowane jako przeterminowane. Zwraca liczbę usuniętych. */
  const clearStaleReviewItems = useCallback(
    (runId: string): number => {
      let removed = 0;
      const ok = setRuns((prev) =>
        prev.map((r) => {
          if (r.id !== runId) return r;
          removed = r.reviewItems.filter((it) => it.stale).length;
          return {
            ...r,
            reviewItems: r.reviewItems.filter((it) => !it.stale),
            updatedAt: new Date().toISOString(),
          };
        }),
      );
      return ok ? removed : 0;
    },
    [setRuns],
  );

  /** Dodaje pozycję do przeglądu (przydatne do mockowania / testów). */
  const addReviewItem = useCallback(
    (runId: string, item: Omit<ReviewItem, 'id'>): boolean => {
      const full: ReviewItem = { ...item, id: generateId() };
      return setRuns((prev) =>
        prev.map((r) =>
          r.id === runId
            ? { ...r, reviewItems: [...r.reviewItems, full], updatedAt: new Date().toISOString() }
            : r,
        ),
      );
    },
    [setRuns],
  );

  return {
    runs,
    getRun,
    createRun,
    renameRun,
    archiveRun,
    unarchiveRun,
    deleteRun,
    setReviewItemStale,
    clearStaleReviewItems,
    addReviewItem,
    /** Status persystencji (błędy zapisu/odczytu + retry). */
    storage: storage as LocalStorageStatus,
  };
}
