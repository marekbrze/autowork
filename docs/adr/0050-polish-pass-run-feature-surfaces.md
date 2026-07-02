# [0050] - Polish pass on run feature surfaces (clickable funnel steps)
**Date**: 2026-07-01
**Module**: run
**Status**: Accepted

## Context
The clickable-steps feature (ADR 0047/0048, edge baseline ADR 0049) was functionally complete. The audit flagged **CS-2**: clickable non-active stepper steps used `text-muted-foreground/60` — washed-out, reading as **disabled** despite being clickable. That is drift vs the system's own nav/chip affordance (`NavLink` ghost, `SessionFilter` `Chip`, `buttonVariants`). Pre-ship polish needed on the feature surfaces.

## Decision
Scoped to the **feature surfaces** (clickable `FunnelStepper` + `RunDetails` reorder + focus-session-leave dialog), quality bar **MVP+**. Root cause of CS-2 = one-off muted `/60` (symptom of "looks disabled"); fix = align to the system pattern, not invent. Non-active stepper steps are now **full-opacity text + `hover:bg-muted`** (clearly interactive — disabled in this system is `opacity-50`, not muted text), active stays strong brand-green; added `active:translate-y-px` + `transition-all` to match `buttonVariants` press feedback. `RunDetails` action region (Continue primary in contextual box, management grid below) and the shared-`ConfirmDialog` leave-dialog were already on-brand post-reorder — no drift found, no changes.

## Impact
Feature surfaces read as properly interactive (CS-2 resolved). Remaining audit items stay routed: **CS-3** (guard over-trigger) is a `proto-harden` logic item; **CS-4** (process copy) is out of `run` module scope. The broader `run` module (`RunCard`/`ArchivedRuns`/`ReviewRun`/`ActiveRunChip`) is still at harden-level — a `proto-design` hi-fi pass should precede any flagship polish there. Re-run `proto-audit` later for a fresh baseline on evolved code.
