import type { BaseEntity, Valence } from '@/shared/types';

/**
 * A reason why the stressor matters to the user — part of the motivational
 * material (the WHY in `decompose`). Carries a valence: positive (gain)
 * or negative (avoiding pain). Created in `decompose`, consumed later
 * in `focus` as a reminder of "why you're doing this".
 */
export interface Reason extends BaseEntity {
  stressorId: string;
  text: string;
  valence: Valence;
  /** The Run this reason belongs to (ADR 0044). */
  runId: string;
}
