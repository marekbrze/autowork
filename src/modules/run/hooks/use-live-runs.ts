import { useCallback, useMemo } from 'react';

import { tasksKey, stressorsKey, nextActionsKey } from '@/shared/funnel-storage';
import type { Task } from '@/modules/decompose/types/task';
import type { Stressor } from '@/modules/capture/types/stressor';
import type { NextAction } from '@/modules/decompose/types/next-action';

import { deriveLastReachedStep, deriveRunStats } from '../stats';
import type { Run } from '../types/run';
import { useRuns } from './use-runs';

/** Safe localStorage read + parse (falls back on missing/corrupt JSON). */
function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * `useRuns` + per-Run stats / resume step derived from each Run's funnel stores (ADR 0044).
 * Each Run shows **its own** progress (previously all Runs shared one global set).
 *
 * Stats are read **directly** from localStorage (not via the funnel hooks) — that way the `run`
 * module doesn't import the `capture`/`decompose` hooks (ending the dependency cycle; the funnel
 * imports `active-run` from `shared`, not the other way around). On management screens
 * (Dashboard/Archived) we don't edit the funnel, so the lack of live reactivity is acceptable —
 * returning to a screen = remount = a fresh read. RunDetails computes stats **locally** from its
 * own scoped hooks (reactively).
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
          // Cosmetic for the card (routing to /focus is the same regardless of session);
          // the actual session resume is settled by FocusView for the active Run.
          hasResumableSession: false,
        });
        return { ...r, stats, lastReachedStep };
      }),
    [runs],
  );

  const getRun = useCallback((id: string): Run | undefined => live.find((r) => r.id === id), [live]);

  return { ...runsApi, runs: live, getRun };
}
