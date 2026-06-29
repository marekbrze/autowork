import type { Context, Energy } from '@/modules/decompose/types/task';

/** Ekrany `focus`: wybór filtra → sesja → podsumowanie. */
export type FocusScreen = 'filter' | 'session' | 'summary';

/**
 * Snapshot przerwanej sesji — persystowany, by można było wznowić (Exit / refresh /
 * browser-back). Przechowujemy kolejkę + pozycję; `timerElapsed` pamięta per task
 * (na encji Task). Best-effort: utrata bookmarka = brak wznowienia (nieutrata danych),
 * dlatego zapis snapshotu NIE jest bramkowany w akcjach (różnica vs zapisy stanów Task).
 */
export interface SessionSnapshot {
  queue: string[];
  cursor: number;
}

/**
 * Filtr sesji (krok 5). Konteksty i energie są **wielokrotne** (≥1 z each);
 * dopasowuje taski, których kontekst ∈ contexts i energia ∈ energies.
 */
export interface FilterSelection {
  contexts: Context[];
  energies: Energy[];
}

export const EMPTY_FILTER: FilterSelection = { contexts: [], energies: [] };

/** Etykiety kontekstów GTD — lokalna kopia (współdzielone znaczenie z `process`). */
export const CONTEXT_LABELS: Record<Context, string> = {
  Phone: 'Telefon',
  Message: 'Wiadomość',
  Creative: 'Kreatywne',
  Errands: 'Sprawunki',
  Home: 'Dom',
  City: 'Miasto',
};

export const CONTEXT_ORDER: Context[] = ['Phone', 'Message', 'Creative', 'Errands', 'Home', 'City'];

export const ENERGY_LABELS: Record<Energy, string> = {
  1: 'Niska',
  2: 'Średnia',
  3: 'Wysoka',
};

export const ENERGY_ORDER: Energy[] = [1, 2, 3];

/**
 * Format sekund → `M:SS` (lub `H:MM:SS` powyżej godziny). Timer focus liczy
 * w górę (model B, ADR 0016), więc wartości mogą przekraczać próg oszacowania.
 */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const ss = String(sec).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`;
  return `${m}:${ss}`;
}
