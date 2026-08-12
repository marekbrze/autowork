# Run — Edge Cases

## Coverage
- **Spec already captured** (`run.md` → Edge Cases): empty Run → brain dump · attributeless task ready (ADR 0013) · 100%-completed Run with no auto-archive · resume of a paused session · multiple active runs.
- **Already handled in code**:
  - Empty states on 3 screens — `RunsList.tsx:54`, `ArchivedRuns.tsx:38`, `ReviewRun.tsx:45`.
  - (Terminal) delete confirmation — `RunDetails.tsx:182`, `ArchivedRuns.tsx:78` (`ConfirmDialog`).
  - Persistence status (write/read-error toast + retry) on 4 screens — e.g. `RunsList.tsx:97`; the hook reports it `use-runs.ts:142`.
  - "Run not found" state — `RunDetails.tsx:43`, `ReviewRun.tsx:17`.
  - "Completed" badge (derived from progress, no auto-archive) — `RunDetails.tsx:201` (`isRunCompleted`).
  - Navigation gating on write failure for create/delete — `use-runs.ts:37`, `RunDetails.tsx:63`.
- **New gaps found**: 16.
- **By severity**: 🔴 0 · 🟡 9 · 🟢 7.
- **After `proto-harden`**: ✅ 6 implemented · ❌ 10 deferred (for good reason). Details in the *Resolution* section at the bottom.

> No 🔴 — the lo-fi covered the basics (empty states, confirmations, persistence toast). The biggest gaps: **the Run is disconnected from real funnel data in the prototype** (CM-1/2/3), plus **no rename-form validation/feedback** and a misleading empty-state on a storage read error.

## Inventory

