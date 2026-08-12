# Decompose — Edge Cases

Diagnosis of the `decompose` prototype (WHY: reasons + done vision ‖ HOW: next-actions → tasks) for unhandled edge cases. A stress-test with `proto-edgecases` before the harden (`proto-harden`). Each row has a `file:line` — where the gap *should* be handled.

## Coverage
- **Spec already covered** (`docs/modules/decompose.md` Edge Cases): no idea for a next-action (≥1 requirement) · skipped motivation (WHY optional) · next-action without break-down (skip = 1 task) · too-generic next-action (active language in prompts/examples) · single stressor (trivial flow) · very many next-actions/tasks (one stressor per screen).
- **Already handled in code**: empty set of stressors — empty-state + "Go to brain dump" CTA (`DecomposeView.tsx:37-51`); no next-actions — placeholder in HOW (`HowBlock.tsx:106-109`); no reasons — hint in the column (`ReasonColumn.tsx:81-83`); no steps in the modal — hint + "Skip → 1 task" path (`DecomposeModal.tsx:129-133`, `:137-139`); skip break-down → 1 concrete task (`DecomposeModal.tsx:51-54`); safety-net "Next" materializes bare next-actions (`use-tasks.ts:72-82`, `DecomposeView.tsx:68-77`); "Next" gating at 0 next-actions with a hint (`DecomposeView.tsx:61`, `:169-177`); active-language examples as a nudge (`HowBlock.tsx:10-11`, `:89-104`); cascade delete of tasks when deleting a next-action (`DecomposeView.tsx:63-66`); index clamp when the number of stressors changes (`DecomposeView.tsx:53`); truncate long next-actions in the list (`NextActionItem.tsx:80`); keyboard in inline edit (Enter/Escape) (`NextActionItem.tsx:58-68`); Escape closes the modal (`DecomposeModal.tsx:31-37`).
- **Gaps found**: **14**.
- **By severity**: 🔴 2 · 🟡 5 · 🟢 7.
- **After `proto-harden`**: ✅ **8 implemented** · ◑ **1 partial** · ❌ **3 deferred** · — **2 by-design (unchanged)**.

