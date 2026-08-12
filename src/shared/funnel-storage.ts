/**
 * Per-Run namespaced localStorage keys for funnel data (ADR 0044 — each Run has its own
 * set of stressors/tasks/…). Single source of truth for the key format: funnel hooks build
 * their store from these, `useLiveRuns` reads stats, and `clearRunFunnelData` wipes them on Delete Run.
 */

export const stressorsKey = (runId: string): string => `capture:stressors:${runId}`;
export const nextActionsKey = (runId: string): string => `decompose:nextActions:${runId}`;
export const tasksKey = (runId: string): string => `decompose:tasks:${runId}`;
export const reasonsKey = (runId: string): string => `decompose:reasons:${runId}`;
export const doneVisionsKey = (runId: string): string => `decompose:doneVisions:${runId}`;
export const focusFilterKey = (runId: string): string => `focus:filter:${runId}`;
export const focusSessionKey = (runId: string): string => `focus:session:${runId}`;
export const focusTaskOrderKey = (runId: string): string => `focus:taskOrder:${runId}`;

/** All per-Run funnel keys (for cascade on Delete Run). */
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
 * Removes all per-Run funnel data for the given Run (cascade on Delete Run, ADR 0044).
 * Best-effort: deletes directly from localStorage (after Delete the user navigates to the Dashboard,
 * so funnel hooks are not mounted — no stale state in memory).
 */
export function clearRunFunnelData(runId: string): void {
  for (const key of FUNNEL_KEY_BUILDERS) {
    try {
      window.localStorage.removeItem(key(runId));
    } catch {
      // deletion is best-effort
    }
  }
}
