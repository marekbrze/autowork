# 0062 - Run estimated-time totals edge-case baseline
**Date**: 2026-07-08
**Module**: run
**Status**: Accepted

## Context
Feature `run-estimated-time-totals` (ADR 0059/0060/0061) built (commit `108aa24`) — read-only aggregate `estimatedTotalMin`/`estimatedRemainingMin` in `deriveRunStats` + 3 displays (`RunStatTiles`, `DominantRunCard`, `SessionFilter`). Needed stress-test before harden.

## Decision
Audited into `docs/modules/run-edgecases.md` (feature-audit section, appended). **3 gaps: 🔴 0 · 🟡 2 · 🟢 1.**
- **ET-1 🟡** — completed run renders "~0m left of ~Xh estimated" (`formatMinutes(0)`); trivial guard fix (`remEst > 0`).
- **ET-2 🟡** — two "left" counters diverge with partial estimates: rozbicie `{remaining}` = all not-done tasks (count); sub-line `~{remEst}` = minutes over estimated subset only.
- **ET-3 🟢** — a11y/clarity of the "—" tile when no estimates.

Feature is read-only (no new writes/actions), so forms / save-failure / dead-end categories had no gaps; classic edges already handled (no-estimate → "—", reactive re-derivation, old persisted data safe).

## Impact
`proto-harden` implements ET-1 (priority, direct-edit) + ET-2 (after a short copy/scope decision); ET-3 → `proto-polish`. No `proto-lofi` needed — feature functionally complete. Re-run `proto-edgecases` if the displays change.
