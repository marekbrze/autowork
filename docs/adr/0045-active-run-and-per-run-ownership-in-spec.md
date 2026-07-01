# 0045 - Introduce Active Run + per-Run ownership into the run spec

**Date**: 2026-07-01
**Module**: run
**Status**: Accepted

## Context
During `proto-detail run` for the `per-run-funnel-isolation` feature (ADR 0044), the `run` module spec needed the concept the feature introduces: an **active Run** (`activeRunId`) whose funnel the user works, and **per-Run ownership** of funnel data. Until now the spec described multi-Run as visible objects (ADR 0020) but kept funnel data global (a documented deferral). The feature makes the `MODULES.md` *hosts* relationship real, so the spec must capture the new interactions (switching, no-active-Run guard, cascade delete, archive clears active).

## Decision
Updated `docs/modules/run.md` with: per-Run ownership + active-Run concept in Vision; Create/Continue now **set the active Run**; Delete does **cascade** delete of the Run's funnel data and clears active; Archive **clears active** → Dashboard; new edge cases (no-active-Run guard → redirect to Dashboard; switch mid-funnel discards unsubmitted draft); per-Run live stats (supersedes the "data is global / deferred" note). Confirmed UX decisions with the user: no-active-Run → Dashboard; delete active → no active + Dashboard; unsubmitted draft → not persisted; archive active → clear + Dashboard.

Shared docs updated: `ACTIONS.md` (Create/Continue set active; Delete cascades), `ENTITY_MAP.md` (new value `activeRunId`; `TaskOrder` now per-Run), `GLOSSARY.md` (new term **Active Run** `activeRunId`; Run entry notes per-Run funnel).

## Impact
Spec now describes per-Run isolation as the intended model (target of ADR 0044). Implementation still pending — the `per-run-funnel-isolation` feature plan (`docs/changes/per-run-funnel-isolation.md`) builds it: residual data-layer first (runId on entities, `run:active` store + context, re-scoped hooks, per-Run stats, cascade delete, migration), then lofi/edgecases/harden/design. The four UX decisions feed `proto-edgecases`/`proto-harden` (no-active-Run guard, switch-mid-funnel draft, active-deleted/archived redirects). No new entity/term beyond `activeRunId`; no new user action (switch is implicit via Create/Continue).
