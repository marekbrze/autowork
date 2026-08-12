import { useCallback } from 'react';

import { useLocalStorage, type LocalStorageStatus } from '@/shared/hooks/use-local-storage';
import { useActiveRunId } from '@/shared/active-run';
import { doneVisionsKey } from '@/shared/funnel-storage';
import type { DoneVision } from '@/shared/types';

/**
 * `doneVision` — an optional (0..1) positive vision of the stressor's done state.
 * Conceptually an attribute of `Stressor` (ADR 0005); kept in a side-store (key → vision).
 * Per-Run: the key is namespaced by the active Run (ADR 0044) — no leak between runs.
 */
type DoneVisionMap = Record<string, DoneVision>;

/** Done-visions of the active Run (or `runId`, if provided). */
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
    /** Persistence status (read/write errors + retry). */
    storage: storage as LocalStorageStatus,
  };
}
