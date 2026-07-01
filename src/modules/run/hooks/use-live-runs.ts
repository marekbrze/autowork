import { useCallback, useMemo } from 'react';

import { tasksKey, stressorsKey, nextActionsKey } from '@/shared/funnel-storage';
import type { Task } from '@/modules/decompose/types/task';
import type { Stressor } from '@/modules/capture/types/stressor';
import type { NextAction } from '@/modules/decompose/types/next-action';

import { deriveLastReachedStep, deriveRunStats } from '../stats';
import type { Run } from '../types/run';
import { useRuns } from './use-runs';

/** Bezpieczny odczyt+parse z localStorage (fallback przy braku/uszkodzonym JSON). */
function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * `useRuns` + statystyki / krok resume wyprowadzane per-Run z各自 stores lejka (ADR 0044).
 * Każdy Run pokazuje **swój** progres ( wcześniej wszystkie Runy dzieliły jeden globalny zestaw).
 *
 * Statystyki czytane **bezpośrednio** z localStorage (nie przez hooki lejka) — dzięki temu moduł
 * `run` nie importuje hooków `capture`/`decompose` (koniec cyklu zależności; lejek importuje
 * `active-run` z `shared`, nie odwrotnie). Na ekranach zarządczych (Dashboard/Archived) nie
 * edytujemy lejka, więc brak reaktywności w locie jest akceptowalny — powrót na ekran = remount =
 * świeży odczyt. RunDetails liczy statystyki **lokalnie** ze swoich scope'owanych hooków (reaktywnie).
 */
export function useLiveRuns() {
  const runsApi = useRuns();
  const { runs } = runsApi;

  const live = useMemo(
    () =>
      runs.map((r) => {
        const tasks = readJson<Task[]>(tasksKey(r.id), []);
        const stressors = readJson<Stressor[]>(stressorsKey(r.id), []);
        const nextActions = readJson<NextAction[]>(nextActionsKey(r.id), []);
        const stats = deriveRunStats(tasks);
        const lastReachedStep = deriveLastReachedStep({
          stressorCount: stressors.length,
          nextActionCount: nextActions.length,
          taskCount: tasks.length,
          doneCount: stats.doneCount,
          // Kosmetyczne dla karty (routing do /focus taki sam bez względu na sesję);
          // rzeczywiste wznowienie sesji rozstrzyga FocusView dla aktywnego Runa.
          hasResumableSession: false,
        });
        return { ...r, stats, lastReachedStep };
      }),
    [runs],
  );

  const getRun = useCallback((id: string): Run | undefined => live.find((r) => r.id === id), [live]);

  return { ...runsApi, runs: live, getRun };
}