| # | Sev | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|-----|----------|-----------|----------------|--------------------|-------|
| CM-1 | 🟡 | Cross-module | Run stats never reflect real progress | `stats` is a mock stored on the object; completing tasks / a focus session **don't update** time/done/progress — the "visible object with stats" lies | Real derivation from funnel data (sum of `timerElapsed`, `completed+dismissed`, total), OR explicitly mark the stats as illustrative. Scope decision: architectural (cross-module) | `use-runs.ts:31` (static stats); no integration with `capture`/`focus` |
| CM-2 | 🟡 | Cross-module | `lastReachedStep` never advances | `createRun` sets `brain-dump`, scenarios seed the value, but nothing bumps it per progress → the Continue route is **stale** past the real funnel progress | A `setLastReachedStep` hook called from the funnel steps (capture→…→focus) when the user reaches a step; without it resume always lands in the same place | `use-runs.ts` (no setter); usage `RunsList.tsx:38`, `RunDetails.tsx:141` |
| CM-3 | 🟡 | Cross-module | Review can't be populated from the UI | `reviewItems` come only from the scenario (`addReviewItem` unused in components) → in `empty`/`minimal` Review is always empty; the flow isn't testable end-to-end | A source of review items from funnel data (e.g. tasks/stressors modified long ago), or an Add-item in the UI for manual entry | `use-runs.ts:116` (`addReviewItem` unused); `ReviewRun.tsx` |
| LE-1 | 🟡 | Prototype-specific | Corrupted `run:runs` (bad JSON) / read error | Shows a misleading "You have no active Runs" empty-state + a `readError` toast; no error state (focus has `ReadErrorState`) and no real recovery (`retry` doesn't re-read) | A separate read-error state (like `ReadErrorState` in `focus`) instead of the empty-state; "reload" as the only path | `use-runs.ts:18` (initialValue `[]`); `RunsList.tsx:54` |
| FI-1 | 🟡 | Forms | Rename to empty / whitespace-only | Silently keeps the old name (`trimmed \|\| r.name`), closes the edit, with no message — the user thinks nothing happened | Inline validation: "Save" button disabled on an empty draft + a "name can't be empty" message, or a placeholder/keep-open with a toast | `use-runs.ts:45-48`; `RunDetails.tsx:58-60` |
| ST-1 | 🟡 | State transitions | A completed (100%) Run sits in active with no celebration/nudge | The list filter treats completed like active; Details shows only a badge, with no celebration moment or archive suggestion (the spec mentions celebration) | On a completed Run's Details: a celebration state / "Archive this run" CTA; optionally a "completed" section on the list with a nudge | `RunsList.tsx:25` (filter); `RunDetails.tsx:201` (badge only) |
| AO-2 | 🟡 | Action outcomes | "Remove stale" — bulk with no confirmation or undo | One click permanently removes all flagged items; no `ConfirmDialog` and no undo | Confirmation (like ClearCompleted in focus) or an undo-toast that restores | `ReviewRun.tsx:99-105` |
| FI-2 | 🟡 | Forms | Unsaved rename lost on navigation | Editing the name + clicking "← My Runs" / Continue / another link discards the draft without asking | A "discard changes?" prompt (or navigation block) when draft ≠ name and edit mode is active | `RunDetails.tsx` `editing` mode (no guard) |
| AO-1 | 🟡 | Action outcomes | No success feedback for archive/unarchive/rename | Only an implicit state change (the button flips); no "moved to archive" toast / path to the archive after archiving | A confirmation toast + (after archiving) a "See in archive" link | `RunDetails.tsx:155-163` |
| AO-3 | 🟢 | Action outcomes | Negated mutations rely on the toast alone | archive/unarchive/setStale/clearStale don't check the result; the confirm in ArchivedRuns closes even on a write failure | Consistent honest-persistence (gating like `FocusView`); close the confirm only after a successful write | `ArchivedRuns.tsx:83-86`; `use-runs.ts:55-71` |
| DS-1 | 🟢 | Data states | A very long list of runs | All active/archived stack up in a `<ul>`; no grouping (date), search, or pagination | Group by date / filter by name; low priority (personal tool, few runs) | `RunsList.tsx:64`, `ArchivedRuns.tsx:43` |
| DS-2 | 🟢 | Data states | A very long Run name | The rename input has no `maxLength`; in the card/detail the name wraps (OK), but there's no truncation in a narrow card | `maxLength` on the input + `truncate` in the `RunCard` title | `RunDetails.tsx:87`; `RunCard.tsx:28` |
| DS-3 | 🟢 | Data states | Empty stats on a fresh Run (`0 / 0`, `0%`) | The tiles show "0 / 0" and "0%" — cold, doesn't suggest an action | For `totalTasks === 0`: "—" / "start the first step" instead of "0 / 0" | `RunStatTiles.tsx:21-25` |
| DS-4 | 🟢 | Data states | Duplicate names allowed | No uniqueness; default name = timestamp → collision when creating in the same minute; rename to an existing name is OK | Acceptable (the name isn't an identifier), optionally append "(2)" on a default collision | `use-runs.ts:14,28,48` |
| LE-2 | 🟢 | Data states | Dates without relative time | `toLocaleDateString` → date only; "last active: today" doesn't stand out from earlier days in a quick scan | Relative time ("today", "2 days ago") for `lastActiveAt` | `RunDetails.tsx:169-172` |
| NF-1 | 🟢 | Navigation | ReviewRun "not found" links to `/run` | The back link goes to the list, not this Run's Details | "← Run Details" when context exists (here it's not found anyway — low priority) | `ReviewRun.tsx:21` |

### Categories checked with no gaps
- **State machine (transitions)**: only `in_progress ↔ archived`, both reachable; the UI prevents redundancy (Details shows Archive *or* Un-archive). No invalid transitions.
- **Loading & async (initial load)**: `useLocalStorage` reads synchronously on first render — no async, no blank screen, no skeleton needed.
- **Offline**: pure client-side, no network requests — works offline.
- **Roles / permissions**: single-user, n/a.
- **`alert()` / `window.alert`**: none in production code (`window.confirm` only in the dev `DevToolbar`).

## Priority list
1. **CM-1 — stats lie**: the Run as a "visible object with stats" (ADR 0020) is the module's core, yet in the prototype the numbers never move. Highest impact, but **architectural** — needs a scope decision (derivation vs. illustrative).
2. **CM-2 — `lastReachedStep` stale**: without it Continue (resume) always leads to the same place; undermines the ADR 0022 routing. Architectural (shared with CM-1).
3. **LE-1 — misleading empty-state on a read error**: a local fix, big readability effect (the paradigm from `focus`/`ReadErrorState`).
4. **FI-1 — rename empty = silent no-op**: local validation, easy.
5. **ST-1 — completed Runs without celebration/nudge**: a gap in the "moment of celebration" promise (spec).
6. **CM-3 — Review not testable end-to-end**: a shared cause with CM-1/2 (no data source).
7. **AO-2 — bulk-remove stale without confirmation/undo**.
8. **FI-2 — guard unsaved rename on navigation**.
9. **AO-1 — success feedback for archive/unarchive/rename**.
10. (🟢 polish: DS-1…DS-4, LE-2, NF-1, AO-3).

## Hand-off to proto-harden
Top-priority gaps to implement in `proto-harden`:
- **CM-1 / CM-2 / CM-3** — these three share a cause (the Run disconnected from funnel data). Harden should start with a **scope decision with the designer**: (a) wire real stats derivation + advance `lastReachedStep` + a review-items source (large, cross-module), or (b) leave them illustrative + mark it clearly (e.g. an "overview data" badge) and focus harden on local gaps. Without this decision, local fixes risk the stats still misleading.
- **LE-1** — a storage read-error state (port the `ReadErrorState` pattern from `focus`).
- **FI-1 / FI-2** — rename validation + unsaved-changes guard.
- **ST-1** — celebration / archive nudge for completed Runs.
- **AO-2** — confirmation/undo for "Remove stale".

Each row points at the `file:line` where the gap lives — `proto-harden` (or the designer) can act immediately. "Suggested behavior" is a starting point, not the final decision; `proto-harden` confirms or overrides each with the designer.

## Resolution (`proto-harden`)

### ✅ Implemented (6)
- **LE-1** — a storage read-error state instead of a misleading empty-state. `RunStates.tsx:RunReadError`; inserted in `RunsList.tsx:55` and `ArchivedRuns.tsx:39` (when `storage.readError`). Stories: `Run/RunStates → ReadError`, `Run/RunsList → ReadError`, `Run/ArchivedRuns → ReadError`.
- **FI-1** — rename validation: "Save" disabled on an empty name, `aria-invalid` + `aria-describedby` + an inline message. `RunDetails.tsx` (`nameValid`, form). `maxLength={60}` (DS-2).
- **ST-1** — a completed Run (`isRunCompleted && !archived`) → a celebration section + an "Archive this run" CTA instead of "Continue". `RunStates.tsx:RunCompleted`; `RunDetails.tsx` (resume section). Story: `Run/RunDetails → Completed`.
- **AO-2** — a `ConfirmDialog` on "Remove stale" in Review. `ReviewRun.tsx` (`confirmClear`).
- **AO-3** — honest persistence: the delete dialog in ArchivedRuns closes only after a successful write. `ArchivedRuns.tsx` (`onConfirm`).
- **DS-2** — `maxLength` on rename + card title `truncate` with `title` (hover). `RunDetails.tsx`, `RunCard.tsx:24`.

### ❌ Deferred (10) — for good reason
- **CM-1 / CM-2 / CM-3** — **cross-module feature** (stats / `lastReachedStep` / review-items wired to real funnel data requires `runId` on stressors/tasks + data partitioning across all funnel steps + scenarios). Outside harden's scope (design decision: mark as overview + defer). Honesty affordance: a discreet "Overview stats…" caption on `RunStatTiles.tsx`. Real wiring in the Run-integration phase (the `dashboard` module).
- **FI-2** — guard unsaved rename on navigation: rename is non-destructive and instantly repeatable; a full navigation blocker (react-router) is disproportionate to the risk.
- **AO-1** — success feedback for archive/unarchive/rename: the implicit state change (button flip / badge / closing the edit) is enough for reversible/local actions; success toasts = polish for `proto-design`.
- **DS-1** — long run lists (grouping/search): polish, low need (personal tool, few runs).
- **DS-3** — a fresh Run shows "0 / 0", "0%": correct, sufficient; polish.
- **DS-4** — duplicate names: the name ≠ the identifier; not a real problem.
- **LE-2** — relative dates ("today", "2 days ago"): polish.
- **NF-1** — "not found" link in ReviewRun → `/run`: correct (the run doesn't exist → the list is the right target).

> CM-1/2/3 are the only structural gaps — the rest of the deferred items are consciously accepted polish/scope compromises, not bugs found later.

---

## Re-audit: run-task-list feature (proto-edgecases, 2026-07-01)

**Scope**: the new surfaces of the ADR 0035 feature in `run` — the "Tasks" section (`RunTaskList`) + list actions (Done / Not relevant) + cross-module task mutation. Pre-feature surfaces are handled above and in harden — not duplicated.

### Coverage (feature)
- **Spec already captured** (`run.md` §Edge Cases, added in proto-detail): empty "Tasks" section · attributeless task ("untagged") · done-on-done (no-op) · action impact on resume routing · dismiss from the list (confirm/undo → harden) · mutation failure (toast).
- **Already handled in code**:
  - empty list → "No tasks yet — start with a brain dump." (`RunTaskList.tsx`).
  - attributeless task → "untagged" badge (`RunTaskList.tsx`).
  - done/dismiss from the list → the task migrates to the right group live (`updateTask`, instance A).
  - mutation write failure → `taskStorage` wired into `StorageStatusToast` (`RunDetails.tsx`).
- **New gaps**: 6 · 🔴 1 · 🟡 3 · 🟢 2.

### Inventory (feature)

| # | Sev | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|-----|----------|-----------|----------------|--------------------|-------|
| R2-1 | 🔴 | Cross-module/state | Stats + Continue DON'T refresh after list actions | `RunDetails` has **two `useTasks()` instances**: its own (mutations) and one inside `useLiveRuns` (stats). `useLocalStorage` doesn't sync instances in the same tab (the `storage` event = cross-tab only) → after `markDone`/`markNotRelevant` `RunTaskList` refreshes (instance A), but `RunStatTiles`/Continue read instance B (stale) until refresh. Breaks the "live stats" promise (ADR 0035) | Expose `updateTask`/`deleteTask`/`storage` from `useLiveRuns` (it already calls `useTasks`) and use a single instance in `RunDetails` → stats recompute live; OR add same-tab sync to `useLocalStorage` | `use-live-runs.ts:26` (only `tasks` destructured), `RunDetails.tsx` (own `useTasks()`) |
| R2-2 | 🟡 | Action outcomes | Dismiss from the list with no undo and no confirm | `markNotRelevant` immediately → `dismissed`, with no way back from the list (no reopen) and no undo — inconsistent with ADR 0017 (Dismiss has undo) and focus (`DismissUndoToast`) | An undo-toast (like focus) or a `ConfirmDialog` | `RunDetails.tsx` (`markNotRelevant`), `RunTaskList.tsx` |
| R2-3 | 🟡 | State transitions | List actions active on an archived Run | `RunDetails` of an archived Run still shows the list with active Done/Not-relevant; mutating tasks in a "completed" Run touches global data | Gate/disable list actions when `run.state === 'archived'` (or warn) | `RunDetails.tsx` (Tasks section without an `archived` check), `RunTaskList.tsx` |
| R2-4 | 🟡 | Action outcomes | No feedback after Done from the list | The task migrates groups (implicit), no toast; Done has no reopen from the list (Later), so the click is final without confirmation | A toast (especially undo for Not relevant — see R2-2) | `RunDetails.tsx` (`markDone`) |
| R2-5 | 🟢 | Data states | A long task list stretches the section | Many tasks → the "Tasks" section is long, no scroll/pagination | Cap the height + scroll within the section | `RunTaskList.tsx` |
| R2-6 | 🟢 | Errors | Corrupted `focus:taskOrder` in run = silent fallback | `RunDetails` reads `focus:taskOrder` read-only; bad JSON → `[]` (sort by stressor rank), `readError` invisible in run (degrades gracefully) | Optionally surface `readError` (the degradation is fine anyway) | `RunDetails.tsx` (`useLocalStorage('focus:taskOrder')`) |

*Mid-session external mutation (a list action on a task that's current in a paused focus session): handled gracefully by the `FocusView.firstPendingFrom` reconciliation (advances to the next pending). Low attention.*

### Priority (feature)
1. **🔴 R2-1** — stats/Continue stale after list actions (a regression introduced by the feature; the ADR 0035 promise broken on the main interaction). The fix is small and clear (one `useTasks` instance via `useLiveRuns`).
2. **R2-2** — dismiss from the list with no undo/confirm (ADR 0017).
3. **R2-3** — actions on an archived Run.
4. **R2-4** — feedback/undo after Done.
5. (🟢 polish: R2-5, R2-6).

### Hand-off
- **R2-1** → **direct-edit / harden (priority)**: expose mutators from `useLiveRuns` (or same-tab sync in `useLocalStorage`) — without it the Tasks section lies in the stats.
- **R2-2 / R2-4** → `proto-harden` (undo/confirm + toast).
- **R2-3** → `proto-harden` (gate `archived`).
- **R2-5 / R2-6** → `proto-polish`.

### Resolution (proto-harden, 2026-07-01)

| # | Status | Where it is now |
|---|--------|-------------|
| R2-1 | ✅ | `use-live-runs.ts` (exposes `tasks`/`updateTask`/`deleteTask`/`taskStorage` from its own `useTasks` instance); `RunDetails.tsx` (a single instance via `useLiveRuns` — tiles/Continue recompute live after list actions) |
| R2-2 | ✅ | `RunDetails.tsx` (`markNotRelevant` + `dismissUndo`/`undoDismiss` + `DismissUndoToast`; ADR 0017) |
| R2-3 | ✅ | `RunTaskList.tsx` (`readOnly` hides actions) + `RunDetails.tsx` (`readOnly={archived}` + hint) |
| R2-4 | ✅ | Honest persistence (`if (!updateTask) return` in `markNotRelevant`); Done = implicit feedback (migration to the Done group). Success toast → polish. |
| R2-5 | ❌ Deferred — polish (long list / scroll). |
| R2-6 | ❌ Deferred — polish (degrades gracefully to the default). |

**Closed: 4 (R2-1, R2-2, R2-3, R2-4) · Deferred: 2 (polish).**

---

## Re-audit: per-Run funnel isolation (proto-edgecases, 2026-07-01)

**Scope**: the **active Run** concept (`activeRunId`) + per-Run ownership of funnel data (feature `per-run-funnel-isolation`, ADR 0044; spec in `run.md` after proto-detail, ADR 0045). This is a **pre-implementation audit** — the feature **isn't built yet** (residual step 0 + `proto-lofi` ahead), so "Where" points at the code area that **must** handle the case (an existing file + planned new locations from `docs/changes/per-run-funnel-isolation.md`), and "Behavior today" = the predicted behavior after a naive implementation without guards. UX decisions already confirmed with the user: no active → Dashboard · delete the active → no active · brain-dump draft on switch → doesn't persist · archive the active → clears the active.

**This feature RESOLVES the deferred CM-1 / CM-2 / CM-3** from the original audit (stats / `lastReachedStep` / review source wired to real funnel data — they needed `runId`, which this feature provides). Below are the new gaps it introduces.

### Coverage (feature)
- **Spec captured** (`run.md` §Edge Cases, added in proto-detail): no active Run → Dashboard · mid-funnel switch (ephemeral draft) · multiple active runs each with its own funnel.
- **Already handled in code**: none — the feature isn't built.
- **New gaps**: 14 · 🔴 2 · 🟡 9 · 🟢 3.

### Inventory (feature)

| # | Sev | Category | Edge case | Behavior (after naive impl.) | Suggested behavior | Where |
|---|-----|----------|-----------|-----------------------------|--------------------|-------|
| PR-1 | 🔴 | Navigation / flow | No "active Run" guard on funnel routes | Entering `/capture`/`/decompose`/`/process`/`/focus` without `activeRunId` (a fresh app via deep-link, or the active one was just deleted/archived) → the funnel scopes by `null`/old id → empty or misleading screen, no way forward | Guard funnel routes: no valid `activeRunId` → **redirect to Dashboard** (user decision). Validate that the id exists and `state==='in_progress'` (PR-3) | `App.tsx` routes `/capture`…`/focus` (no guard); `useActiveRun` (new) |
| PR-2 | 🔴 | Action outcomes / data | `deleteRun` without cascade = orphaned data + a broken "terminal deletion" promise | `deleteRun` (`use-runs.ts:77`) today removes only the Run record. After isolation this Run's stressors/tasks/nextActions/reasons/doneVisions/focus-data **stay** in the stores → the user thinks they permanently deleted the Run, but the data lingers in localStorage (growing volume, leak risk on a bad filter) | Cascading deletion of **all** this Run's funnel stores from a **central list** (don't forget future new stores); if any write fails → retry toast (no silent loss) | `use-runs.ts:77` (`deleteRun`); cascade list (new) |
| PR-3 | 🟡 | State / data | A stale `activeRunId` points at a deleted/archived Run | After Delete/Archive of the active one, the pointer (if not cleared) holds a nonexistent/stale id → the funnel scopes by it → empty, or work on an archived Run | Validate `activeRunId` on every read (exists && `in_progress`); the PR-1 redirect catches the rest. Clear on Delete/Archive of the active (per the user decision) | `useActiveRun` (new); `use-runs.ts:77` (delete), `:59` (archive) |
| PR-4 | 🟡 | Forms / unsaved | Switching Runs while typing a brain-dump loses the draft | `Continue` on another Run swaps the data; unsaved text in the capture field (Enter) is lost without a word (decision: ephemeral draft, `BrainDump.tsx:23` `useState`) | Accepted (user decision). Optionally: a light hint if the draft is non-empty on switch; ephemeral field = consistent with today | `BrainDump.tsx:23` (`draft`) |
| PR-5 | 🟡 | Cross-module / state | A paused focus session must resume per-Run | `Continue` on Run A must resume **session A**, not the global/B one. If `focus:session` (`FocusView.tsx:72`) isn't scoped per-Run → switching Runs resumes the wrong (global) queue | Scope `focus:session` per-Run; `useLiveRuns` reads the active Run's snapshot (`use-live-runs.ts:33`) | `FocusView.tsx:72`; `use-live-runs.ts:33,44` |
| PR-6 | 🟡 | Data / migration | Non-idempotent migration / double run | The one-time assignment of `runId` to old global data must be idempotent (don't re-stamp every load, don't create a second "first run"); it must not run after `loadScenario`, which clears storage | A "migrated" flag (or `runId` already present = signal); migrate only when old keys exist without `runId` | migration logic (new); `loader.ts` (mutual exclusion with scenario-load) |
| PR-7 | 🟡 | Data / migration | Migration merges all old data into ONE Run | A user with many "passes" merged in the global store can't separate them — all land in the newest/seed Run | A one-time notice ("we moved your data to Run X"); an honest limitation, not fixable without a heuristic | migration logic (new) |
| PR-8 | 🟡 | Data / stats | Tasks without `runId` (orphans / partial write) are invisible in stats | After migration all tasks have `runId`, but a future orphan (bug, partial write) falls out of `deriveRunStats` for all Runs — the numbers silently disagree | Group by `runId` in `useLiveRuns`; optionally: an alert/orphan-bin for tasks without `runId` | `use-live-runs.ts:49` (mapping global stats to all → per-Run) |
| PR-9 | 🟡 | Cross-module | `lastReachedStep` re-derive must feed on THIS Run's data | `deriveLastReachedStep` (`stats.ts:65`) takes `FunnelSignals`; if fed global numbers → wrong resume step (old CM-2 returns). After isolation the signals must be per-Run | `useLiveRuns` (`use-live-runs.ts:37`) builds `FunnelSignals` from the active Run's data; this **closes CM-2** | `stats.ts:65`; `use-live-runs.ts:37-47` |
| PR-10 | 🟡 | Visual / data | Active-Run chip in the header with no active / long name | The chip slot (`AppShell.tsx:41`) is empty today; after impl. it must degrade when there's no active (hidden vs empty chip — don't confuse) and not mislead; in the MVP it's display-only (click = Later) | Hide the chip when there's no `activeRunId`; `truncate` a long name; display-only (switch via Dashboard) | `AppShell.tsx:41` (slot reserved, unassigned) |
| PR-11 | 🟡 | State transitions | Un-archive shouldn't activate the Run | `unarchiveRun` (`use-runs.ts:67`) restores to the active list; it should not set `activeRunId` (activation = Continue). Verify that archiving the active clears the pointer (PR-3) | Un-archive = return to the list only; activation only via Create/Continue | `use-runs.ts:67` (unarchive), `:59` (archive) |
| PR-12 | 🟡 | Data / referential | DoneVision / Reasons can leak between Runs | `DoneVisionMap` keyed by `stressorId` (`use-done-visions.ts:13`), `Reason[]` (`use-reasons.ts:9`); if not scoped to the active Run → visions/reasons from other Runs may show in `decompose` | The hooks filter by `activeRunId` (or by this Run's set of stressors); globally-unique ids protect against collision, not leak | `use-done-visions.ts:13`; `use-reasons.ts:9` |
| PR-13 | 🟡 | Prototype-specific | `activeRunId` write failure (quota) is silent | If `useLocalStorage('run:active', …)` fails → active unset, the funnel shows empty/misleading with no feedback | Reuse the `writeError`+retry pattern (like other hooks); a toast, UI state = unsaved | `useActiveRun` (new); `use-local-storage.ts` (the status already exists) |
| PR-14 | 🟢 | Data states | Many Runs → global arrays grow (Design B) | Each Run adds to the global keys; with many Runs localStorage grows → quota | Acceptable for a prototype; Design A (key-per-run) would be cleaner; pagination/purge = Later | storage volume (Design B, ADR 0044) |
| PR-15 | 🟢 | Visual | A long active-Run name in the header chip | A long name bursts the narrow chip slot | `truncate` + `title` (hover), like `RunCard` (DS-2) | `AppShell.tsx:41` |
| PR-16 | 🟢 | Data / referential | Per-Run `TaskOrder` with old task ids | A per-Run manual order (`focus:taskOrder`) may hold deleted task ids — existing behavior, now per-Run; verify no cross-Run impact | Degrade gracefully (ignore nonexistent ids, like today) | `focus:taskOrder` per-Run (ADR 0036/0044) |

### Categories checked with no new gaps (feature)
- **`activeRunId` state machine**: it's a pointer (set/clear), not a state machine — transitions = Create/Continue (set), Delete/Archive of the active (clear). No invalid transitions to block.
- **`runId` validation on entities**: ids generated globally-unique (`generateId`) → no collisions between Runs (the PR-12 leak is a filtering matter, not collision).
- **Referential `stressorId`/`nextActionId`**: globally unique → a join within a Run is correct; a cross-Run join doesn't happen (scoped by `runId`).
- **Roles/permissions, offline, `alert()`**: as in the base audit — n/a / OK.

### Priority (feature)
1. **🔴 PR-1** — "no active Run" guard on funnel routes (dead-end / misleading screen). First to implement; without it isolation creates empty screens on every entry without activation.
2. **🔴 PR-2** — cascading deletion of funnel data in `deleteRun` (a broken "terminal deletion" promise + growing orphans).
3. **PR-3 / PR-5 / PR-9** — active-run integrity: pointer validation, per-Run session resume, per-Run step re-derive (together they close the old CM-2/CM-3).
4. **PR-6 / PR-7 / PR-8** — migration (idempotency, honest merge limitation, orphans in stats).
5. **PR-12** — DoneVision/Reasons leak between Runs.
6. **PR-10 / PR-11 / PR-13** — pointer UX (chip, un-archive doesn't activate, active-write failure).
7. **PR-4** — (accepted) ephemeral draft on switch.
8. (🟢 polish: PR-14, PR-15, PR-16).

### Hand-off
Most of these gaps are **data-layer guards and integrity**, not UI states — so they go mainly to **residual (direct-edits, step 0 of the plan)** and `proto-lofi`, not `proto-harden`. Order:
- **PR-1, PR-2, PR-3, PR-5, PR-8, PR-9, PR-11, PR-12** → **residual / `proto-lofi`** (the data-layer foundation + wiring): route guard, delete cascade, pointer validation, per-Run session/stats/re-derive, DoneVision/Reasons scope, un-archive semantics. This is implementation, not states.
- **PR-6, PR-7** → **residual (migration)** + `proto-harden` (migration notice/toast, PR-7).
- **PR-10, PR-13, PR-15** → `proto-lofi` / `proto-polish` (header chip: no-active degradation, write failure, truncate).
- **PR-4, PR-14, PR-16** → conscious compromises / `proto-polish`.

> The feature **resolves the deferred CM-1/CM-2/CM-3** (stats / `lastReachedStep` / review wired to funnel data) — after implementing residual + lofi, remove their "deferred" flag in the base audit's *Resolution* section and drop the "Overview stats" caption on `RunStatTiles`.

### Resolution
*Pending* — the feature isn't built. Refresh this section after implementing residual (step 0) + `proto-lofi`/`proto-harden`.

---

## Feature audit: clickable funnel steps + Run Details actions on top (ADR 0047/0048)

Scope: **NEW** edge cases introduced by the feature (clickable stepper, active-session-exit guard, Details actions reorder). The rest of the module — see the base audit + per-run-isolation above. The funnel screens were designed to be reached from a **guided flow** (which guarantees preconditions); now they're reachable **directly via the stepper** — that's the main new risk surface.

### Coverage (feature)
- **Already handled in code** (a positive result — the funnel screens degrade gracefully on a jump with an empty funnel):
  - BrainDump empty — `BrainDump.tsx:156` ("List is empty. Dump your first stressor…").
  - Ranking with 0 stressors — `Ranking.tsx:59` ("No stressors to order…").
  - Decompose with 0 stressors — `DecomposeView.tsx:70` ("No stressors to break down…").
  - Process with 0 / nothing-to-process — `ProcessView.tsx:411` (`nothingToDo` → "All set — no tasks left to process" + CTA).
  - Focus with 0 described / 0 matched — `SessionFilter.tsx:115,156`; Start disabled when `matchCount === 0` (`:84`).
  - RunTaskList empty (the list on Details, now at the bottom) — `RunTaskList.tsx:65` ("No tasks yet…").
  - Active-session-exit guard (ConfirmDialog) — `FocusView.tsx:411` (`onBeforeNavigate`) + dialog `:539`.
- **New gaps found**: 6.
- **By severity**: 🔴 0 · 🟡 2 · 🟢 4.

> No 🔴 — the feature is functionally complete; the funnel screens handle jumps with an empty funnel. The biggest gaps are **affordance** (clickable steps look disabled) and **guard inconsistency** (only the stepper asks before leaving a session).

### Inventory (feature)

| # | Sev | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|-----|----------|-----------|----------------|--------------------|-------|
| CS-1 | 🟡 | Navigation / consistency | Leaving an active focus session asks ONLY via the stepper; browser back / Dashboard link / reload — don't | The guard acts only on a stepper click (`onBeforeNavigate`); back/reload/link leave silently. The session survives anyway (per-Run snapshot), so this is **not** data loss — but an inconsistency: the stepper asks, back doesn't | Decision: accept and document (guard = stepper only), OR extend the guard to other paths (navigation block / `beforeunload`). MVP: accept + note | `FocusView.tsx:411` (stepper-only guard) |
| CS-2 | 🟡 | Navigation / affordance | Clickable "future" stepper steps look disabled (muted), but are clickable | `!isActive && !isDone` → `text-muted-foreground/60`; only hover changes it to foreground. For an ADHD persona "looks blocked but works" = a misleading affordance | Restyle (`design`/`polish`): clickable steps shouldn't look disabled at rest — a clear interactivity signal (accent/outline instead of muted) | `FunnelStepper.tsx:51` (muted for `!isActive && !isDone`) |
| CS-3 | 🟢 | State / guard | The guard can over-trigger in the safeguard state (session, but the task disappeared) | `screen === 'session' && running` — if `running` is still true in the `session && !currentTask` state (task deleted from another tab), the dialog asks about leaving when there's no active task. Rare, and leaving is harmless anyway | Tighten the guard on task presence: `screen === 'session' && currentTask && running` | `FocusView.tsx:413` (guard condition) |
| CS-4 | 🟢 | Data states / copy | "All set — no tasks left to process" is misleading at literally 0 tasks | The message implies processed tasks; with an empty funnel (a capture→process jump) it's inaccurate, though the "Continue to focus" CTA gives a path | Distinguish the copy: 0 tasks vs all-described (e.g. "No tasks to process yet — create some in Breakdown") | `ProcessView.tsx:411` |
| CS-5 | 🟢 | Data states | Ranking with exactly 1 stressor: degenerate | No Pairing (`≥2`), a single-element list, ↑↓ both `disabled`. Functional (Next enabled at 1), but odd — now reachable directly via the stepper | Acceptable (1 stressor = a valid, trivial case); optionally hide Pairing/arrows at 1 | `Ranking.tsx:41` (`:110/:121` disabled) |
| CS-6 | 🟢 | Navigation / a11y | The stepper adds 5 tab-stops before the content on every funnel screen | Keyboard: the 5 stepper links tab before the screen's main content | Acceptable; consider a "skip to content" if the tab order is burdensome (→ `polish`) | `FunnelStepper.tsx:31` (rendered on every screen) |

### Categories checked with no gaps (feature)
- **Jumping to a step with unmet conditions (the main new surface)**: all 5 funnel screens degrade to an empty-state / CTA — BrainDump, Ranking (0), Decompose, Process (`nothingToDo`), Focus (0 described / 0 matched). ✅ No blank screen, no dead-end.
- **Clicking the current step**: a link to itself = no-op (no new history entry / re-render). ✅
- **Session persistence after "Leave"**: the snapshot is saved by an effect (`FocusView.tsx:191`) before navigation; return → `SessionResumeBanner`. ✅
- **Details actions reorder**: the archived (read-only list + Unarchive above it) and completed (`RunCompleted` CTA above the list) states are consistent; an empty task list has an empty-state (`RunTaskList.tsx:65`) and is now at the bottom. ✅
- **No-active-Run guard**: the funnel routes are protected by `RequireActiveRun`; the stepper renders only after passing the guard. ✅
- **Storage failure on stepper navigation**: navigation doesn't write — no new write-failure path. ✅

### Priority (feature)
1. **🟡 CS-2** — affordance of clickable "future" steps (muted = looks disabled). The highest user-impact of the new ones; misleading for an ADHD persona. → `proto-design`/`proto-polish`.
2. **🟡 CS-1** — session guard only on the stepper (inconsistency with back/reload). Decision: accept + document, or extend. → `proto-harden` (if extending) / conscious compromise.
3. **🟢 CS-3 / CS-4 / CS-5 / CS-6** — polish / copy / rare states. → `proto-polish` or conscious deferral.

### Hand-off (feature)
- **CS-2 → `proto-design`/`proto-polish`** (stepper affordance — this is design, not a state).
- **CS-1 → `proto-harden`** (decision + possibly extending the guard to other paths) OR a conscious compromise (note in the spec: guard = stepper only).
- **CS-3 → `proto-harden`** (tighten the guard condition on `currentTask`) — minor, alongside CS-1.
- **CS-4 / CS-5 / CS-6 → `proto-polish`** (copy / degenerate state / a11y) or defer.
- No 🔴 and no gaps requiring `proto-lofi` (no new screens) — the feature is functionally complete; the rest is affordance/polish.

### Resolution (feature)
- **CS-3 ✅** — the guard now requires a task to be present (gated on `currentTask`): `screen === 'session' && currentTask && running` (`FocusView.tsx:413`). Over-triggering in the safeguard state (session, task disappeared) is eliminated.
- **CS-1 ✅ (accepted + documented)** — the session guard stays **stepper-only**; other paths (back/reload/header links) leave silently but safely (the `focus:session` snapshot persists per-Run regardless of the path → no data loss, resumable). Documented in `run.md` (Edge Cases). Extending to all paths is deferred (fragile, unjustified for the MVP).
- **CS-2 ✅** — implemented in `proto-polish` (ADR 0050: clickable-stepper affordance).
- **CS-4 / CS-5 / CS-6 ❌ (deferred)** — copy in the `process` module / degenerate ranking state (1 stressor) / tab-stop a11y. Conscious — → possibly `proto-polish`, not blocking.

---

## Feature audit: estimated-time totals (ADR 0059/0060/0061)

Scope: NEW surfaces of the *run-estimated-time-totals* feature — the `estimatedTotalMin`/`estimatedRemainingMin` aggregate in `deriveRunStats` (`run/stats.ts`) + 3 displays: a 4th tile and sub-line in `RunStatTiles` (Details), a segment in `DominantRunCard` (dashboard), a time counter in `SessionFilter`/`FocusView` (focus). The rest of the module — see the audits above. The feature is **read-only** (no new actions/writes — the aggregate is derived, not persisted), so classic gaps (forms, write failures, dead-ends) mostly don't apply; the audit focuses on **display coherence** and no-estimate / partial-estimate states.

### Coverage (feature)
- **Already handled in code**:
  - No estimates (`estimatedTotalMin === 0`): a "—" tile instead of a misleading "0m" (`RunStatTiles.tsx:29`); the dominant-card segment omitted (`DominantRunCard.tsx:93`); the remaining sub-line omitted (`RunStatTiles.tsx:55`, guard `totalEst > 0`).
  - Focus filter: `matchedEstimateMin` >0 whenever `matchCount > 0` (matched tasks have `EstimatedTime` guaranteed by the `attributed` filter in `FocusView.tsx:94-106`); the time segment shown on matches (`SessionFilter.tsx:165`).
  - Reactivity: after Done/Dismiss from the list, `deriveRunStats` recomputes `estimatedRemainingMin` live (`RunDetails.tsx` — inherits the `useTasks` instance from the R2-1 fix).
  - Old persisted data without the new fields: safe — `useLiveRuns`/`RunDetails` re-derive stats before reading; `RunCard` (mini) reads only old fields (no access to undefined; `tsc` confirms).
- **New gaps**: 3 · 🔴 0 · 🟡 2 · 🟢 1.

> No 🔴 — a read-only feature, with no data loss / dead-ends / alerts. The biggest gaps are **coherence of the two "left" counters** (task count vs subset-minutes) and **rendering "~0m left" on a completed Run**.

### Inventory (feature)

| # | Sev | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|-----|----------|-----------|----------------|--------------------|-------|
| ET-1 | 🟡 | Data states / coherence | A completed Run shows "~0m left of ~Xh estimated" | When all estimated tasks are done/dismissed: `estimatedRemainingMin = 0` but `totalEst > 0` → the sub-line renders `~0m left of ~1h 30m estimated` (`formatMinutes(0)` = "0m"). It renders above the celebration section (ST-1) of a completed Run — odd | Tighten the sub-line guard to `totalEst > 0 && remEst > 0` (hide when nothing's left), OR rephrase to "~1h 30m estimated · all done" | `RunStatTiles.tsx:55` (guard only `totalEst > 0`) |
| ET-2 | 🟡 | Data states / coherence | The two "left" counters mean different things with partial estimates | Breakdown line: `{remaining}` (count of ALL not-done tasks, `runRemaining`). Sub-line: `~{remEst}` (minutes, only over ESTIMATED not-done). When there are not-done tasks without `EstimatedTime` → divergence: e.g. "3 left · ~45m left of ~1h 45m estimated" — the 45m covers only 2 of 3 tasks, but the user may read it as the total time remaining | Clarify the sub-line copy ("~45m of estimated work left") OR show remaining-minutes only when all tasks are estimated OR add an "(of N tasks)" note explaining the subset | `RunStatTiles.tsx:51` (count "left") + `:55-59` (minutes "left") |
| ET-3 | 🟢 | a11y / clarity | The "—" tile with no estimates is uncommunicative | Label "estimated" + value "—" → a screen reader reads "estimated dash"; visually the user may not connect "—" with "no estimates yet" | An `aria-label`/`title` on the tile ("No time estimates yet") and/or a tooltip. Consistent with DS-3 (a fresh Run "0/0") | `RunStatTiles.tsx:29` |

### Categories checked with no new gaps (feature)
- **Forms & input**: read-only — no new fields (`EstimatedTime` is entered in `process`, hardened there).
- **Action outcomes / destructive**: no new actions; Done/Dismiss from the list have undo/honest-persistence (R2-2/R2-4); the aggregate reacts reactively.
- **State transitions**: the aggregate has no state of its own; it reactively reflects `TaskState` (after Done/Dismiss `estimatedRemainingMin` drops; `skipped` counts as remaining — consistent with `remaining` and the "To do" group).
- **Errors**: no new paths; storage read errors are handled (LE-1 → `RunReadError`).
- **Navigation / flow**: no new screens/deep-links.
- **Prototype-specific (storage)**: no new writes; a task write failure doesn't break coherence (honest-persistence — the state doesn't change → stats stay).
- **Cross-module referential**: deleting/editing `EstimatedTime`/a task → `deriveRunStats` recomputes reactively; old data is safe (re-derivation before reading).
- **Loading/async**: `useLocalStorage` reads synchronously → `deriveRunStats` has real tasks on first render; no "—" flash.
- **`active` semantics**: `active` counts the full estimate as remaining (we don't subtract `timerElapsed`); acceptable — `active` is ephemeral (ADR 0019), we don't track partial consumption.
- **SessionFilter estimate**: ~the time is a session estimate (the timer counts up) — inherent; the display is informational, not a promise of exact length. Very large sets (`formatMinutes` → "50h") are handled, no overflow.

### Priority (feature)
1. **🟡 ET-1** — "~0m left" on a completed Run (a jarring display-bug on a common state; a trivial fix — tightening the guard). The highest user-impact of the new ones.
2. **🟡 ET-2** — divergence of the two "left" counters with partial estimates (coherence of the main stats screen). Needs a short copy/scope decision (design).
3. **🟢 ET-3** — "—" a11y/clarification. → `proto-polish`.

### Hand-off (feature)
- **ET-1 → `proto-harden` (priority, direct-edit)**: tighten the sub-line guard to `remEst > 0` (or rephrase "all done"). Trivial, big readability effect on a completed Run.
- **ET-2 → `proto-harden` + design decision**: "left" coherence — copy or display restriction (a short decision with the designer).
- **ET-3 → `proto-polish`** ("—" a11y / clarifying the lack of estimates).

> No 🔴 and no gaps requiring `proto-lofi` — the feature is functionally complete; the rest is display coherence/polish.

### Resolution (proto-harden, 2026-07-08)

| # | Status | Where it is now |
|---|--------|-------------|
| ET-1 | ✅ | `RunStatTiles.tsx:55` — the sub-line guard tightened to `totalEst > 0 && remEst > 0`; a completed Run (and "all estimated done") no longer renders "~0m left". Visible in the `Run/RunStatTiles → Completed` story (`remEst=0`). |
| ET-2 | ✅ | `RunStatTiles.tsx:56` — the sub-line gained an "Estimated:" prefix (`Estimated: ~X left of ~Y`), scoping it as an estimate metric and distinguishing it from the "N left" task counter in the breakdown line. Decision (default after AFK): rephrasing the copy instead of restricting the display — the info stays, the ambiguity is removed. |
| ET-3 | ✅ (`proto-polish`) | `RunStatTiles.tsx:33` — the "estimated" tile gained `title="No time estimates yet"` in the "—" state (hover tooltip + SR context; `title={undefined}` on a value, so the tooltip only appears where "—" is ambiguous). |

**Closed: 3 (ET-1, ET-2, ET-3).** The feature is fully hardened + polished.

> *Bonus accuracy (`proto-polish`)*: removed the misleading, stale caption "Live stats … per-run breakdown comes later" in `RunStatTiles` (untrue since ADR 0044 — the per-run re-audit explicitly asked for this) and fixed the old "global/per-run-deferred (ADR 0020)" comments in `run/stats.ts`, `run/types/run.ts`, `RunTaskList.tsx`, `scenarios/data/run.ts`.