> Biggest source of fragility: **the persistence layer is "honest" in `useLocalStorage`, but four `decompose` hooks throw away its status** (`writeError`/`readError`/`retry`) — so read/write errors are silent here. These are exactly the same two 🔴 gaps that `capture` just hardened (`StorageStatusToast`); `decompose` needs its counterpart.

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🔴 | Prototype-specific | Save to LocalStorage fails (quota/disabled) | The `decompose` hooks only destructure `[value, setValue]` and ignore the 4th element `status`; `useLocalStorage` correctly doesn't update state and sets `writeError`, but nobody reads it. The field draft clears unconditionally (`HowBlock.tsx:54`, `ReasonColumn.tsx:31`), and the entry "doesn't make it" onto the list → **silent entry loss**. | Expose `storage` from each hook + render `StorageStatusToast` (reuse the component from `capture`) in `DecomposeView`; clear the draft only when the save succeeded. | `use-tasks.ts:26`, `use-reasons.ts:12`, `use-next-actions.ts:11`, `use-done-visions.ts:16` (destructuring); consumers `HowBlock.tsx:50-56`, `ReasonColumn.tsx:27-32` |
| 2 | 🔴 | Errors | Corrupted/invalid JSON in storage | `useLocalStorage` on a bad read falls back to the initial value and sets `readError` (`use-local-storage.ts:31-33,38`) — but the `decompose` hooks don't surface it. The user sees an empty WHY/HOW with no indication that the saved data was corrupted; they may re-enter everything. | The same `StorageStatusToast` with a read-error variant ("couldn't load — starting from an empty list"). | `use-tasks.ts:26`, `use-reasons.ts:12`, `use-next-actions.ts:11`, `use-done-visions.ts:16` |
| 3 | 🟡 | Action outcomes | Delete without undo (next-action + its tasks; reason) | `[×]` on a next-action deletes immediately along with its tasks, with no undo; `[×]` on a reason deletes immediately. `capture` has undo on delete (ADR 0004, `UndoToast`) — `decompose` is inconsistent (no undo at all). | An undo-toast for delete-next-action (with tasks) and delete-reason, following `capture` (not a confirmation dialog — consistent with ADR 0004). | `NextActionItem.tsx:104-113`, `ReasonColumn.tsx:69-77` |
| 4 | 🟡 | Action outcomes | Editing a next-action to empty = silent delete | `commit()` on an empty draft calls `onDelete` instead of canceling (`NextActionItem.tsx:34-39`). The same anti-pattern that `capture` fixed (capture #8). | An empty commit cancels the edit (keep the original); deletion is a separate explicit action. | `NextActionItem.tsx:34-39` |
| 5 | 🟡 | Navigation & flow / Forms | Drafts + active stressor are lost on exit | The draft in the HOW/WHY field and the "which stressor of N" index are component state — they disappear on exit (browser back, "← Dashboard" link, "Next"). Saved data survives; only uncommitted drafts and position are lost. | Hold the active stressor index (resume where you left off) and/or warn on an uncommitted draft. (`capture` deferred the draft by design ("discard") — confirm the same decision here.) | `DecomposeView.tsx:34` (index), `:184` (link); `HowBlock.tsx:37`, `ReasonColumn.tsx:24` (drafts) |
| 6 | 🟡 | Cross-module / lifecycle | Deleting a Stressor orphans `decompose` data | `deleteStressor` removes only the row from `capture:stressors` and doesn't cascade to `decompose:reasons/nextActions/tasks` (separate keys). The orphan is invisible (filter by existing `stressorId`, `DecomposeView.tsx:57-59`), but it accumulates in storage. ACTIONS.md promises "together with children" — only the row is removed. | Cascade-delete children (requires a coordination mechanism) or lazy-cleanup of orphans on `decompose` start. The same class as deferred capture #3 (no scoping to the Run). | `src/modules/capture/hooks/use-stressors.ts:38-47`; filter `DecomposeView.tsx:57-59` |
| 7 | 🟡 | Cross-module / lifecycle | Re-break-down recreates task IDs → wipes future attributes *(latent)* | `replaceTasksForNextAction` removes all tasks of the next-action and creates fresh ones from text — new IDs (`use-tasks.ts:56-66`). Today (process = placeholder) tasks have no attributes, so nothing is lost. Once `process`/`focus` exist, returning to `decompose` and saving the modal will wipe already-pinned `context`/`energy`/`estimatedTime`/`timerElapsed`/`state`. | A diff instead of a full replace (preserve the identity of existing tasks), or block re-break-down when tasks already have attributes. | `use-tasks.ts:56-66`, `DecomposeModal.tsx:46-49` |
| 8 | 🟢 | Forms / Data states | No `maxLength` on text fields | The next-action / reason / step / vision fields have no limit — a very long pasted text pushes the rows out. `capture` added `maxLength={300}` (capture #14). | `maxLength` on inputs/textareas (following `capture`). | `HowBlock.tsx:74-82`, `ReasonColumn.tsx:48-55`, `DecomposeModal.tsx:97-105`, `WhyBlock.tsx:73-81` |
| 9 | 🟢 | Errors / a11y | `DecomposeModal`: no focus-trap, no close on backdrop | Overlay `role="presentation"` with no `onClick` — clicking the backdrop does nothing; Tab escapes to the background. Escape closes (OK). | Focus-trap + close on backdrop click (the pattern from the `PairingFlow` modal). | `DecomposeModal.tsx:57` |
| 10 | 🟢 | a11y | A/B tablist: incomplete tab semantics | `role="tab"` without `role="tabpanel"`, `aria-controls`, arrow-key navigation. | Full tab/tabpanel wiring, or degenerate to a segmented control. | `DecomposeView.tsx:104-124` |
| 11 | 🟢 | Data states | Duplicate next-actions / reasons allowed | No dedup — you can add the same text twice → two identical tasks down the funnel. | Accept as intentional (in line with `capture`: duplicates not blocked) or a soft hint. | `use-next-actions.ts:13-21`, `use-reasons.ts:14-22` |
| 12 | 🟢 | Data states | Very long list of next-actions — no virtualization | A stressor with a dozen next-actions renders as one long `<ul>`. | Acceptable for the prototype (in line with `capture` #15); optionally a scroll area. | `HowBlock.tsx:111-124` |
| 13 | 🟢 | Loading & async (multi-tab) | Local vision state in `WhyBlock` went stale across tabs | `useState(doneVision?.text)` initializes once; when the vision changes in another tab for the same open stressor, the local draft doesn't re-sync (the storage layer already syncs). | Re-sync the local draft when the `doneVision` prop changes (or accept it — low frequency). | `WhyBlock.tsx:32-33` |
| 14 | 🟢 | Forms (soft) | Vague next-action: only static examples | Active language is modeled only by static example chips; nothing detects "think about this"/"figure out". | Per the spec/ADR 0006 philosophy (a nudge, not a gate), this is **by design** sufficient; optionally a soft heuristic hint. | `HowBlock.tsx:10-11`, `:89-104` |

### Checked categories — no gaps / N/A
- **Empty collection**: solid — stressors empty-state + CTA (`DecomposeView.tsx:37-51`), WHY/HOW/modal placeholders.
- **One vs many vs very many**: single-stressor trivial; many = one per screen + a "Stressor X of N" counter; very many → only 🟢 #12.
- **Special chars / unicode / emoji / RTL**: free-text, React-escaped display, emoji in vision — ✓.
- **Boundary values (zero/negative/max/fractions)**: no numeric fields in `decompose` (energy/time are pinned in `process`) — N/A.
- **Invalid formats**: no format fields (free text only) — N/A.
- **Double submit**: persistence synchronous; a double click on "Next" is a no-op (`materializeBareNextActions` is idempotent) — ✓.
- **Optional fields**: the whole WHY block is optional; vision is optional; save works — ✓.
- **Success feedback**: the list itself is feedback (in line with `capture`) — ✓.
- **In-flight state / Loading**: synchronous read (`useRef` init in `useLocalStorage`), no blank-screen, no in-flight window — N/A (a skeleton would be artificial).
- **State transitions (FSM)**: `decompose` only creates `pending` tasks; no FSM in this module — N/A.
- **`alert()` / unexpected error**: no `alert()` calls; (unexpected errors = storage → 🔴 #1/#2).
- **Dead ends**: there's always a way forward/back/Dashboard — ✓.
- **Permissions / roles**: single-user — N/A.
- **Offline**: localStorage works offline, no network calls — ✓.

## Priority list
1. 🔴 **Silent data loss in LocalStorage** (#1 write, #2 read) — the `decompose` hooks throw away the persistence status. Expose `storage` + `StorageStatusToast` with retry. The module's biggest fragility; identical to the blockers `capture` just removed.
2. 🟡 **No undo on delete** (#3) — delete next-action (with tasks) and delete reason with no undo; inconsistent with `capture` (ADR 0004). An undo-toast following `capture`.
3. 🟡 **Edit-to-empty = silent delete** (#4) — an empty commit cancels the edit, doesn't delete (capture #8).
4. 🟡 **Orphan cascade + re-decompose** (#6, #7) — cross-module lifecycle: a deleted stressor leaves orphans; re-break-down wipes future task attributes. Solve together with the `run` module / before building `process`.
5. 🟡 **Drafts + position on exit** (#5) — confirm the design decision (discard vs persist index), consistent with `capture`.
6. 🟢 **Polish / a11y** (#8-#14) — `maxLength`, modal focus-trap, tablist a11y, the rest acceptable/by-design.

## Hand-off to proto-harden
Top-priority gaps the harden should implement first:
- **#1 + #2 — surface storage status**: expose `storage` from the four `decompose` hooks and show `StorageStatusToast` (moved/shared with `capture`) in `DecomposeView`. Clear the field draft only after a successful save. These are the only 🔴 and the biggest gain.
- **#3 — undo on delete**: an undo-toast for delete-next-action (with cascading tasks) and delete-reason, consistent with `capture`/ADR 0004.
- **#4 — edit-to-empty**: an empty commit cancels, doesn't delete.
- **#6 + #7 — cross-module lifecycle**: coordinate with the `run` module (cascade on stressor delete) and protect `replaceTasksForNextAction` from wiping attributes before `process`/`focus` exist.

## Harden outcome
Implemented **8/14** states (＋1 partial #9; 3 deferred; 2 by-design). The designer chose a **confirmation dialog** instead of undo on delete (#3) — different from `capture`/ADR 0004. Happy path unchanged. Biggest removed fragility: **silent data loss in the LocalStorage layer** — the four `decompose` stores now report `writeError`/`readError` via a shared `StorageStatusToast` with retry (identical to `capture`, ADR 0009).

| # | Status | Where now / deferral reason |
|---|--------|--------------------------------|
| 1 | ✅ | 4 hooks expose `storage`; `DecomposeView` renders a combined `StorageStatusToast` (writeError) with retry. `use-{tasks,reasons,next-actions,done-visions}.ts`, `DecomposeView.tsx` |
| 2 | ✅ | Same toast, readError variant. Same files |
| 3 | ✅ | **Confirmation dialog** (design decision, not undo). `ConfirmDialog.tsx`; gate in `NextActionItem.tsx` (next-action + task cascade) and `ReasonColumn.tsx` (reason) |
| 4 | ✅ | An empty commit cancels the edit (keeps the original). `NextActionItem.tsx` (`commit`) |
| 5 | ❌ | **Deferred** — consistent with the `capture` design decision (discard draft); saved data survives, only uncommitted drafts + the active index are lost |
| 6 | ❌ | **Deferred** to the `run` module — requires cross-module coordination; lazy-cleanup carries a risk of wiping data on a stressor `readError` |
| 7 | ✅ | `replaceTasksForNextAction` diff-by-text preserves task IDs (observably neutral today, protects future attributes). `use-tasks.ts` |
| 8 | ✅ | `maxLength` (300 on inputs, 600 on the vision textarea). `HowBlock.tsx`, `ReasonColumn.tsx`, `DecomposeModal.tsx`, `WhyBlock.tsx`, `NextActionItem.tsx` |
| 9 | ◑ | Escape + explicit close + initial focus (like `PairingFlow`). Backdrop-click-close **not** added — the project's modal convention (`PairingFlow` doesn't do it either). Focus-trap deferred (consistent with `capture`) |
| 10 | ✅ | A/B "tablist" reduced to a segmented control (`role="group"` + `aria-pressed`). `DecomposeView.tsx` |
| 11 | — | **By-design** — duplicates allowed intentionally (in line with `capture`). Unchanged |
| 12 | ❌ | **Deferred** — virtualization acceptable for the prototype (in line with `capture` #15) |
| 13 | ✅ | `WhyBlock` re-syncs the local vision draft when the prop changes. `WhyBlock.tsx` (`useEffect`) |
| 14 | — | **By-design** — active language is a nudge, not a gate (ADR 0006). Unchanged |

The new states have stories in Storybook: `Decompose/ConfirmDialog` (DeleteNextAction / DeleteReason / Closed), `Decompose/StorageStatusToast` (Write / Read error). After changes in the prototype, re-run `proto-edgecases` to refresh the baseline.
