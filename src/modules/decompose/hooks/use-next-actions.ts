import { useCallback } from 'react';

import { useLocalStorage, type LocalStorageStatus } from '@/shared/hooks/use-local-storage';
import { useActiveRunId } from '@/shared/active-run';
import { nextActionsKey } from '@/shared/funnel-storage';
import { generateId } from '@/shared/types';

import type { NextAction } from '../types/next-action';

/** Next-actiony aktywnego Runa (lub `runId`, jeśli podano). */
export function useNextActions(runId?: string) {
  const activeRunId = useActiveRunId(runId);
  const key = nextActionsKey(activeRunId ?? '__none__');
  const [nextActions, setNextActions, , storage] = useLocalStorage<NextAction[]>(key, []);

  const addNextAction = useCallback(
    (stressorId: string, text: string): NextAction => {
      const now = new Date().toISOString();
      const item: NextAction = {
        id: generateId(),
        stressorId,
        text,
        runId: activeRunId ?? '__none__',
        createdAt: now,
        updatedAt: now,
      };
      setNextActions((prev) => [...prev, item]);
      return item;
    },
    [activeRunId, setNextActions],
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
