# [0049] - Run clickable-steps feature edge-case baseline
**Date**: 2026-07-01
**Module**: run
**Status**: Accepted

## Context
The `clickable-run-steps-and-details-actions-on-top` feature (ADR 0047/0048) was built (residual direct-edits, commit `5ed168a`): a clickable `FunnelStepper`, a guard on leaving an active focus session (ConfirmDialog), and reordering the actions above the list on `RunDetails`. The `run` module was already audited (base ADR 0024 + per-run-isolation ADR 0046) — this audit covers **only** the new cases the feature introduces, mainly "jumping to a step with unmet conditions" (funnel screens formerly reachable only from the guided flow, now directly).

## Decision
The audit is in `docs/modules/run-edgecases.md` (the "Feature audit: clickable funnel steps…" section, codes `CS-*`). **6** new gaps: 🔴 0 · 🟡 2 · 🟢 4. A positive result: all 5 funnel screens degrade to an empty-state/CTA on a jump with an empty funnel — no blank screens and no dead-ends. Top priorities: **CS-2** (clickable "future" steps look disabled — affordance, → design/polish) and **CS-1** (session guard only on the stepper, back/reload don't ask — inconsistency, → harden/compromise).

## Impact
`proto-harden` has little to do here: the CS-1 decision (accept vs extend the guard) + a minor CS-3 (tighten the guard on `currentTask`). Most goes to `proto-design`/`proto-polish` (the CS-2 affordance, CS-4 copy, the CS-5 degenerate state, CS-6 a11y). No gaps require `proto-lofi` — the feature is functionally complete. Refresh this baseline if the feature changes (e.g. step locking, a stepper on Details).
