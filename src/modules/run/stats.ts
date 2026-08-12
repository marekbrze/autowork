import type { Task } from '@/modules/decompose/types/task';

import type { FunnelStep, RunStats } from './types/run';

/**
 * Deriving Run statistics and the resume step **live** from global funnel data
 * (ADR 0020 — cross-module integration phase). Previously `run.stats` / `lastReachedStep`
 * were written once at creation and never synchronized (see docs/changes/
 * dashboard-run-stats-disconnected.md). The funnel keeps data in separate stores
 * (`capture:stressors`, `decompose:tasks`, …); these functions aggregate it into the
 * shape the Run view layer expects.
 *
 * Note: funnel data is scoped per-Run (`runId`, ADR 0044) — `useLiveRuns` reads a given
 * Run's store, so each card/Details shows its own set of stats.
 */

/**
 * Computes a Run's stats from its tasks. Denominator = all tasks; numerator (done) =
 * `completed` + `dismissed` (ADR 0017); `skipped` does NOT count (it comes back next session).
 * Time = sum of `timerElapsed` over done tasks. Total/remaining estimate = sum of
 * `EstimatedTime` (over estimated tasks); remaining = not-done, consistent with `doneCount` (ADR 0060).
 */
export function deriveRunStats(tasks: Task[]): RunStats {
  const totalTasks = tasks.length;
  let doneCount = 0;
  let dismissedCount = 0;
  let timeSpentSec = 0;
  let estimatedTotalMin = 0;
  let estimatedRemainingMin = 0;
  for (const t of tasks) {
    if (t.state === 'completed') {
      doneCount += 1;
      timeSpentSec += t.timerElapsed;
    } else if (t.state === 'dismissed') {
      doneCount += 1;
      dismissedCount += 1;
    }
    // `EstimatedTime` is optional (nullable, attached in `process`); we only count estimated tasks.
    // Remaining = states ∉ completed/dismissed (pending/active/skipped — still to do).
    if (t.estimatedTime != null) {
      estimatedTotalMin += t.estimatedTime;
      if (t.state !== 'completed' && t.state !== 'dismissed') {
        estimatedRemainingMin += t.estimatedTime;
      }
    }
  }
  return {
    timeSpentSec: Math.round(timeSpentSec),
    doneCount,
    dismissedCount,
    totalTasks,
    estimatedTotalMin,
    estimatedRemainingMin,
  };
}

/** Funnel signals we derive the resume step from (Continue, ADR 0022). */
export interface FunnelSignals {
  stressorCount: number;
  nextActionCount: number;
  taskCount: number;
  /** `completed + dismissed`. */
  doneCount: number;
  /** A paused focus session that can be resumed (a snapshot with a non-empty queue). */
  hasResumableSession: boolean;
}

/**
 * Derives the furthest reached funnel step from the presence of data (run.md §Continue).
 * Rules, from most specific first:
 *   everything resolved → celebration · paused session → focus · ≥1 task → focus ·
 *   next-actions (no tasks) → process · stressors (no breakdown) → ranking · empty → brain-dump.
 *
 * Limitation: we don't distinguish "ranked vs unranked" stressors (order is implied by
 * position in the array, with no flag), so stressors-without-breakdown are routed to ranking
 * (the safest "next step"). Reported case (stressors + tasks) → focus.
 */
export function deriveLastReachedStep(s: FunnelSignals): FunnelStep {
  if (s.taskCount > 0 && s.doneCount >= s.taskCount) return 'celebration';
  if (s.hasResumableSession) return 'focus';
  if (s.taskCount > 0) return 'focus';
  if (s.nextActionCount > 0) return 'process';
  if (s.stressorCount > 0) return 'ranking';
  return 'brain-dump';
}
