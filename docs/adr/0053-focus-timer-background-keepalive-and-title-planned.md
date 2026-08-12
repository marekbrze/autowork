# 0053 - Focus timer background keep-alive + tab title planned

**Date**: 2026-07-02
**Module**: focus
**Status**: Accepted

## Context
A feature request on the living system: (1) the tab title should show the focus session timer's live elapsed; (2) the timer in Edge stops counting when the tab is in the background (throttling/sleeping the main thread's `setInterval`). Root cause: `use-focus-timer.ts` counts **by ticks** (`prev + 1`), not by time — so lost background ticks = permanent drift. Impact scoping was required before implementation.

## Decision
Planned in `docs/changes/focus-timer-background-keepalive-and-tab-title.md`. Touches **only the `focus` module**; no new module, no new entities/fields (a `Timer` mechanism change, not a model one). MVP: title = `${clock} · [state] — Autowork`; a **timestamp-based** timer (always correct on return) + **live background tick** (Web Worker) + Wake Lock (screen active when visible) + resync on `visibilitychange`. 3 items deferred (Later).

Routing: **mainly residual direct-edit** (rewriting `use-focus-timer.ts` to timestamp + a new Worker + Wake Lock + a title hook) — the classic `lofi`/`harden`/`design` funnel doesn't apply, because the feature adds no screens or visual surfaces. Supporting: `proto-detail focus` (spec deltas + shared-doc notes) → residual → `proto-edgecases focus` → possibly `proto-harden focus`. 5 residual direct-edits (file:line in the change doc).

## Impact
`proto-detail` writes notes into ENTITY_MAP/ACTIONS/GLOSSARY + a new edge case in `focus.md`. The residual builds the mechanism in `src/modules/focus/`. `proto-edgecases`/`proto-harden` verify background/visibility robustness. DESIGN.md is untouched (no on-screen change). Re-run `proto-feature` if the scope changes.
