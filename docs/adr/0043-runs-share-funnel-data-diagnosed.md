# 0043 - Bug: runs share the same funnel data (diagnosed)

**Date**: 2026-07-01
**Module**: run (+ multi-module: capture, decompose, process, focus)
**Status**: Accepted

## Context
A bug report: creating a **new Run** shows the **same stressors and tasks** as the previous Run. The user expects each Run to be a separate set of stressors/tasks (*"każdy run to powinien być oddzielny zestaw zadań i stresorów"*), but every Run edits and displays one shared funnel.

## Decision
Diagnosed in `docs/changes/runs-share-funnel-data.md`. Root cause: **data/state — deferred architecture never built** (a documented spec-vs-code drift). The entire funnel data layer lives in **global localStorage keys with no `runId`** (`capture:stressors`, `decompose:tasks`, `decompose:nextActions`, `decompose:reasons`, `decompose:doneVisions`, `focus:filter`, `focus:session`, `focus:taskOrder`), the funnel entities (`Stressor`, `NextAction`, `Task`) carry **no `runId`**, and there is **no concept of an active Run** anywhere (`grep activeRun|activeRunId|currentRun` → 0 hits). The funnel modules import nothing from `run` (`grep @/modules/run` in `capture/decompose/process/focus` → 0 hits). `createRun` (`use-runs.ts:27-45`, called from `DashboardView.tsx:53`) only prepends a Run record to `run:runs` — it sets no active-Run pointer and clears/scope nothing — so the new Run reads the same global funnel. Compounding: `useLiveRuns` (`use-live-runs.ts:35,49-52`) maps the one global `stats`/`lastReachedStep` onto **every** Run, so cards also show identical progress/resume. This is an explicit, documented deferral (ADR 0020; `run.md:96`; `run.ts:21`; `use-live-runs.ts:19-20`), already anticipated as `proto-feature` in `dashboard-run-stats-disconnected.md:79`.

Severity: 🔴 high — a broken primary flow (Create Run → fresh funnel) on the module whose value is multi-run isolation; not data loss, and single-active-run usage still works. Deterministic, structural.

## Impact
Fix routes to **`proto-feature` (multi-module)**, not a direct edit / harden / polish — it is a data-model change: add `runId` to funnel entities, introduce an active-Run pointer, scope the stores (key-per-Run vs. runId-field), make `createRun`/Continue/delete isolate and cascade, derive per-Run stats, and migrate existing global localStorage. No smaller safe interim exists (clearing stores on create loses the previous Run's data). proto-feature fans out to edgecases/harden/lofi per its plan. Regression surface spans every funnel hook caller and every funnel-data reader across capture/decompose/process/focus/run/dashboard, plus scenarios and Storybook fixtures. Re-run `proto-bug` if the implemented fix reveals a deeper cause (e.g. active-Run switching mid-funnel, in-flight session across switches).
