# 0015 - Process prototype hardened

**Date**: 2026-06-28
**Module**: process
**Status**: Accepted

## Context
The `process` prototype handled happy paths and (largely already) the spec's edge cases, but a systematic audit (`proto-edgecases`, ADR 0014 / `docs/modules/process-edgecases.md`) found 10 unhandled gaps: 🔴 1 · 🟡 3 · 🟢 6. The most serious: on a failed LocalStorage write the processing step advanced and set ✓ even though the attribute was never saved (silent data loss with a false success signal).

## Decision
**8 of 10** edge-case states implemented (2 deferred — see below), working in priority order and not changing the happy path:

- **#1 Honest-persistence (🔴)** — `useLocalStorage.setValue` and `useTasks.updateTask`/`deleteTask` return the write's success (`boolean`); `commit`/`saveEdit`/`handleDelete` advance (✓ + advance / close the editor / session mutations) **only after a successful write**. A new effect completes the commit (✓ + advance) when an attribute persists after a successful `retry`. The UI always reflects the saved state.
- **#2 Potwierdzenie usuwania** — `ConfirmDialog` promowany z `decompose` do `shared/components/` (`useId` na aria, reuse); Trash otwiera dialog.
- **#3 Enter double-fire** — the global `keyHandler` now also suppresses for `BUTTON`/`A` (not only INPUT/TEXTAREA); Enter on a focused button/card works natively.
- **#4 Return to summary from step 0** — `goBack` → summary at `idx 0`; "← Back" always visible.
- **#5 Pluralization + routing** — `pluralTasks(n)` (full rule); emptying the session via deletion → summary (not done with zero).
- **#6 Long name** — main `line-clamp-2` + tooltip; the stressor header and breadcrumb `truncate` + tooltip.
- **#8 Sidebar** — lista z `max-h` + scroll; bieżący task auto-scrollowany (`scrollIntoView`).
- **#9 Toast scope** — `storageView` aggregates read/write across three stores (tasks/stressors/nextActions); `retry`/`dismiss` for all.

Stories: `ProcessView` (+`LongName`, `StorageReadError`), `Shared/ConfirmDialog` (+`DeleteTask`).

## Odroczone (❌)
- **#7 Persystencja pozycji sesji** (`screen`+`cursorIndex`) — to **nowa funkcja** (wznowienie w miejscu po refresh), poza zakresem harden, który dodaje stany do istniejących flow, nie nowe zachowanie. Praca nie ginie: commitowane atrybuty trwają w storze, a `buildSession` liczy kolejkę na nowo.
- **#10 The "← Dashboard" link** — a **design decision** (a conscious escape hatch vs the spec's "no free nav links"), not a bug; left to the designer.

## Impact
The `process` prototype now handles every flow path, not only the happy path, while keeping the happy path's previous behavior. The biggest fragility removed: silent attribute loss on full/unavailable LocalStorage (a false ✓) — now the UI stays on the step until a successful write. Visual polish is a separate future `proto-design`. The domain model (entities/actions/states) is unchanged — `ConfirmDialog` is a UI element, not a new domain action, so `ACTIONS.md`/`ENTITY_MAP.md` are untouched. Re-running `proto-edgecases` after further changes will refresh the baseline.
