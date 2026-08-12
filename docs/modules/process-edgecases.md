# Process — Edge Cases

## Coverage
- **Spec already captured** (`docs/modules/process.md` → Edge Cases, 11 items): nothing to process (empty state); task with all 3 attributes skipped; skip → null (nudge); going back to an assigned step with pre-fill; sidebar jump → task's first step; mid-session delete → jump to next; editing name to empty → cancel; long name → truncation; long session → one step per screen; LocalStorage error (toast + retry); returning to `process` after `focus` (recompute).
- **Already handled in code**:
  - Empty / no tasks → empty state "All done" + "Next to focus" — `ProcessView.tsx:360-369`
  - A fully described task never enters the session (`missingSteps` filter) — `ProcessView.tsx:74-76`, `:109`
  - Skip zostawia null, nie blokuje — `ProcessView.tsx:193-197`
  - Back with pre-fill of the current value — `ProcessView.tsx:142-147`, `:174-176`
  - Skok sidebar → krok taska — `ProcessView.tsx:219-222`
  - Mid-session delete → jump to next (or done) — `ProcessView.tsx:240-260`
  - Edycja do pustego anuluje (nie usuwa) — `TaskNameEditor.tsx:29-31`
  - Long session: one step per screen, sidebar provides orientation — by design
  - **LocalStorage error (toast + retry) — ALREADY implemented even though the spec said "after `proto-harden`"** — `ProcessView.tsx:530-536`, `StorageStatusToast.tsx`
  - Return after `focus`: `sessionTasks` is a `useMemo` recomputing missing attributes — `ProcessView.tsx:107-115`
  - References: deleted stressor/next-action → "No stressor" group + sorted at rank 99 — `ProcessView.tsx:111`, `ProcessingSidebar.tsx:69`
- **New gaps found**: **10** ( 🔴 1 · 🟡 3 · 🟢 6 )
- **Headline**: the prototype is in good shape — the spec was accurate, and most edge cases (including LocalStorage error handling) are already implemented. The gaps cluster around **one root**: integrating the processing flow with the storage layer's honest persistence.

