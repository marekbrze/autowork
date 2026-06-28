import { useCallback } from 'react';

import { useLocalStorage, type LocalStorageStatus } from '@/shared/hooks/use-local-storage';
import { generateId } from '@/shared/types';

import type { Stressor } from '../types/stressor';

const STORAGE_KEY = 'capture:stressors';

export interface RemovedStressor {
  item: Stressor;
  index: number;
}

export function useStressors() {
  const [stressors, setStressors, , storage] = useLocalStorage<Stressor[]>(STORAGE_KEY, []);

  const addStressor = useCallback(
    (text: string): Stressor => {
      const now = new Date().toISOString();
      const item: Stressor = { id: generateId(), text, createdAt: now, updatedAt: now };
      setStressors((prev) => [...prev, item]);
      return item;
    },
    [setStressors],
  );

  const updateStressor = useCallback(
    (id: string, text: string) => {
      setStressors((prev) =>
        prev.map((s) => (s.id === id ? { ...s, text, updatedAt: new Date().toISOString() } : s)),
      );
    },
    [setStressors],
  );

  /** Usuwa stresor; zwraca usunięty element + indeks (do undo). */
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

  /** Wstawia z powrotem na pozycję (undo). */
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

  /** Nadpisuje kolejność tablicą id (np. po `Pairing`). */
  const setOrder = useCallback(
    (orderedIds: string[]) => {
      setStressors((prev) => {
        const byId = new Map(prev.map((s) => [s.id, s]));
        const next = orderedIds
          .map((id) => byId.get(id))
          .filter((s): s is Stressor => Boolean(s));
        // defensywnie dopnij wszystko, czego nie ma na liście
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
    /** Status persystencji (błędy zapisu/odczytu + retry). */
    storage: storage as LocalStorageStatus,
  };
}
