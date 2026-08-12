# 0022 - Kontynuuj: smart-routing resume do najdalszego kroku

**Date**: 2026-06-29
**Module**: run
**Status**: Accepted

## Context
On resuming a Run ("Continue" from a card on the dashboard) you need to decide which screen to land on. The user anchored one principle: "if there are already processed tasks ready to do → definitely the execution screen." The open question was whether missing attributes block entering focus — ADR 0013 says **no** (attributes are optional, nudge-not-gate).

## Decision
**Continue** routes to the furthest funnel step that still has work:
1. a focus session is paused → **resume the session** (timer from the saved position);
2. ≥1 task → **focus** (session filter / start) — **attributes don't gate** (ADR 0013): any existing task is "ready"; a task without a given attribute simply won't match filters that require it;
3. no tasks, but there are unprocessed tasks → **process**;
4. ranked stressors with no NextActions → **decompose**;
5. stresory nierankingowane → **capture / ranking**;
6. no stressors → **capture / brain dump**;
7. everything done → **Details** (the "completed" state).

The Run tracks `lastReachedStep` (`FunnelStep`), which drives the routing.

## Impact
- `ENTITY_MAP.md`: Run gains a `lastReachedStep` attribute (`FunnelStep`); added a `FunnelStep` value type.
- `ACTIONS.md`: `Resume Run` → `Continue (resume)` z opisem routingu.
- `docs/modules/run.md`: flow Continue.
