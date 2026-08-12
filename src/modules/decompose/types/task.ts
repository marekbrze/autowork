import type { BaseEntity } from '@/shared/types';

/**
 * The execution context of a task — assigned in `process` (exactly one).
 * GTD-style categories; multiple selection happens only at the session filter (`focus`).
 */
export type Context = 'Phone' | 'Message' | 'Creative' | 'Errands' | 'Home' | 'City';

/**
 * The energy a task needs — a 1..3 scale (Low / Medium / High),
 * rendered as battery icons. Assigned in `process`.
 */
export type Energy = 1 | 2 | 3;

/** Estimated time (min) — a preset; the source of the timer value in `focus`. */
export type EstimatedTime = 5 | 15 | 30 | 45 | 60;

/** Task lifecycle: pending → active → completed | skipped | dismissed. */
export type TaskState = 'pending' | 'active' | 'completed' | 'skipped' | 'dismissed';

/**
 * An atomic, executable unit — an item in the focus list. Created from a
 * `NextAction` in `decompose` (broken down 1..N; a concrete next-action = 1 task).
 *
 * Created HERE as a "bare" task (only text + membership); the attributes
 * `context` / `energy` / `estimatedTime` are assigned later in `process`,
 * and `timerElapsed` is consumed in `focus`.
 */
export interface Task extends BaseEntity {
  text: string;
  nextActionId: string;
  /** Denormalized for convenience (motivation / grouping by stressor). */
  stressorId: string;
  /** The Run this task belongs to (ADR 0044 — per-Run funnel ownership). */
  runId: string;
  state: TaskState;
  /** Assigned in `process`. */
  context?: Context;
  energy?: Energy;
  estimatedTime?: EstimatedTime;
  /** Persisted timer counter — for resuming in `focus`. */
  timerElapsed: number;
}
