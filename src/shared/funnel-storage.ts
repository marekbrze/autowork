/**
 * Per-Run namespaced klucze localStorage dla danych lejka (ADR 0044 — każdy Run ma własny
 * zestaw stresorów/zadań/…). Jedno źródło prawdy o formacie klucza: hooki lejka budują z nich
 * swój store, `useLiveRuns` czyta statystyki, a `clearRunFunnelData` kasuje przy Delete Run.
 */

export const stressorsKey = (runId: string): string => `capture:stressors:${runId}`;
export const nextActionsKey = (runId: string): string => `decompose:nextActions:${runId}`;
export const tasksKey = (runId: string): string => `decompose:tasks:${runId}`;
export const reasonsKey = (runId: string): string => `decompose:reasons:${runId}`;
export const doneVisionsKey = (runId: string): string => `decompose:doneVisions:${runId}`;
export const focusFilterKey = (runId: string): string => `focus:filter:${runId}`;
export const focusSessionKey = (runId: string): string => `focus:session:${runId}`;
export const focusTaskOrderKey = (runId: string): string => `focus:taskOrder:${runId}`;

/** Wszystkie per-Run klucze lejka (do kaskady przy Delete Run). */
const FUNNEL_KEY_BUILDERS: Array<(runId: string) => string> = [
  stressorsKey,
  nextActionsKey,
  tasksKey,
  reasonsKey,
  doneVisionsKey,
  focusFilterKey,
  focusSessionKey,
  focusTaskOrderKey,
];

/**
 * Usuwa wszystkie per-Run dane lejka danego Runa (kaskada przy Delete Run, ADR 0044).
 * Best-effort: usuwa bezpośrednio z localStorage (po Delete user nawiguje na Dashboard,
 * więc hooki lejka nie są zamontowane — brak starych stanów w pamięci).
 */
export function clearRunFunnelData(runId: string): void {
  for (const key of FUNNEL_KEY_BUILDERS) {
    try {
      window.localStorage.removeItem(key(runId));
    } catch {
      // usuwanie jest best-effort
    }
  }
}
