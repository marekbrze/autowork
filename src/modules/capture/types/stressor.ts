import type { BaseEntity } from '@/shared/types';

/**
 * A single stressful thing dumped from the head in a brain dump.
 * Raw material, before being broken down into actions.
 *
 * The ordering (rank: most → least stressful) is canonically
 * represented by the array position (entry order in the brain dump,
 * then arranged manually or via `Pairing` in the ranking).
 */
export interface Stressor extends BaseEntity {
  text: string;
  /** The Run this stressor belongs to (ADR 0044 — per-Run funnel ownership). */
  runId: string;
}
