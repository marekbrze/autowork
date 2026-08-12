export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export function generateId(): string {
  // crypto.randomUUID requires a secure context (https / localhost). On plain-HTTP
  // outside localhost it is undefined → fallback, so addStressor doesn't throw.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Motivation valence (`Reason` in `decompose`).
 * - `positive` — approach (gain): what the user gains when they finish.
 * - `negative` — avoidance (pain relief): what awaits the user if they don't do it.
 */
export type Valence = 'positive' | 'negative';

/**
 * Positive vision of the stressor's done state (`doneVision` on `Stressor`).
 * A vivid, sensory description of the payoff — text + emoji. Optional, 0..1 per stressor.
 * Created in `decompose`, consumed in `focus` ("remember why you're doing this").
 */
export interface DoneVision {
  text: string;
  emoji: string;
}
