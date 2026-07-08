/**
 * Współdzielone formatery wartości. Używane cross-module (run / dashboard / focus),
 * dlatego w `shared`, a nie w module `run` — moduły lejka nie importują z wnętrza `run`
 * (kierunek zależności: run agreguje dane lejka, nie odwrotnie; ADR 0061).
 */

/**
 * Minuty → zwarty czas ludzki: `2h 35m`, `45m`, `0m`. Wejście w **minutach** (np. suma
 * presetów `EstimatedTime`), w odróżnieniu od `formatDuration` (sekundy, `run/types/run.ts`).
 * Algorytm równoległy do `formatDuration`, ale bez sufiksu „s".
 */
export function formatMinutes(totalMinutes: number): string {
  const m = Math.max(0, Math.floor(totalMinutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0 && mm > 0) return `${h}h ${mm}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
