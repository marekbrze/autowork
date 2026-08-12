import { useCallback } from 'react';

import { useLocalStorage, type LocalStorageStatus } from '@/shared/hooks/use-local-storage';
import { useActiveRunId } from '@/shared/active-run';
import { stressorsKey } from '@/shared/funnel-storage';
import { generateId } from '@/shared/types';

import type { Stressor } from '../types/stressor';

export interface RemovedStressor {
  item: Stressor;
  index: number;
}

/**
 * Stressors of the active Run (or `runId`, if provided — e.g. RunDetails scopes by the URL `:runId`).
 * The store is per-Run, so the ordering (rank) is independent across runs.
 */
export function useStressors(runId?: string) {
  const activeRunId = useActiveRunId(runId);
  const key = stressorsKey(activeRunId ?? '__none__');
  const [stressors, setStressors, , storage] = useLocalStorage<Stressor[]>(key, []);

  const addStressor = useCallback(
    (text: string): Stressor => {
      const now = new Date().toISOString();
      const item: Stressor = {
        id: generateId(),
        text,
        runId: activeRunId ?? '__none__',
        createdAt: now,
        updatedAt: now,
      };
      setStressors((prev) => [...prev, item]);
      return item;
    },
    [activeRunId, setStressors],
  );

  const updateStressor = useCallback(
    (id: string, text: string) => {
      setStressors((prev) =>
        prev.map((s) => (s.id === id ? { ...s, text, updatedAt: new Date().toISOString() } : s)),
      );
    },
    [setStressors],
  );

  /** Deletes a stressor; returns the removed item + its index (for undo). */
  const deleteStressor = useCallback(
    (id: string): RemovedStressor | null => {
      const index = stressors.findIndex((s) => s.id === id);
      if (index === -1) return null;
      const item = stressors[index];
      setStressors((prev) => prev.filter((s) => s.id !== id));
      return { item, index };
    },
    [stressors, setStressors],
  );

  /** Inserts it back at the position (undo). */
  const restoreStressor = useCallback(
    (item: Stressor, index: number) => {
      setStressors((prev) => {
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, item);
        return next;
      });
    },
    [setStressors],
  );

  const moveStressor = useCallback(
    (id: string, direction: -1 | 1) => {
      setStressors((prev) => {
        const index = prev.findIndex((s) => s.id === id);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= prev.length) return prev;
        const next = [...prev];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
    },
    [setStressors],
  );

  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      setStressors((prev) => {
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex >= prev.length
        ) {
          return prev;
        }
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [setStressors],
  );

  /** Overrides the order with an array of ids (e.g. after `Pairing`). */
  const setOrder = useCallback(
    (orderedIds: string[]) => {
      setStressors((prev) => {
        const byId = new Map(prev.map((s) => [s.id, s]));
        const next = orderedIds
          .map((id) => byId.get(id))
          .filter((s): s is Stressor => Boolean(s));
        // defensively append anything missing from the list
        prev.forEach((s) => {
          if (!orderedIds.includes(s.id)) next.push(s);
        });
        return next;
      });
    },
    [setStressors],
  );

  return {
    stressors,
    addStressor,
    updateStressor,
    deleteStressor,
    restoreStressor,
    moveStressor,
    reorder,
    setOrder,
    /** Persistence status (read/write errors + retry). */
    storage: storage as LocalStorageStatus,
  };
}
