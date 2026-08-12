import type { Context, Energy } from '@/modules/decompose/types/task';

/** `focus` screens: filter selection → session → summary. */
export type FocusScreen = 'filter' | 'session' | 'summary';

/**
 * Snapshot of an interrupted session — persisted so it can be resumed (Exit / refresh /
 * browser-back). Stores the queue + position; `timerElapsed` is remembered per task
 * (on the Task entity). Best-effort: losing the bookmark = no resume (no data loss),
 * so the snapshot write is NOT gated in actions (unlike Task state writes).
 */
export interface SessionSnapshot {
  queue: string[];
  cursor: number;
}

/**
 * Session filter (step 5). Contexts and energies are **multi-select** (≥1 of each);
 * matches tasks whose context ∈ contexts and energy ∈ energies.
 */
export interface FilterSelection {
  contexts: Context[];
  energies: Energy[];
}

export const EMPTY_FILTER: FilterSelection = { contexts: [], energies: [] };

/** GTD context labels — local copy (shared meaning with `process`). */
export const CONTEXT_LABELS: Record<Context, string> = {
  Phone: 'Phone',
  Message: 'Message',
  Creative: 'Creative',
  Errands: 'Errands',
  Home: 'Home',
  City: 'City',
};

export const CONTEXT_ORDER: Context[] = ['Phone', 'Message', 'Creative', 'Errands', 'Home', 'City'];

export const ENERGY_LABELS: Record<Energy, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
};

export const ENERGY_ORDER: Energy[] = [1, 2, 3];

/**
 * Format seconds → `M:SS` (or `H:MM:SS` above an hour). The focus timer counts
 * up (model B, ADR 0016), so values may exceed the estimate threshold.
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
