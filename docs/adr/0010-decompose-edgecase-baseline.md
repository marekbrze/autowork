# 0010 - Decompose edge-case baseline
**Date**: 2026-06-28
**Module**: decompose
**Status**: Accepted

## Context
The `decompose` prototype handles happy paths (optional WHY, HOW gated by ≥1 next-action, skip-breakdown = 1 task, a safety-net materializing bare next-actions), but it hadn't yet been stress-tested for edge cases. `proto-edgecases` ran a systematic audit of spec + code.

## Decision
Audyt zapisany w `docs/modules/decompose-edgecases.md`. Znaleziono **14** luk (🔴 2 · 🟡 6 · 🟢 6).

Top priorities:
1. 🔴 **Silent data loss in LocalStorage** — the four `decompose` hooks (`use-tasks`, `use-reasons`, `use-next-actions`, `use-done-visions`) throw away the 4th `useLocalStorage` element (the `writeError`/`readError`/`retry` status), even though the persistence layer is "honest". A write doesn't "succeed" in the UI, and a corrupt read silently falls back. Identical to the blockers `capture` removed in ADR 0009 (`StorageStatusToast`).
2. 🟡 **No undo on deletion** — delete next-action (with tasks) and delete reason with no undo; inconsistent with `capture` (ADR 0004).
3. 🟡 **Edit-to-empty = silent deletion** (`NextActionItem.commit`).
4. 🟡 **Cross-module lifecycle** — a deleted stressor orphans `decompose` data (no cascade); re-breaking recreates task IDs and wipes future attributes (`context`/`energy`/`estimatedTime`) — latent, to resolve with `run`/before `process`.

## Impact
`proto-harden` implements the priority list from `docs/modules/decompose-edgecases.md` (starting with surfacing the storage status + undo), without changing the happy path. The biggest fragility: the same **silent data loss in the LocalStorage layer** that `capture` just hardened — `decompose` has its counterpart. After the prototype changes, re-run `proto-edgecases` to refresh the baseline.
