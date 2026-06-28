import { useCallback } from 'react';

import { useLocalStorage, type LocalStorageStatus } from '@/shared/hooks/use-local-storage';
import { generateId } from '@/shared/types';
import type { Valence } from '@/shared/types';

import type { Reason } from '../types/reason';

const STORAGE_KEY = 'decompose:reasons';

export function useReasons() {
  const [reasons, setReasons, , storage] = useLocalStorage<Reason[]>(STORAGE_KEY, []);

  const addReason = useCallback(
    (stressorId: string, text: string, valence: Valence): Reason => {
      const now = new Date().toISOString();
      const item: Reason = { id: generateId(), stressorId, text, valence, createdAt: now, updatedAt: now };
      setReasons((prev) => [...prev, item]);
      return item;
    },
    [setReasons],
  );

  const updateReason = useCallback(
    (id: string, text: string) => {
      setReasons((prev) =>
        prev.map((r) => (r.id === id ? { ...r, text, updatedAt: new Date().toISOString() } : r)),
      );
    },
    [setReasons],
  );

  const deleteReason = useCallback(
    (id: string) => {
      setReasons((prev) => prev.filter((r) => r.id !== id));
    },
    [setReasons],
  );

  return {
    reasons,
    addReason,
    updateReason,
    deleteReason,
    /** Status persystencji (błędy zapisu/odczytu + retry). */
    storage: storage as LocalStorageStatus,
  };
}
