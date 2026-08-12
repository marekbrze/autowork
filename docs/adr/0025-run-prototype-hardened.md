# 0025 - run prototype hardened

**Date**: 2026-06-29
**Module**: run
**Status**: Accepted

## Context
The `run` prototype handled happy paths, but the `proto-edgecases` audit (`docs/modules/run-edgecases.md`, ADR 0024) found 16 gaps (🔴 0 · 🟡 9 · 🟢 7). The biggest group — CM-1/2/3 (stats / `lastReachedStep` / review-items wired to real funnel data) — is **cross-module feature work** (needs `runId` on stressors/tasks + data partitioning across all funnel steps + scenarios), outside harden's scope.

## Decision
Design decision: **mark the stats as overview + defer the real wiring** (CM-1/2/3 → ❌, the Run-integration phase / the `dashboard` module). A discreet "Overview stats…" caption on `RunStatTiles`. The rest of the harden — local states on existing screens (6 implemented):
- **LE-1** — a storage read-error state (`RunReadError`) instead of a misleading empty-state on the lists (`RunsList`, `ArchivedRuns`).
- **FI-1 / DS-2** — rename validation (disabled "Save" + `aria-invalid` + a message) + `maxLength` 60 + a card-title `truncate`.
- **ST-1** — a completed Run → a celebration section + an "Archive" CTA (`RunCompleted`).
- **AO-2** — a `ConfirmDialog` on "Remove stale" in Review.
- **AO-3** — honest persistence: the delete dialog closes only after a successful write.

Deferred (❌, for good reason): CM-1/2/3 (cross-module), FI-2 (rename is non-destructive), AO-1 (implicit feedback is enough), DS-1/DS-3/DS-4/LE-2/NF-1 (polish / conscious compromises). Each gap has a status + `file:line` in `run-edgecases.md → Resolution`.

## Impact
The `run` prototype now deliberately handles every path (success and error): read errors, rename validation, destructive confirmations, the completed state. The happy path is unchanged. The biggest fragmentation removed: a misleading empty-state on a corrupt `run:runs` → a clear error state with recovery. CM-1/2/3 remain an open architectural decision for the Run-integration phase. The visual treatment / celebration is a future `proto-design`.
