# 0058 - Decompose task-status display edge-case baseline
**Date**: 2026-07-02
**Module**: decompose
**Status**: Accepted

## Context
`proto-feature` (ADR 0056) and `proto-detail` (ADR 0057) planned a thin, read-only slice on `decompose`: show a task's state (`completed`/`dismissed`) + a progress counter + de-emphasis of resolved next-actions. Before implementation (the residual edit in `NextActionItem.tsx`), a feature-focused stress-test of the new behaviors was run. The rest of the module was already audited/hardened (`decompose-edgecases.md`, ADR 0010/0011) — not repeated.

## Decision
Diagnosed in `docs/modules/decompose-task-status-edgecases.md`. **11** findings: 🔴 0 · 🟡 4 · 🟢 7. The biggest source of fragility: **interaction with the existing `DecomposeModal`** — the modal operates on text only and doesn't know about task state, so editing a done task's text silently reverts it to `pending` (#1).

Top priorities for `proto-harden` (to implement alongside the residual edit):
- #1 — a state-aware `DecomposeModal` (show ✓/⊘ by a step, or warn when editing a handled one).
- #3 — a11y: done/irrelevant + resolved next-action przekazane do AT (glyph+tekst + aria).
- #4 — a defensive default→neutral for a missing `state` (`migrate.ts` doesn't backfill `state`).
- #2 — confirm the counter wording (default "X/N done", parity with `Run.progress`).

## Impact
No 🔴 — a read-only feature, with no data loss / dead-ends / blockers. `proto-harden` will implement #1/#3/#4 alongside the residual edit in `src/modules/decompose/components/NextActionItem.tsx` (+ possibly `DecomposeModal.tsx` for #1) and add stories (resolved next-action, a mix of states, dismissed-only, a task without `state`). After implementation, re-run `proto-edgecases` to refresh the baseline.
