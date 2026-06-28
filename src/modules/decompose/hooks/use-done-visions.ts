import { useCallback } from 'react';

import { useLocalStorage, type LocalStorageStatus } from '@/shared/hooks/use-local-storage';
import type { DoneVision } from '@/shared/types';

/**
 * `doneVision` — opcjonalna (0..1) pozytywna wizja zrobionego stanu stresora.
 * Konceptualnie atrybut `Stressor` (ADR 0005); w prototypie trzymana
 * side-storem (klucz → wizja), żeby zostawić `capture` nietkniętym.
 */
type DoneVisionMap = Record<string, DoneVision>;

const STORAGE_KEY = 'decompose:doneVisions';

export function useDoneVisions() {
  const [visions, setVisions, , storage] = useLocalStorage<DoneVisionMap>(STORAGE_KEY, {});

  const setDoneVision = useCallback(
    (stressorId: string, vision: DoneVision | null) => {
      setVisions((prev) => {
        const next = { ...prev };
        if (vision && vision.text.trim()) next[stressorId] = vision;
        else delete next[stressorId];
        return next;
      });
    },
    [setVisions],
  );

  const getDoneVision = useCallback((stressorId: string): DoneVision | undefined => visions[stressorId], [visions]);

  return {
    visions,
    getDoneVision,
    setDoneVision,
    /** Status persystencji (błędy zapisu/odczytu + retry). */
    storage: storage as LocalStorageStatus,
  };
}
