# 0019 - focus prototype hardened

**Date**: 2026-06-29
**Module**: focus
**Status**: Accepted

## Context
The `focus` module was built in `proto-lofi` (the happy paths worked), and the `proto-edgecases` audit
(`docs/modules/focus-edgecases.md`) found **10** unhandled paths: 🔴 1 · 🟡 4 · 🟢 5.
The most serious: action handlers (Done/Skip/Dismiss/Back/Clear) called `advance()` regardless
of the `updateTask`/`deleteTask` write result, so on full/disabled LocalStorage the UI moved on
while the state wasn't saved → after reload the task returned as `pending` (silent data loss).

## Decision
**9** of 10 gaps implemented (1 deferred for a reason). Full map: `docs/modules/focus-edgecases.md`
(sekcja „Hardening status"). Kluczowe decyzje:

- **#1 Honest persistence** — every handler checks the result of `updateTask`/`deleteTask` and on failure
  zapisu **nie advance'uje / nie zmienia ekranu** (wzorzec `ProcessView.tsx` `if (!ok) return`).
  the `StorageStatusToast` with retry stays visible, the user stays on the task. The biggest
  prototype fragility removed.
- **#2 Resume sesji** (decyzja designu) — snapshot sesji (`queue` + `cursor`) persystowany w
  `focus:session`; entering `/focus` with an interrupted session shows an **opt-in banner** "Resume session"
  above the filter (Exit / refresh / browser-back). Fulfills the spec's promise ("resume from the
  same task"). The lo-fi keeps the current task as `pending` — the `active` state is deliberately **unused**
  in the proto (maintaining consistency with the `attributed` filter).
- **#3 Undo Dismiss na summary** — toast undo przeniesiony z `FocusTaskScreen` na poziom
  `FocusView`, so it survives the jump to the summary on dismissing the last task (ADR 0017).
- **#4 Rozdzielenie empty-state** — „nic nie opisano" vs „wszystko zrobione — brawo" + CTA
  do `process`.
- **#5 Mid-session reconciliation** — a task resolved in another tab (storage event) isn't
  shown as current; `firstPendingFrom` advances to the next `pending` (or ends the session).
- **#9 Back nie un-dismissuje** — Back otwiera na nowo tylko `completed`/`skipped`; `dismissed`
  leaves it (un-dismissing is a separate undo path).
- **#10 Read failure** — `ReadErrorState` (a clear message + Refresh) instead of a misleading
  empty-state listy przy `readError`.

Split out presentational components for the auxiliary states (`DismissUndoToast`,
`SessionResumeBanner`, `ReadErrorState` in `FocusStates.tsx`), so each state has its own story.

### Odroczone
- **#6 Keyboard shortcuts** (Done/Skip/Dismiss/Back/Pause) — a new input modality, not handling
  an error path (outside harden's scope = "don't add features"). For a separate feature/polish pass.

### Uwagi modelowe
- **No new domain** — `dismissed`/`Dismiss` are already in the model (ADR 0017). `SessionSnapshot` is
  artefakt persystencji UI (nie encja domenowa) — NIE trafia do `ENTITY_MAP`/`ACTIONS`.
- **`focus:session` best-effort** — awaria zapisu snapshotu celowo **nie** agregowana w
  `StorageStatusToast` (losing a bookmark ≠ losing data; a false "not saved" on a successful
  Task-state write would be misleading). Critical writes (`Task` states) are honestly gated.

## Impact
The `focus` prototype now handles every path on par with the happy path — write/read failures, empty
states, mid-session changes, dead navigation points. The happy path is preserved (handlers gate only
on failure; `activeCursor === cursor` in normal flow). Visual polish is a separate
future `proto-design`. After the changes — re-run `proto-edgecases` for a fresh baseline.
