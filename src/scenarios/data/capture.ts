import { generateId } from '@/shared/types';
import type { Stressor } from '@/modules/capture/types/stressor';

function stressor(text: string): Stressor {
  const now = new Date().toISOString();
  return { id: generateId(), text, createdAt: now, updatedAt: now };
}

/** Minimalny zestaw — krótki brain dump (3 stresory). */
export const captureStressorsMinimal: Stressor[] = [
  stressor('samochód do naprawy'),
  stressor('wypowiedzenie umowy najmu'),
  stressor('rozmowa z szefem o podwyżce'),
];

/** Pełny zestaw — dłuższy brain dump (7 stresorów), dobry do testowania rankingu i parowania. */
export const captureStressorsFull: Stressor[] = [
  stressor('samochód do naprawy'),
  stressor('wypowiedzenie umowy najmu'),
  stressor('rozmowa z szefem o podwyżce'),
  stressor('zaległe podatki'),
  stressor('remont łazienki'),
  stressor('niezapłacone faktury'),
  stressor('konflikt z sąsiadem'),
];
