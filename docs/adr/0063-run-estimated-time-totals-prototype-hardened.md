# 0063 - Run estimated-time-totals prototype hardened
**Date**: 2026-07-08
**Module**: run
**Status**: Accepted

## Context
Feature `run-estimated-time-totals` (ADR 0059/0060/0061, built `108aa24`) had 3 edge-case gaps diagnosed in ADR 0062 / `docs/modules/run-edgecases.md`: ET-1 "~0m left" on a completed run, ET-2 two "left" counters diverging with partial estimates, ET-3 a11y of the "—" tile.

## Decision
Hardened ET-1 + ET-2 in `RunStatTiles` (the stats screen). Deferred ET-3 to `proto-polish`.
- **ET-1** — sub-line guard tightened to `totalEst > 0 && remEst > 0`: a completed run (or one where all estimated tasks are done) no longer renders "~0m left of ~Xh estimated".
- **ET-2** — sub-line rephrased with an "Estimated:" prefix (`Estimated: ~X left of ~Y`) to scope it as the estimate metric, distinguishing it from the task-count "N left" in the rozbicie line above. Default choice (user AFK): copy rephrase over restricting display to fully-estimated runs — keeps the info, removes the ambiguity.
- **ET-3** — deferred: a11y/clarity of the "—" tile (`aria-label`/`title`) → `proto-polish`.

## Impact
The estimated-time displays now handle the completed-run and partial-estimate states deliberately, not just the happy path. Story `Run/RunStatTiles → Completed` (`remEst=0`) shows the hidden sub-line (ET-1); `InProgress` shows the rephrased "Estimated: …" line (ET-2). No model change — the read-only aggregate in `deriveRunStats` is unchanged. `tsc` + `eslint` clean. ET-3 remains for `proto-polish`; visual polish is a separate future pass.
