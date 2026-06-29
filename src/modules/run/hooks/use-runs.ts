import { useCallback } from 'react';

import { useLocalStorage, type LocalStorageStatus } from '@/shared/hooks/use-local-storage';
import { generateId } from '@/shared/types';

import type { ReviewItem, Run } from '../types/run';

const STORAGE_KEY = 'run:runs';

/** Domyślna nazwa Runa = data/godzina (zgodnie z ENTITY_MAP). */
function defaultRunName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `Run · ${pad(d.getDate())}.${pad(d.getMonth() + 1)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function useRuns() {
  const [runs, setRuns, , storage] = useLocalStorage<Run[]>(STORAGE_KEY, []);

  const getRun = useCallback((id: string): Run | undefined => runs.find((r) => r.id === id), [runs]);

  /** Tworzy nowy Run (nazwa = data/godzina, krok brain-dump, zerowe statystyki). Zwraca Run | null (null = awaria zapisu). */
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
      return ok ? run : null;
    },
    [setRuns],
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
    (id: string): boolean =>
      setRuns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, state: 'archived', updatedAt: new Date().toISOString() } : r)),
      ),
    [setRuns],
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
    (id: string): boolean => setRuns((prev) => prev.filter((r) => r.id !== id)),
    [setRuns],
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
