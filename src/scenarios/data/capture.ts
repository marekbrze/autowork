import { generateId } from '@/shared/types';
import type { Stressor } from '@/modules/capture/types/stressor';

function stressor(text: string): Stressor {
  const now = new Date().toISOString();
  return { id: generateId(), text, createdAt: now, updatedAt: now };
}

/** Minimalny zestaw — krótki brain dump (3 stresory). */
export const captureStressorsMinimal: Stressor[] = [
  stressor('car needs fixing'),
  stressor('ending the lease'),
  stressor('talk to the boss about a raise'),
];

/** Pełny zestaw — dłuższy brain dump (7 stresorów), dobry do testowania rankingu i parowania. */
export const captureStressorsFull: Stressor[] = [
  stressor('car needs fixing'),
  stressor('ending the lease'),
  stressor('talk to the boss about a raise'),
  stressor('overdue taxes'),
  stressor('bathroom renovation'),
  stressor('unpaid invoices'),
  stressor('conflict with the neighbor'),
];
