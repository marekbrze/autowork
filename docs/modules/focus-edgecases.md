# Focus — Edge Cases

## Coverage
- **Spec already captured** (`docs/modules/focus.md` → Edge Cases): 0 matches in the filter · early exit (active+resume) · overtime · single-task session · undo Dismiss · missing motivation · Back on the first task.
- **Already handled in code**:
  - 0 matches → `SessionFilter.tsx:60-61, 115-116` ("Start" disabled + info)
  - overtime → `FocusTimer.tsx` (czerwono po progu oszacowania)
  - sesja 1-zadaniowa → `FocusView.tsx:104-110` (`advance` → summary na ostatnim)
  - undo Dismiss → `FocusView.tsx:127-144` (+ toast `FocusTaskScreen.tsx:175-188`) — with a caveat: gap #3
  - missing motivation → `MotivationPanel.tsx` (empty state)
  - Back na pierwszym → `FocusTaskScreen.tsx:89` (`disabled={!canGoBack}`)
  - current task disappearing (deleted from another tab) → `FocusView.tsx:266-275` (safeguard)
- **Spec case NOT handled**: "early exit → task stays `active` + resume" — the lo-fi defers the task as `pending` and abandons the session (see #2).
- **New gaps found**: 10
- **By severity**: 🔴 1 · 🟡 4 · 🟢 5

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🔴 | Prototype-specific (persistence) | Storage write fails (quota/disabled) mid-action | `updateTask`/`deleteTask` return a boolean (honest persistence), but handlers **ignore the result** — `done/skip/dismiss` call `advance()` regardless, and the next action overwrites `pendingRef` in `useLocalStorage`. The UI moves on (Done→next), but the state wasn't saved → after reload the task returns as `pending`. A classic silent data loss. | Like `ProcessView.tsx:185-199` (`if (!ok) return;`): on a failed write **don't advance / don't change screen** — stay on the task, let `StorageStatusToast` (already visible) handle retry. Also applies to the timer's `persistElapsed`. | `FocusView.tsx:113-203` (`done/skip/dismiss/back/undoDismiss/clearCompleted/returnSkippedToPool`), `:79-81` (`persistElapsed`) |
| 2 | 🟡 | Navigation & flow | The session isn't persisted — Exit / refresh / browser-back abandon the current session | Session state (`screen/queue/cursor/running`) is ephemeral (`FocusView.tsx:37-43`). Exit defers the current task as `pending` and resets all skipped (`:167-172`). Refresh/back → return to the filter, session position lost; up to 5 s of timer may be unpersisted (flush every ~5 s). The `active` state is never set. | Persist a session snapshot (screen/queue/cursor/activeId) to localStorage and resume on entering `/focus` — or align the spec to the lo-fi (Exit = abandonment). Fulfills the "resume from the same task" promise. | `FocusView.tsx:37-43`, `:167-172`; spec `focus.md:42-43, 67` |
| 3 | 🟡 | Action outcomes / state | Dismiss the last task → undo unavailable | Dismiss on the last task: `advance(true)` jumps straight to summary (`:127-133`), and the undo toast lives only in `FocusTaskScreen` (`:175-188`), which unmounts → undo is lost. Undo also only handles the most recent Dismiss. | Show the Dismiss undo on the summary screen too (until "Remove finished" is clicked), or keep the toast at the `FocusView` level. | `FocusView.tsx:127-133`; `FocusTaskScreen.tsx:175-188` |
| 4 | 🟡 | Data states | Empty "attributes" even though tasks exist — misleading message | When tasks exist but none are `pending`+attributed (all done/skipped/dismissed), `attributed.length === 0` → the "No tasks described with attributes" message (`SessionFilter.tsx:72-78`) is misleading (they are described, just resolved). | Distinguish "no attributed at all" from "all resolved" — e.g. "All tasks done — well done." + a CTA to the dashboard/processing. | `SessionFilter.tsx:72-78`; `FocusView.tsx:49-59` (`attributed`) |
| 5 | 🟡 | Cross-module / lifecycle | A task's state change from another tab mid-session isn't reconciled | `currentTask` is looked up by `id` without state validation (`:69`). A task resolved (completed/dismissed) in another tab can still be shown as current in the session. (The *deletion* case is handled by the `:266` safeguard; a *state* change is not.) | On landing on a task, check its state; if already resolved — advance to the next pending in the queue. | `FocusView.tsx:69` (no state validation); `:266` (safeguard only for deletion) |
| 6 | 🟢 | Loading & async / a11y | No keyboard shortcuts on the task screen | The Done/Skip/Dismiss/Back/Pause actions are buttons only — no keyboard handler, whereas `ProcessView` is keyboard-first (Enter/Esc/arrows). | Add shortcuts (e.g. Enter/D = Done, S = Skip, X = Dismiss, ← = Back, Space = Pause) with `aria-keyshortcuts`, not capturing when a button is focused. | `FocusTaskScreen.tsx:160-170` (no global keydown) |
| 7 | 🟢 | Data states | Truncated task text in the summary with no tooltip | The done list truncates text (`truncate`) without `title` → long names unreadable. | Add `title={t.text}` (like the breadcrumb in `FocusTaskScreen.tsx:114`). | `SessionSummary.tsx:60` |
| 8 | 🟢 | Data states | "Session finished" + ✓ on a session with 0 done | The celebration header always renders, even when everything was skipped (0 done, 0 dismissed) — a misleading tone. | Tone down / generate a different header when nothing was done (e.g. "None of it right now — OK"). | `SessionSummary.tsx:34-50` |
| 9 | 🟢 | State transitions | Back silently re-adds (un-dismisses) a previously rejected task | `back()` sets the previous task to `pending` regardless of state (`:152`) — a Dismissed task can be returned to the pool without using undo, bypassing the affordance. | On Back, distinguish: reopen only completed/skipped; for dismissed leave a warning or use the same undo path. | `FocusView.tsx:146-156` |
| 10 | 🟢 | Errors | Misleading empty-state on a storage READ error | On `readError` the hook falls back to `[]` → `attributed` empty → "No tasks described with attributes", even though it's a read failure, not missing data (a `readError` toast shows alongside). | When `readError` — show an error state instead of the list empty state. | `SessionFilter.tsx:72-78`; `FocusView.tsx:208-213` |

*Also noted (outside the table): a long task name on the task screen wraps across multiple lines (`FocusTaskScreen.tsx:124`, `break-words`) — consider `line-clamp`/scroll; `pluralZadanie` is duplicated in `SessionFilter`/`SessionSummary` (DRY, outside the edge-case scope).*

## Priority list
1. **🔴 #1 — Honest persistence**: handlers ignore the result of `updateTask`/`deleteTask`; on a write failure the UI moves on, and the next action overwrites `pendingRef` → silent loss. Highest impact, lowest fix risk (copy the `if (!ok) return` pattern from `ProcessView`).
2. **🟡 #2 — No session persistence**: Exit/refresh/back lose the session position; the spec promises resume. The most common path to losing work mid-focus.
3. **🟡 #3 — Undo Dismiss unreachable for the last task**: ADR 0017 promises undo, but dismissing the last one jumps to summary and the toast is lost.
4. **🟡 #4 — Misleading empty-state**: "No attributes" also shows when everything is done — frustrating at the end of the funnel.
5. **🟡 #5 — Mid-session state reconciliation**: a task resolved in another tab can pop up as current.

## Hardening status (proto-harden, 2026-06-29)

| # | Status | Gdzie teraz |
|---|--------|-------------|
| 1 | ✅ | `FocusView.tsx:192-240` (`done`/`skip`/`dismiss`/`back`/`undoDismiss` — `if (!updateTask) return`), `:279-296` (`clearCompleted` — abort the `deleteTask` loop on failure) |
| 2 | ✅ | `FocusView.tsx:56-57` (snapshot `focus:session`), `:130-145` (sync + walidacja), `:171-178` (`resumeSession`); `types/focus.ts` (`SessionSnapshot`); `FocusStates.tsx` (`SessionResumeBanner`) |
| 3 | ✅ | `FocusView.tsx:215-225` (`undoDismiss` wraca do sesji), `:417-418` (`DismissUndoToast` na poziomie `FocusView`); `FocusStates.tsx` (`DismissUndoToast`) |
| 4 | ✅ | `SessionFilter.tsx` (`resolvedAttributed` + stan „Wszystko zrobione — brawo" + CTA `/process`); `FocusView.tsx:77-80` |
| 5 | ✅ | `FocusView.tsx:96-126` (`firstPendingFrom` + reconcile effect: task resolved in another tab → advance / end) |
| 6 | ❌ | Deferred — keyboard shortcuts (Done/Skip/Dismiss/Back/Pause). That's a new input modality, not handling an error path (outside harden's scope = "don't add features"). For a separate feature/polish pass. |
| 7 | ✅ | Already present in code — `SessionSummary.tsx:66` (`title={t.text}` on the truncated element) |
| 8 | ✅ | Already present in code — `SessionSummary.tsx:40-54` (icon/title/text differentiated at 0 done) |
| 9 | ✅ | `FocusView.tsx:227-240` (`back` only reopens `completed`/`skipped`; `dismissed` is left alone — undo is a separate path) |
| 10 | ✅ | `FocusView.tsx:328-330` (render `ReadErrorState` zamiast listy przy `readError`); `FocusStates.tsx` (`ReadErrorState`) |

**Closed: 9 · Deferred: 1 (#6, for a reason).** Design decision (#2): **session resume** (snapshot persistence + an opt-in banner on the filter).

## Hand-off to proto-harden
Highest priority to implement in `proto-harden`:
- **#1 (persistence)** — mandatory first: check the write result in every handler and don't advance on failure; keep the `StorageStatusToast` with retry.
- **#2 (session resume)** — session snapshot persistence + resume (fulfills the Exit→resume promise).
- **#3 (undo Dismiss on summary)** — move the undo toast to the `FocusView` level so it survives to summary.
- **#4 (split empty-state)** — distinguish "no attributed" vs "all resolved".

The rest (🟢) are polish — to optionally implement alongside the above or separately.

> ✅ Done in `proto-harden` (see the table above). The biggest fragility removed: **#1** — action handlers called `advance()` regardless of the write result, so on full/disabled LocalStorage the UI moved on (Done→next), but the state wasn't saved → after reload the task returned as `pending` (silent loss).

---

## Re-audit: session-queue-order feature (proto-edgecases, 2026-07-01)

**Scope**: the new surfaces of the ADR 0035 feature in `focus` — the matched list (`SessionTaskList`) + manual `TaskOrder` (+ interaction with resume/queue). Pre-feature surfaces are handled above and in harden — not duplicated.

### Coverage (feature)
- **Spec already captured** (`focus.md` §Edge Cases, added in proto-detail): single-element list · tasks added after `TaskOrder` (appended at the end by default) · `TaskOrder` points to deleted tasks (prune) · `TaskOrder` points to tasks outside the filter (positions preserved) · `TaskOrder` write failure (toast) · reset (confirm/undo → harden).
- **Already handled in code**:
  - taski dodane po `TaskOrder` → doklejane wg defaultu (`FocusView.tsx` `orderKey` = MAX dla nieobecnych w `TaskOrder`).
  - `TaskOrder` write failure → toast (`FocusView.tsx` `storageView` includes `taskOrderStorage`).
  - reset clears `TaskOrder` (`removeTaskOrder`); "Reset to default" is visible only when a manual order is active.
  - tasks outside the current filter → invisible in the list, positions in `TaskOrder` preserved (`reorderMatched`).
- **Nowe luki**: 7 · 🔴 0 · 🟡 2 · 🟢 5.

### Inventory (feature)

| # | Sev | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|-----|----------|-----------|----------------|--------------------|-------|
| F2-1 | 🟡 | Action outcomes | "Reset to default" with no confirm/undo | One click permanently clears `TaskOrder` (`removeTaskOrder`); loss of the manual order with no way back | A `ConfirmDialog` or undo-toast (the `ClearCompleted` pattern) | `FocusView.tsx` (`resetOrder`), `SessionFilter.tsx` (Reset button) |
| F2-2 | 🟡 | Navigation/state | Resume ignores live `TaskOrder` | `resumeSession` restores `snapshot.queue` (frozen at Start); reordering the filter AFTER pausing doesn't affect the resumed session | Document (resume = continue as it was) OR rebuild the queue from the current `TaskOrder` on resume | `FocusView.tsx` (`resumeSession`) |
| F2-3 | 🟢 | Data/a11y | Drag doesn't work on touch | HTML5 DnD doesn't support touch; the handle looks draggable, but on mobile only ↑↓ work | Hide/disable the handle on touch (or a "drag on desktop" note); ↑↓ cover mobile | `SessionTaskList.tsx` (GripVertical handle) |
| F2-4 | 🟢 | Data states | Single-element list: dead controls | n=1: ↑↓ disabled, drag = no-op; the handle/DnD hang pointlessly | Hide the reorder controls when n===1 | `SessionTaskList.tsx` |
| F2-5 | 🟢 | Data states | Stale/deleted IDs accumulate in `focus:taskOrder` | Deleted task IDs stay in `TaskOrder` (harmless — they fall out of `attributed`; pruned only on reorder) | Prune nonexistent IDs on read/write | `FocusView.tsx` (`matchedTasks`/`reorderMatched`) |
| F2-6 | 🟢 | Loading/a11y | No SR announcement after reordering | ↑↓/drag moves a row with no message for screen readers | An `aria-live` region announcing "moved to position N of M" | `SessionTaskList.tsx` |
| F2-7 | 🟢 | Data states | A long matched list buries "Start" | Many matches → a tall `<ol>` pushes "Start" down; no max-height/scroll | Cap the height + scroll (or collapsible) | `SessionFilter.tsx` (list block) |

*Known cross-module (ADR 0020): `TaskOrder` is global — reordering in one Run affects all. Documented in `focus.md`/`run.md`.*

### Priority (feature)
1. **F2-1** — reset with no undo (lost order; easy confirm/undo fix).
2. **F2-2** — resume vs live `TaskOrder` (design decision: document vs rebuild on resume).
3. (🟢 polish: F2-3…F2-7).

### Hand-off
- **F2-1** → `proto-harden` (confirm/undo dla reset).
- **F2-2** → decyzja designu w `proto-harden` (dokument vs rebuild-on-resume).
- **F2-3…F2-7** → `proto-polish` / osobny pass.

### Resolution (proto-harden, 2026-07-01)

| # | Status | Gdzie teraz |
|---|--------|-------------|
| F2-1 | ✅ | `FocusView.tsx` (`resetOrder` → `setConfirmReset`; `doResetOrder`) + `ConfirmDialog` „Reset task order?" |
| F2-2 | ❌ Deferred — a design decision outside harden: it changes happy-path resume (snapshot queue vs live `TaskOrder`). To resolve separately (document vs rebuild-on-resume). |
| F2-3 | ❌ Odroczone — polish (DnD na touch). |
| F2-4 | ❌ Odroczone — polish (kontrolki reorder przy n=1). |
| F2-5 | ❌ Deferred — polish (prune nonexistent IDs; harmless). |
| F2-6 | ❌ Odroczone — polish (`aria-live` po reorder). |
| F2-7 | ❌ Deferred — polish (long list / scroll). |

**Closed: 1 (F2-1) · Deferred: 6 (F2-2 = design decision + 5 polish).**

---

## Re-audit: timer background keep-alive + tab title feature (proto-edgecases, 2026-07-02)

**Scope**: the new behaviors from ADR 0053/0054 in `focus` — a **timestamp-based** timer (always correct on return from the background/a sleeping tab), ticking via a **Web Worker** (`setInterval` fallback), a **Wake Lock** keeping the screen alive, resync on `visibilitychange`, and **timer time in `document.title`**. Pre-feature surfaces were audited and hardened above — not duplicated.

### Coverage (feature)
- **Spec already captured** (`focus.md` §Edge Cases, added in proto-detail ADR 0054): "Background tab / sleeping tab (Edge Sleeping Tabs)" + addenda to the existing "Early exit…" and "Mid-session state change".
- **Already handled in code**:
  - timer correct on return from a sleeping tab → timestamp + resync `use-focus-timer.ts:178-188`.
  - pauza w tle / resume w tle → `resumedAtRef` null gdy pauza, `onTick`/visibility early-return `use-focus-timer.ts:79-80, 180-181`.
  - brak Workera / brak Wake Lock → cicha degradacja (fallback / skip) `use-focus-timer.ts:101-104, 128`.
  - title returns to the baseline outside a session / in summary / on unmount → `use-focus-tab-title.ts:28-30, 34-36`.
  - flush on Done/Skip/Dismiss/Exit (also from pause — `compute()` returns the frozen `baseRef`) → `use-focus-timer.ts:196-201`, `FocusView.tsx:281,289,296,341`.
- **Nowe luki**: 6 · 🔴 0 · 🟡 1 · 🟢 5.

### Inventory (feature)

| # | Sev | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|-----|----------|-----------|----------------|--------------------|-------|
| FT-1 | 🟡 | State transitions / cross-tab | Timer reset keyed on the **value** of `initialElapsed`, not on the task's identity | The reset effect is based on `[initialElapsed]` (`:143-150`). `initialElapsed = currentTask?.timerElapsed ?? 0` (`FocusView.tsx:217`) changes every ~5 s — each `timerElapsed` flush updates the task → `currentTask.timerElapsed` → `initialElapsed` → the effect fires. In **single-tab** the value is preserved (flush always on whole-second boundaries → reset is a no-op), but in **multi-tab of the same session** a flush from tab A writes `timerElapsed` to shared storage → tab B gets a `storage` event → its `initialElapsed` jumps → the timer in B **goes back** to A's value. | Add a `taskKey` parameter (task id); reset `baseRef`/`resumedAtRef`/`lastFlushRef` **only** when `taskKey` changes, reading `initialElapsed` at that moment. Also eliminates self-broadcast. | `use-focus-timer.ts:143-150`; passing `taskKey` in `FocusView.tsx:216-220` |
| FT-2 | 🟢 | Data states | System clock change (NTP / user) while the tab is hidden | `compute()` calculates `Date.now() - resumedAtRef`; moving the clock back gives a negative delta → the timer could count down below `baseRef`. | Clamp `Math.max(baseRef.current, …)` in `compute()` (or `performance.now()` — but `Date.now()` is intentional because it survives tab sleep). | `use-focus-timer.ts:57-59` |
| FT-3 | 🟢 | Errors / loading | Worker 404 in prod (base path `/autowork/`) | `onerror` → fallback `setInterval` (covered), but unverified on GitHub Pages after deploy. | Verify manually after `proto-deploy` (that `timer-tick.worker-*.js` loads from `/autowork/assets/`). | `use-focus-timer.ts:101-104` |
| FT-4 | 🟢 | Prototype-specific | Timer persist ignores the write result | `persistElapsed` calls `updateTask` and ignores the boolean — on full/disabled LocalStorage `timerElapsed` isn't persisted (the session counts correctly in memory, but after reload the last flush returns). | Intentional — `timerElapsed` is best-effort (unlike Done/Skip states, which gate the write). `StorageStatusToast` shows `writeError` anyway. Documented, not a gap to fix. | `FocusView.tsx:213-215` |
| FT-5 | 🟢 | Cross-module / lifecycle | Two tabs of the same Run resume the same session | The `focus:session` snapshot + `timerElapsed` are per-Run (ADR 0044); two tabs on `/focus` can resume the same queue → they fight over the snapshot and (FT-1) `timerElapsed`. | Mostly mitigated by FT-1 (`taskKey`). Full per-tab isolation (session lock) is out of scope — a documented limitation of shared storage. | `FocusView.tsx:81` (snapshot), `use-focus-timer.ts:143-150` |
| FT-6 | 🟢 | (non-gap, logged) | No in-app keep-alive / Wake Lock status indicator | Invisible by design. | Per the feature plan (ADR 0053 "Later") — any affordance is a new surface (`design`+`polish`), not handling an error path. Logged so it's not re-flagged. | — |

*Clean categories (checked, no gaps in this feature): Forms & input (no forms) · Navigation/dead-ends (title restore handled, `use-focus-tab-title.ts:28-30, 34-36`) · Errors (no `alert()`; Worker/Wake Lock failure degrades silently) · Accessibility (title change not announced — consistent with the on-screen timer's `aria-live="off"`).*

### Priority (feature)
1. **FT-1 — `taskKey` reset**: the only real robustness gap. Mild in single-tab (no-op), a real timer rollback in multi-tab of the same session. A small API change + call site in `FocusView`.
2. (🟢 FT-2 one-line clamp · FT-3 verify after deploy · FT-4/FT-5 documented limitations · FT-6 deferred by design.)

### Hand-off
- **FT-1** → drobny fix logiczny (residual direct-edit lub `proto-harden`): `taskKey` parametr + reset tylko przy zmianie taska.
- **FT-2** → one-line clamp in `compute()` (to implement alongside FT-1).
- **FT-3** → manual verification after `proto-deploy`.
- **FT-4 / FT-5** → documented limitations (best-effort persistence / shared per-Run storage) — no action.
- **FT-6** → odroczone (plan ADR 0053 „Later").

> **Note:** this feature **introduces no new UI states** (empty/error/loading) — fallbacks degrade silently. `proto-harden` has no classic work here; the real change is FT-1/FT-2 (logic), so it's more a residual direct-edit than a full harden. Re-run `proto-edgecases` after implementing FT-1 to refresh the baseline.

### Resolution (direct edit, 2026-07-02)

| # | Status | Gdzie teraz |
|---|--------|-------------|
| FT-1 | ✅ | `use-focus-timer.ts` — new `taskKey` parameter; reset keyed on `[taskKey]` (task id) instead of `[initialElapsed]`, `initialElapsed` read from the closure; passing `taskKey: currentTask?.id ?? null` in `FocusView.tsx`. Eliminates self-broadcast and cross-tab timer rollback. |
| FT-2 | ✅ | `use-focus-timer.ts` `compute()` — `Math.max(baseRef.current, next)` (lower clamp on clock rollback). |
| FT-3 | ⏳ To verify | manually after `proto-deploy` (that `timer-tick.worker-*.js` loads from `/autowork/assets/`). |
| FT-4 | ❌ Odroczone | intencjonalne — `timerElapsed` best-effort (toast i tak pokazuje `writeError`). |
| FT-5 | ❌ Deferred | limitation of shared per-Run storage; mitigated by FT-1. |
| FT-6 | ❌ Odroczone | affordance keep-alive = nowa powierzchnia (plan ADR 0053 „Later"). |

**Closed: 2 (FT-1, FT-2) · Deferred: 3 (FT-4/FT-5/FT-6) · To verify: 1 (FT-3).** Verification: `tsc` + `vite build` + `eslint` green.
