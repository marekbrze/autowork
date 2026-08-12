# 0011 - Decompose prototype hardened
**Date**: 2026-06-28
**Module**: decompose
**Status**: Accepted

## Context
The `decompose` prototype handled happy paths (optional WHY, HOW gated by ≥1 next-action, skip-breakdown = 1 task, a safety-net materializing bare next-actions), but `proto-edgecases` (ADR 0010) found 14 unhandled edge cases — the most serious being **silent data loss in the LocalStorage layer**: four `decompose` stores (`reasons`, `nextActions`, `tasks`, `doneVisions`) threw away the persistence status from `useLocalStorage`, so a failed write vanished without a trace, and a corrupt read silently fell back to an empty list. `proto-harden` implements the states without changing the happy path.

## Decision
**8/14** edge-case states implemented (priority order from `docs/modules/decompose-edgecases.md`):

1. **Persistence (data blockers)** — the four `decompose` hooks (`use-tasks`, `use-reasons`, `use-next-actions`, `use-done-visions`) now expose `storage` (the status from `useLocalStorage`); `DecomposeView` renders a shared `StorageStatusToast` (`writeError` with retry + `readError`), combining the four stores' status into one. `StorageStatusToast` was generalized with an `entityLabel` (shared with `capture`, ADR 0009).
2. **Deletion — a confirmation dialog** (design decision: confirmation, **not** undo — unlike `capture`/ADR 0004). A hand-built `ConfirmDialog` (AlertDialog-style, in the `DecomposeModal` style) gates delete next-action (with a task cascade) and delete reason.
3. **Edit-to-empty = cancel** — `NextActionItem.commit` on an empty draft keeps the original (no silent delete; the capture #8 pattern).
4. **Task identity preservation** — `replaceTasksForNextAction` diffs by text instead of a full replace, preserving task IDs (and with them the future attributes from `process`/`focus`); observationally neutral today (decompose-edgecases #7).
5. **Polish / a11y** — `maxLength` on fields (300 / 600 on the vision textarea), reducing the A/B "tablist" to a segmented switch (`role="group"` + `aria-pressed`), a cross-tab re-sync of the local vision draft in `WhyBlock`; initial focus + Escape in modals.

**Deferred (3)**: draft and active index on exit (#5 — consistent with the `capture` design decision: discard; the data survives); orphan cascade on stressor deletion (#6 — needs the `run` module, lazy-cleanup is risky on a stressor `readError`); long-list virtualization (#12 — polish, acceptable). **Unchanged by design (2)**: duplicates (#11), the active language as a nudge not a gate (#14, ADR 0006). Modal backdrop-click-close was deliberately omitted — a project convention (`PairingFlow` doesn't do it either); focus-trap deferred (consistent with `capture`).

Design decisions (AskUserQuestion): scope → the whole module; deletion → a **confirmation dialog** (not undo).

No frameworks/libraries added — states in existing components (`@base-ui/react` + Tailwind), in the style of the existing hand-built overlays (`DecomposeModal`, `PairingFlow`). Synchronous persistence → skeletons/in-flight N/A (as in `capture`).

## Impact
Every `decompose` flow now deliberately handles the error paths too; the happy path is unchanged. The biggest fragility removed: **silent data loss in LocalStorage** — identical to what `capture` removed in ADR 0009. The new states have Storybook stories (`Decompose/ConfirmDialog`, `Decompose/StorageStatusToast`). After the changes, re-run `proto-edgecases` to refresh the baseline. Visual polish is a separate future `proto-design`.
