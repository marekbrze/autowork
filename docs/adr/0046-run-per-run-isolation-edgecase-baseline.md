# 0046 - Run per-Run-isolation edge-case baseline

**Date**: 2026-07-01
**Module**: run
**Status**: Accepted

## Context
The `per-run-funnel-isolation` feature (ADR 0044) was specified in proto-detail (ADR 0045) but is **not yet built**. The active-Run concept + per-Run funnel ownership introduce new failure modes (no-active-Run dead-ends, stale pointers, cascade-delete integrity, per-Run session/stats derivation, migration). Needed a pre-implementation stress-test so the residual data-layer + `proto-lofi`/`proto-harden` handle them, not discover them after.

## Decision
Audited into `docs/modules/run-edgecases.md` (new section "Re-audit: per-Run funnel isolation"). **14 new gaps**: 🔴 2 (PR-1 no-active-Run guard on funnel routes; PR-2 `deleteRun` cascade), 🟡 9, 🟢 3. Most are **data-layer guards and integrity**, not UI states — so they route to residual/lofi, not harden. The feature **resolves the deferred CM-1/CM-2/CM-3** from the original run audit (stats / `lastReachedStep` / review disconnected — they required `runId`, which this feature provides).

Top priorities: PR-1 (guard — dead-end on every funnel entry without activation), PR-2 (cascade delete — terminal-delete promise + orphan accumulation), then the active-run integrity cluster (PR-3/5/9: pointer validation, per-Run session resume, per-Run step re-derive) which closes CM-2/CM-3, and migration (PR-6/7/8).

## Impact
Pre-implementation audit — `Where` points at the code zone that must handle each case (existing files + planned new locations), not yet-built screens. After residual (step 0) + `proto-lofi`/`proto-harden`, refresh the section's Resolution and lift the deferred CM-1/2/3 flag + the "Statystyki poglądowe" caption on `RunStatTiles`. Re-run `proto-edgecases` post-build for a built-screens baseline.
