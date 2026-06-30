# 0033 - Bug: dashboard run stats disconnected (diagnosed)

**Date**: 2026-06-30
**Module**: dashboard, run
**Status**: Accepted

## Context
A bug report after deploy: a run with many stressors and tasks shows **0% / „No tasks yet"** on the Dashboard, and **Continue** always routes back to brain dump — as if the run had nothing in it.

## Decision
Diagnosed in `docs/changes/dashboard-run-stats-disconnected.md`. Root cause: **data/state — deferred cross-module integration never wired**. The `Run` object's `stats` / `lastReachedStep` / `lastActiveAt` are written once at creation (`use-runs.ts:34-39`) and never updated; the funnel keeps its data in separate global stores (`capture:stressors`, `decompose:tasks`, …) with no coupling to runs. The Dashboard reads the frozen `run.stats`, so it renders zeros forever. The progress data itself exists in `decompose:tasks` (`Task.state`, persisted via `updateTask` from focus) — it is simply not aggregated. The spec flags this as deferred (`run.md:75`, `dashboard.md:69`); the deploy surfaced it as a user-visible bug.

Severity: 🔴 high — broken primary flow on the entry screen (progress + resume), not data loss. Counting semantics confirmed with the user: progress = `(completed + dismissed) / total tasks`; total = all tasks (not the session-filtered subset).

## Impact
Fix routes to a **direct edit** (no proto skill covers deferred-integration wiring): add `deriveRunStats(tasks)` from `decompose:tasks`, merge it into runs at the display layer, and separately derive `lastReachedStep` to fix Continue routing. Regression sites: every `run.stats` reader (`DominantRunCard`, `RunCard`, `RunStatTiles`, `RunDetails`) and every `lastReachedStep` consumer. Multi-run caveat: `decompose:tasks` is global → all runs share one progress set in the prototype; true per-run stays `proto-feature` (ADR 0020). Re-run `proto-bug` if the fix reveals a deeper cause.
