import { generateId } from '@/shared/types';
import type { Stressor } from '@/modules/capture/types/stressor';

function stressor(text: string, runId: string): Stressor {
  const now = new Date().toISOString();
  return { id: generateId(), text, runId, createdAt: now, updatedAt: now };
}

/** Minimal set — a short brain dump (3 stressors) for a given Run. */
export function captureStressorsMinimal(runId: string): Stressor[] {
  return ['car needs fixing', 'ending the lease', 'talk to the boss about a raise'].map((t) =>
    stressor(t, runId),
  );
}

/** Full set — a longer brain dump (7 stressors) for a given Run. */
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
