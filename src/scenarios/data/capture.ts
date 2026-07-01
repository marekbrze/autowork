import { generateId } from '@/shared/types';
import type { Stressor } from '@/modules/capture/types/stressor';

function stressor(text: string, runId: string): Stressor {
  const now = new Date().toISOString();
  return { id: generateId(), text, runId, createdAt: now, updatedAt: now };
}

/** Minimalny zestaw — krótki brain dump (3 stresory) dla danego Runa. */
export function captureStressorsMinimal(runId: string): Stressor[] {
  return ['car needs fixing', 'ending the lease', 'talk to the boss about a raise'].map((t) =>
    stressor(t, runId),
  );
}

/** Pełny zestaw — dłuższy brain dump (7 stresorów) dla danego Runa. */
export function captureStressorsFull(runId: string): Stressor[] {
  return [
    'car needs fixing',
    'ending the lease',
    'talk to the boss about a raise',
    'overdue taxes',
    'bathroom renovation',
    'unpaid invoices',
    'conflict with the neighbor',
  ].map((t) => stressor(t, runId));
}
