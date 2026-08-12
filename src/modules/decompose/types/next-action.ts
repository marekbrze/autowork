import type { BaseEntity } from '@/shared/types';

/**
 * A direction / idea that moves the stressor forward (the HOW in `decompose`).
 * Coarser than a task — written in **active, concrete language** (a verb
 * up front, physically doable; the ADR 0006 standard). Broken down into 1..N
 * `Task`s (a concrete next-action = 1 task; a coarse one = several).
 */
export interface NextAction extends BaseEntity {
  stressorId: string;
  text: string;
  /** The Run this next-action belongs to (ADR 0044). */
  runId: string;
}
