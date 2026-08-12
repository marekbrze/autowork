/**
 * Shared value formatters. Used cross-module (run / dashboard / focus),
 * hence in `shared` rather than the `run` module — funnel modules do not import from inside `run`
 * (dependency direction: run aggregates funnel data, not the other way around; ADR 0061).
 */

/**
 * Minutes → compact human time: `2h 35m`, `45m`, `0m`. Input is in **minutes** (e.g. the sum of
 * `EstimatedTime` presets), unlike `formatDuration` (seconds, `run/types/run.ts`).
 * Algorithm parallel to `formatDuration`, but without the "s" suffix.
 */
export function formatMinutes(totalMinutes: number): string {
  const m = Math.max(0, Math.floor(totalMinutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0 && mm > 0) return `${h}h ${mm}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
