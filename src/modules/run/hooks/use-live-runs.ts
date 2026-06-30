import { useCallback, useMemo } from 'react';

import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import { useStressors } from '@/modules/capture/hooks/use-stressors';
import { useNextActions } from '@/modules/decompose/hooks/use-next-actions';
import { useTasks } from '@/modules/decompose/hooks/use-tasks';
import type { SessionSnapshot } from '@/modules/focus/types/focus';

import { deriveLastReachedStep, deriveRunStats } from '../stats';
import type { Run } from '../types/run';
import { useRuns } from './use-runs';

/**
 * `useRuns` + wyprowadzane na żywo statystyki / krok resume z globalnych danych lejka
 * (zob. ../stats.ts). Zwraca te same mutacje co `useRuns`, ale `runs` / `getRun`
 * zwracają Runy z **scaloną** `stats` i `lastReachedStep` — wyłącznie do wyświetlania
 * (nie persystujemy z powrotem do `run:runs`).
 *
 * Multi-run (prototype): dane lejka są globalne, więc każdy Run pokazuje ten sam żywy
 * progres — akceptowalne dla jednego aktywnego Runa naraz; per-Run odłożone (ADR 0020).
 */
export function useLiveRuns() {
  const runsApi = useRuns();
  const { stressors } = useStressors();
  const { nextActions } = useNextActions();
  const { tasks } = useTasks();
  const [snapshot] = useLocalStorage<SessionSnapshot | null>('focus:session', null);

  const stats = useMemo(() => deriveRunStats(tasks), [tasks]);

  const lastReachedStep = useMemo(
    () =>
      deriveLastReachedStep({
        stressorCount: stressors.length,
        nextActionCount: nextActions.length,
        taskCount: tasks.length,
        doneCount: stats.doneCount,
        hasResumableSession: Boolean(snapshot && snapshot.queue.length > 0),
      }),
    [stressors.length, nextActions.length, tasks.length, stats.doneCount, snapshot],
  );

  const runs = useMemo(
    () => runsApi.runs.map((r) => ({ ...r, stats, lastReachedStep })),
    [runsApi.runs, stats, lastReachedStep],
  );

  // Nadpisujemy getRun, by zwracało Run ze scalonymi (żywymi) polami.
  const getRun = useCallback((id: string): Run | undefined => runs.find((r) => r.id === id), [runs]);

  return { ...runsApi, runs, getRun };
}