> **Status after `proto-harden`** (ADR 0015): **8/10 closed** ✅, **2 deferred** ❌ (#7 — session-position persistence = a new feature outside harden's scope; #10 — the "← Dashboard" link = a design decision, not a bug). Details in the **Status** column below.

## Inventory

| # | Status | Severity | Category | Edge case | Fix / behavior | Where |
|---|--------|----------|----------|-----------|----------------|-------|
| 1 | ✅ | 🔴 | Prototype-specific (honest persistence) | A failed attribute write still advances the step and sets ✓ | `commit`/`saveEdit`/`handleDelete` set ✓ and advance **only after a successful write** (`updateTask`/`deleteTask` return `boolean`, and so does `setValue`). On failure we stay on the step + a `writeError` toast; after a successful `retry` the effect completes the commit (✓ + advance). The UI always reflects the saved state. | `ProcessView.tsx` `commit()` + retry `useEffect`; `use-tasks.ts` `updateTask`/`deleteTask`; `use-local-storage.ts` `setValue` |
| 2 | ✅ | 🟡 | Action outcomes (destructive) | Mid-session task deletion — no confirmation, no undo | Trash opens a `ConfirmDialog` (AlertDialog); deletion only after "Delete task". `ConfirmDialog` promoted from `decompose` to `shared/` (reuse, `useId` for aria). | `ProcessView.tsx` `confirmDeleteId` + `<ConfirmDialog>`; `shared/components/ConfirmDialog.tsx` |
| 3 | ✅ | 🟡 | Forms / input (keyboard) | Global Enter "double-fires" when a button (option-card / Edit / Trash) is focused | The global `keyHandler` now also suppresses for `BUTTON`/`A` (not only INPUT/TEXTAREA) — Enter on a focused button/link works the native way, without double-fire. Also fixes the double `startSession` on summary. | `ProcessView.tsx` `keyHandlerRef` (guard `INPUT|TEXTAREA|BUTTON|A`) |
| 4 | ✅ | 🟡 | Navigation / flow | No way back to the summary after starting processing (first step) | `goBack()` with `cursorIndex === 0` → `setScreen('summary')`; "← Back" always rendered (also ←). | `ProcessView.tsx` `goBack()` + Back render |
| 5 | ✅ | 🟢 | Data states | Done screen: wrong pluralization at 0 + landing on done with 0 tasks | `pluralTasks(n)` (full rule: 1/task, 2–4/tasks, 5+/many); when a deletion empties the session → summary (not done "0 tasks"). | `ProcessView.tsx` `pluralTasks()` + `handleDelete` (empty session → summary) |
| 6 | ✅ | 🟢 | Data states (long text) | Main task name + stressor header + breadcrumb aren't truncated | Main: `line-clamp-2` + `title` (design decision); sidebar stressor header and breadcrumb: `truncate` + `title`. | `ProcessView.tsx` main `<h2>` + breadcrumb; `ProcessingSidebar.tsx` stressor header |
| 7 | ❌ | 🟢 | Loading / navigation | Session position not persisted — refresh / browser back throws to summary | **Deferred:** persisting `screen`+`cursorIndex` is a new feature (resume in place), outside harden's scope (states of existing flows). No work is lost — committed attributes persist, the queue recomputes. | — |
| 8 | ✅ | 🟢 | Data states (long list) | Sidebar with no scroll container / no auto-scroll to the current task | Task list: `max-h-[60vh] overflow-y-auto`; current task auto-scrolled into view (`scrollIntoView({block:'nearest'})`). | `ProcessingSidebar.tsx` container + `useEffect` |
| 9 | ✅ | 🟢 | Errors | Only the task storage status is surfaced | `storageView` aggregates read/write across three stores (tasks/stressors/nextActions); `retry`/`dismiss` called for all; `entityLabel` "tasks" on task-store failure, "data" in general. | `ProcessView.tsx` `storageView` |
| 10 | ❌ | 🟢 | Navigation / flow (spec consistency) | A free-floating "← Dashboard" link contradicts the spec's "no free-floating nav links" | **Deferred:** a design decision (escape hatch vs "leading, not a menu"), not a bug — left to the designer. | — |

Categories checked with no gaps (so the reader knows they were on the list):
- **Special chars / unicode / emoji**: no problem — React escapes text, options are constant enums/presets (`ProcessView.tsx:50-71`).
- **Boundary values (0 / ujemne / maks.)**: N/A — atrybuty dobierane z kart, brak swobodnego wpisu liczbowego.
- **Validation (field)**: the only free-text is the name editor; an empty draft = cancel (per the spec) — no error, by design.
- **Unexpected error → `alert()`**: **none** in the user path (the only `window.confirm` is dev-only `DevToolbar.tsx:14`).
- **State transitions**: `process` filters by `state === 'pending'` and only assigns attributes — it doesn't trigger task transitions; no risk of an illegal transition (`ProcessView.tsx:109`).
- **Offline**: LocalStorage works offline, no network at all — the prototype functions.

## Post-harden summary (ADR 0015)
Closed in `proto-harden`, in priority order:
1. **✅ #1 Honest-persistence (🔴)** — `commit`/`saveEdit`/`handleDelete` advance only after a successful write; the effect completes the commit after `retry`. The biggest fragility removed (silent attribute loss with a false ✓).
2. **✅ #2 Delete confirmation** — `ConfirmDialog` (promoted to `shared/`), consistent with `decompose`.
3. **✅ #3 Enter double-fire** — guard wyklucza `BUTTON`/`A`.
4. **✅ #4 Return to summary from step 0** — `goBack` → summary, Back always visible.
5. **✅ #5 Polonizacja done + routing pustej sesji** — `pluralTasks`, pusta sesja → summary.
6. **✅ #6 Long name** — clamp-2 (main) + truncate (header/breadcrumb).
7. **✅ #8 Sidebar scroll + auto-scroll** — `max-h` + `scrollIntoView`.
8. **✅ #9 Toast scope** — aggregation of 3 stores.

Odroczone (❌):
- **#7 Persystencja pozycji sesji** — nowa funkcja (wznowienie w miejscu), poza zakresem harden; praca nie ginie.
- **#10 Link „← Dashboard"** — decyzja designu (escape hatch vs spec), nie bug.

## Stories
- `Process/ProcessView`: `WithData`, `EmptyState`, `AllProcessed`, **`LongName`** (#6), **`StorageReadError`** (#9 / read-error toast).
- `Shared/ConfirmDialog`: `DeleteNextAction`, `DeleteReason`, **`DeleteTask`** (#2), `Closed`.
- Interactive states (#1 write-fail + retry, #3 Enter) verified by click-through in `npm run dev` — they can't be shown statically in a story without mocking storage.
