# 0059 - Feature run estimated-time totals planned
**Date**: 2026-07-08
**Status**: Accepted

## Context
A feature request on the living system: the user wants to see the **total estimated time** of a Run's tasks (sum of `EstimatedTime`) — **on the dashboard** (motivation/commitment before starting work) and **in the focus session filter** (a decision on how long a work block they're signing up for before clicking Start). It needed impact scoping before implementation.

## Decision
Zaplanowane w `docs/changes/run-estimated-time-totals.md`.

- **Scope:** passive display of a new aggregate — **no new user actions**. The aggregate is derived live from the existing `Task.estimatedTime`.
- **Modules:** extends **3 existing** — `run` (aggregate owner: new `RunStats` fields + `deriveRunStats` + a tile in `RunStatTiles`), `dashboard` (a segment in `DominantRunCard`), `focus` (a counter in `SessionFilter`).
- **New module:** no.
- **Cross-module:** low risk — a new value via the existing `deriveRunStats`; `useLiveRuns` already distributes `stats` to cards/Details (the new fields will flow automatically), and focus computes its subset locally. No new entity relation.
- **MVP:** total on the dashboard + Details + focus filter; remaining as a sub-line on Details. Deferred: a prominent "remaining", mini-cards, the archive, an estimate-vs-actual framing.
- **Routing:** `proto-detail run` (spec) → **residual direct-edits** (aggregate + helper + 3 displays) → `proto-edgecases run` → `proto-harden run` (the no-estimate states) → optionally `proto-design`/`proto-polish`.
- **Residual:** 6 edits in 5 files (+ possibly a new `src/shared/format.ts` with `formatMinutes`).

Low risk — a thin, read-only slice; the main attention is units (estimate = minutes vs `timeSpent` = seconds) and semantics (total vs remaining), resolved in the plan (total as the main number; remaining cheap, on a sub-line).

## Impact
`proto-detail`/`edgecases`/`harden`/`design`/`polish` work off the plan; the residual implements the core. A `DESIGN.md` constraint: hi-fi surfaces, maintain tabular-nums and the style of existing tiles/lines. Re-run `proto-feature` if the scope changes (e.g. estimate-editing actions, mini-cards/archive in the MVP, a prominent "remaining").
