# 0060 - Add estimated-time totals to Run stats
**Date**: 2026-07-08
**Module**: run
**Status**: Accepted

## Context
The `run-estimated-time-totals` feature (plan: `docs/changes/run-estimated-time-totals.md`, ADR 0059) adds a visible **total estimated time** to a Run — the size of the work in a pass (sum of `EstimatedTime`). `Run` is already a "visible object with stats" (ADR 0020), and its stats (`timeSpent`, `progress`, …) are **derived live** from tasks in `deriveRunStats` (`run/stats.ts`). The new aggregate must enter through the same channel — one source of truth, consumed by Details, the dashboard, and the focus filter.

## Decision
Add to `RunStats` (`src/modules/run/types/run.ts`) two fields computed in `deriveRunStats` (`src/modules/run/stats.ts`), in the same loop as today's `timeSpent`/`doneCount`:

- **`estimatedTotalMin`** — suma `t.estimatedTime` po taskach z `estimatedTime != null` (wszystkie stany). Rozmiar pracy.
- **`estimatedRemainingMin`** — sum of `t.estimatedTime` over tasks with `estimatedTime != null` **and** state ∈ {`pending`, `active`, `skipped`} (i.e. ∉ `completed`/`dismissed`). The "not done" definition is consistent with `doneCount` (completed+dismissed); `skipped` counts as remaining ("not now", returns to the pool).

Jednostka = **minuty** (jak `EstimatedTime`, preset 5/15/30/45/60) — inna niż `timeSpentSec` (sekundy). Display przez `formatMinutes` (ADR 0061). Brak persystencji — czysto wyprowadzane, więc `useLiveRuns` rozda je automatycznie (już today spreads `deriveRunStats(tasks)`).

**Shared docs updated**: `ENTITY_MAP.md` (Run attributes + diagram), `GLOSSARY.md` (`EstimatedTotal`, `EstimatedRemaining`), `docs/modules/run.md` (Vision, the "View Details" flow, the RunDetails screen, the "no estimates" edge, integration).

## Impact
`RunStats` grows from 4 to 6 fields. `deriveRunStats` + the interface change (a residual edit, written up in the plan). The display states when there are no estimates (`estimatedTotalMin === 0` → a `—` tile, the card segment omitted) are routed to `proto-harden`. It doesn't touch persistence or other entities — a pure read-only aggregate.
