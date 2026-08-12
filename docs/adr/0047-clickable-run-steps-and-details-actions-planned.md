# [0047] - Feature: clickable funnel steps + Run Details actions on top — planned
**Date**: 2026-07-01
**Status**: Accepted
**Supersedes**: 0001 (partially — the "No breadcrumbs" record)

## Context
A feature request on a living system: (1) the user wants to navigate a Run's steps (Stressors › Ranking › Actions › Processing › Focus) by clicking the already-displayed `FunnelStepper` (display-only today), and (2) move all actions on `/run/:runId` above the task list (today a scroll to the bottom). Both dimensions touch the `run` module + the shared `FunnelStepper`. They needed scoping before implementation — especially since part 1 **reverses** the accepted "guided funnel without breadcrumbs" decision (ADR 0001, UI-STRATEGY.md).

## Decision
Planned in `docs/changes/clickable-run-steps-and-details-actions-on-top.md`. Touches the `run` module (the step model + `RunDetails` IA) and the shared `FunnelStepper`. **New module: no.** MVP: all steps clickable (no locking) + all actions above the list. **Supersede** the "No breadcrumbs" record in ADR 0001 / UI-STRATEGY — the funnel becomes freely navigable within the active Run (the user, directly: "the steps already exist and are displayed — they should just be clickable"). 4 items deferred (step locking, a stepper on details, a sticky action bar, a stepper in the shell). Routing: `proto-detail run` → residual direct-edits (`FunnelStepper.tsx`, `RunDetails.tsx`) → `proto-edgecases run` → `proto-harden run` (conditionally) → `proto-design/polish run`. 2 residual direct-edits.

## Impact
`proto-detail` writes the spec + shared-doc (the UI-STRATEGY flip, ACTIONS +navigate, GLOSSARY optional) and registers this ADR. The residual edits make the stepper clickable (spans→Links + a per-stage route) and move the actions above the list. `proto-edgecases`/`harden` cover jumps to steps with unmet preconditions. `proto-design/polish` give the affordance and the action hierarchy. Re-run `proto-feature` if the scope changes (e.g. locking, a stepper on details).
