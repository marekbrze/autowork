export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export function generateId(): string {
  // crypto.randomUUID wymaga secure context (https / localhost). Na plain-HTTP
  // poza localhost jest undefined → fallback, żeby addStressor nie rzucił.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Walencja motywacji (`Reason` w `decompose`).
 * - `positive` — approach (zysk): co user zyska, gdy skończy.
 * - `negative` — avoidance (uniknięcie bólu): co usera czeka, gdy tego nie zrobi.
 */
export type Valence = 'positive' | 'negative';

/**
 * Pozytywna wizja zrobionego stanu stresora (`doneVision` na `Stressor`).
 * Żywy, zmysłowy opis payoffu — tekst + emoji. Opcjonalne, 0..1 na stresor.
 * Tworzone w `decompose`, konsumowane w `focus` („pamiętaj, po co to robisz").
 */
export interface DoneVision {
  text: string;
  emoji: string;
}
