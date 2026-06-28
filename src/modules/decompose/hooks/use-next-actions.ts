import { useCallback } from 'react';

import { useLocalStorage, type LocalStorageStatus } from '@/shared/hooks/use-local-storage';
import { generateId } from '@/shared/types';

import type { NextAction } from '../types/next-action';

const STORAGE_KEY = 'decompose:nextActions';

export function useNextActions() {
  const [nextActions, setNextActions, , storage] = useLocalStorage<NextAction[]>(STORAGE_KEY, []);

  const addNextAction = useCallback(
    (stressorId: string, text: string): NextAction => {
      const now = new Date().toISOString();
      const item: NextAction = { id: generateId(), stressorId, text, createdAt: now, updatedAt: now };
      setNextActions((prev) => [...prev, item]);
      return item;
    },
    [setNextActions],
  );

  const updateNextAction = useCallback(
    (id: string, text: string) => {
      setNextActions((prev) =>
        prev.map((n) => (n.id === id ? { ...n, text, updatedAt: new Date().toISOString() } : n)),
      );
    },
    [setNextActions],
  );

  const deleteNextAction = useCallback(
    (id: string) => {
      setNextActions((prev) => prev.filter((n) => n.id !== id));
    },
    [setNextActions],
  );

  return {
    nextActions,
    addNextAction,
    updateNextAction,
    deleteNextAction,
    /** Status persystencji (błędy zapisu/odczytu + retry). */
    storage: storage as LocalStorageStatus,
  };
}
