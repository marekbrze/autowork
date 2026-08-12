import type { BaseEntity } from '@/shared/types';

/**
 * Funnel step reached in a Run — drives the "Continue" routing (ADR 0022).
 * Order from entry to payoff.
 */
export type FunnelStep =
  | 'brain-dump'
  | 'ranking'
  | 'decompose'
  | 'process'
  | 'focus'
  | 'celebration';

/** Run state (ADR 0021). `in_progress` = active/resumable; `archived` = in history, reversible. */
export type RunState = 'in_progress' | 'archived';

/**
 * Run statistics. The value stored in `run:runs` is just a seed (zeros on creation); the
 * view layer merges in stats **derived live** from that Run's funnel tasks (`run/stats.ts`
 * → `useLiveRuns`) — each Run shows its own progress (per-Run, ADR 0044).
 */
export interface RunStats {
  /** Total focus time (sum of `timerElapsed`), in seconds. */
  timeSpentSec: number;
  /** Resolved tasks: `completed + dismissed` (things the user no longer works on). */
  doneCount: number;
  /** Stale tasks (`dismissed`) — a subset of `doneCount`, broken out in the stats. */
  dismissedCount: number;
  /** Total number of tasks in the Run. */
  totalTasks: number;
  /** Total estimated time (min) — sum of `EstimatedTime` over estimated tasks (ADR 0060). */
  estimatedTotalMin: number;
  /** Remaining estimated time (min) — sum over estimated, not-done tasks (∉ completed/dismissed; ADR 0060). */
  estimatedRemainingMin: number;
}

/** An item in the Run's manual review (ADR 0023). */
export interface ReviewItem {
  id: string;
  kind: 'stressor' | 'task';
  text: string;
  /** `true` = stale / to remove. `false` = still relevant. */
  stale: boolean;
}

/**
 * Run — the top-level container of the funnel, a **visible object with stats** (ADR 0020).
 * Persistent, resumable (Continue), archived manually and reversibly (ADR 0021),
 * permanently deletable (the only terminal operation).
 */
export interface Run extends BaseEntity {
  name: string;
  state: RunState;
  lastReachedStep: FunnelStep;
  stats: RunStats;
  /** Items for manual review (relevant vs stale). */
  reviewItems: ReviewItem[];
  /** Last activity — drives list sorting ("recently"). */
  lastActiveAt: string;
}

/** Funnel step labels for display (e.g. "you'll resume at: Focus session"). */
export const STEP_LABEL: Record<FunnelStep, string> = {
  'brain-dump': 'Brain dump',
  ranking: 'Stress ranking',
  decompose: 'Breakdown (WHY + HOW)',
  process: 'Processing',
  focus: 'Focus session',
  celebration: 'Celebration',
};

/** Step → funnel route map that "Continue" navigates to (ADR 0022). */
export const STEP_ROUTE: Record<FunnelStep, string> = {
  'brain-dump': '/capture',
  ranking: '/capture/ranking',
  decompose: '/decompose',
  process: '/process',
  focus: '/focus',
  celebration: '/focus',
};

/** Run progress in percent: `(doneCount) / totalTasks` (ADR 0020). 0 when there are no tasks. */
export function runProgress(run: Run): number {
  if (run.stats.totalTasks === 0) return 0;
  return Math.round((run.stats.doneCount / run.stats.totalTasks) * 100);
}

/** How many tasks are still left (remaining). */
export function runRemaining(run: Run): number {
  return Math.max(0, run.stats.totalTasks - run.stats.doneCount);
}

/** Whether a Run is completed (all tasks resolved) — a derived state, not a formal one. */
export function isRunCompleted(run: Run): boolean {
  return run.stats.totalTasks > 0 && run.stats.doneCount >= run.stats.totalTasks;
}

/**
 * Format seconds → compact human time: `42m`, `1h 5m`, `2h`, `45s`.
 * (Unlike the focus `formatClock` `M:SS` — here a quick scan of stats is what matters.)
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}
