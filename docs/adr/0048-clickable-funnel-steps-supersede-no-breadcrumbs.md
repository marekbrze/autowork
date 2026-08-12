# [0048] - Clickable funnel steps (supersede "no breadcrumbs")
**Date**: 2026-07-01
**Module**: run
**Status**: Accepted
**Supersedes**: 0001 (zapis „Bez breadcrumbs")

## Context
During `proto-detail` of the `run` module (feature `clickable-run-steps-and-details-actions-on-top`, plan ADR 0047) the user confirmed that the funnel steps already displayed on the funnel screens (`FunnelStepper`) should simply be clickable — free navigation across the active Run's steps. This reverses the decision accepted in ADR 0001 / UI-STRATEGY "guided funnel without breadcrumbs / steps are not free links".

## Decision
`FunnelStepper` becomes clickable navigation: all 5 steps = links to the active Run's `STEP_ROUTE`; the current step = also a link (click = no-op); leaving an active focus session → ConfirmDialog (confirm = pause + persist the `focus:session` snapshot, resumable via `SessionResumeBanner`; cancel = stay). A jump **does not update `lastReachedStep`** (Continue is still derived from funnel data, not from the last jump). Locking future steps is deferred (Later). Two decisions confirmed directly with the user: (1) the current step = also a link (no-op); (2) leaving an active session = ConfirmDialog (not silent pausing).

## Impact
`UI-STRATEGY.md`: flip "Breadcrumbs: No" → "Yes" + update the navigation-structure note. `ACTIONS.md`: +action "Navigate to funnel step". `GLOSSARY.md`: +term `FunnelStepper`. `docs/modules/run.md`: a new "Navigation across a Run's steps (clickable stepper)" flow, an updated "View Details" flow/screen (actions above the list), +action in the table, +edge cases. Implemented by: residual direct-edits (`FunnelStepper.tsx` spans→Links, `RunDetails.tsx` reorder) → `proto-edgecases run` (jumps to steps with unmet conditions, consistency after the reorder) → `proto-harden run` → `proto-design/polish run`. The "No breadcrumbs" record in ADR 0001 — superseded.
