# 0014 - Process edge-case baseline

**Date**: 2026-06-28
**Module**: process
**Status**: Accepted

## Context
The `process` prototype (a 3-screen state machine: summary → processing → done, the `dopadone` pattern) handled happy paths, and most edge cases were already accounted for in the module spec, with many of them — including LocalStorage error handling (toast + retry) — already implemented despite the "after `proto-harden`" annotations. What was missing was a systematic stress-test of the built screens.

## Decision
An audit was run (`proto-edgecases`) — the result is in `docs/modules/process-edgecases.md`. **10 gaps** found (🔴 1 · 🟡 3 · 🟢 6). The gaps cluster around one root: integrating the processing flow with the storage layer's honest persistence.

Top priorytety (hand-off do `proto-harden`):
1. **#1 (🔴)** — `commit` advances the step and sets ✓ even on a **failed attribute write** (quota/disabled) → the UI lies, the attribute vanishes after refresh. `updateTask`/`deleteTask` return `void` and don't report the write's success.
2. **#2 (🟡)** — deleting a task with no confirmation/undo, even though `decompose` has a reusable `ConfirmDialog`.
3. **#3 (🟡)** — globalny handler Enter „double-fires" przy sfokusowanym przycisku (option-card / Edit / Trash); guard wyklucza tylko INPUT/TEXTAREA.
4. **#4 (🟡)** — brak powrotu do summary z pierwszego kroku processing.

## Impact
`proto-harden` implements the priority list (recommended first: #1, #2, #3). After the prototype changes — re-run `proto-edgecases` to refresh the baseline (especially verify #1 after any `updateTask` signature change).
