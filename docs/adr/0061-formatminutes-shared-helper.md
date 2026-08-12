# 0061 - formatMinutes lives in shared, not in module run
**Date**: 2026-07-08
**Module**: run / cross-cutting
**Status**: Accepted

## Context
The `run-estimated-time-totals` feature (ADR 0059/0060) needs a minutes → "2h 35m" / "45m" formatter on **three** surfaces in three modules: `RunStatTiles` (`run`), `DominantRunCard` (`dashboard`), and `SessionFilter` (`focus`).

The `run` module already has `formatDuration(seconds)` in `run/types/run.ts`. The natural impulse — add `formatMinutes` next to it. But `dashboard` already imports from `run` (`@/modules/run/types/run`), and **`focus` does not** — the `focus` funnel module doesn't reach into `run` today. Putting `formatMinutes` in `run` + using it in `focus` would create a new `focus` → `run` dependency, opposite to the architecture's direction: `run` aggregates funnel data, the funnel modules don't import from `run` (`run/stats.ts` reads localStorage without funnel hooks precisely to avoid a cycle).

## Decision
`formatMinutes(totalMinutes: number): string` lives in **a new file `src/shared/format.ts`** (the shared layer), not in the `run` module. Algorithm: minutes → "2h 35m" (h+m), "45m" (m only), "0m" (0) — parallel to `formatDuration`, but with input in minutes.

`formatDuration` (seconds, today in `run/types/run.ts`) stays where it is — out of scope for this feature; moving it to `shared` (with de-duplication) is a separate decision.

## Impact
A new file `src/shared/format.ts`. `run`/`dashboard`/`focus` import `formatMinutes` from `@/shared/format` — no new inter-module dependency (`focus` → `run`), the architecture's direction preserved. The residual edit (location) is written up in the feature plan.
