# 0054 - Focus timer background behavior + tab title specified

**Date**: 2026-07-02
**Module**: focus
**Status**: Accepted

## Context
Detailing pass (`proto-detail focus`) for the ADR 0053 feature (live background timer + time in the tab title). The new behaviors must be captured in the module spec and shared docs, so the implementation (residual direct-edits) has a written reference. Product decisions (live background tick, title = time + app name) were made in `proto-feature`; in this skill the `· over` suffix in the title was additionally confirmed.

## Decision
Zespecyfikowano delty feature'u:
- `docs/modules/focus.md` — Vision (the timer runs in the background, always correct; the time in the tab title), a note in the Timer actions, a new Edge case "Background tab / sleeping tab (Edge Sleeping Tabs)".
- `docs/ENTITY_MAP.md` — the `Timer` entity: an addendum on the timestamp-based mechanism + background correctness + Web Worker / Wake Lock / title.
- `docs/ACTIONS.md` — nowa akcja systemowa Timera „(stays accurate in background)".
- `docs/GLOSSARY.md` — an expanded `Timer` definition (background, title, Wake Lock, Web Worker).

Title format: `12:34 — Autowork` (+ `· paused` w pauzie, + `· over` po przekroczeniu oszacowania — `· over` potwierdzone z userem).

## Impact
The module spec + shared docs reflect the feature before implementation. The implementation (residual: rewriting `use-focus-timer.ts` to timestamp + a new Worker + Wake Lock + a title hook) realizes what's written here. Next, `proto-edgecases focus` diagnoses the background/visibility edge cases, and `proto-harden` verifies robustness.
