import { useCallback } from 'react';

import { useLocalStorage, type LocalStorageStatus } from '@/shared/hooks/use-local-storage';
import { useActiveRunId } from '@/shared/active-run';
import { doneVisionsKey } from '@/shared/funnel-storage';
import type { DoneVision } from '@/shared/types';

/**
 * `doneVision` — opcjonalna (0..1) pozytywna wizja zrobionego stanu stresora.
 * Konceptualnie atrybut `Stressor` (ADR 0005); trzymana side-storem (klucz → wizja).
 * Per-Run: klucz namespaced po aktywnym Runie (ADR 0044) — brak leaku między runami.
 */
type DoneVisionMap = Record<string, DoneVision>;

/** Done-visions aktywnego Runa (lub `runId`, jeśli podano). */
export function useDoneVisions(runId?: string) {
  const activeRunId = useActiveRunId(runId);
  const key = doneVisionsKey(activeRunId ?? '__none__');
  const [visions, setVisions, , storage] = useLocalStorage<DoneVisionMap>(key, {});

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
