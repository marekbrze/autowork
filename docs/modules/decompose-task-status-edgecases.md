# Decompose — Task-status display: Edge Cases

Feature-focused re-audit (precedent: ADR 0039). It diagnoses **only the new behavior** planned in `docs/changes/decompose-task-status-indicator.md` (ADR 0056) and specified in `docs/modules/decompose.md` (ADR 0057): read-only task state marker (`completed` ✓ / `dismissed` ⊘ "not relevant") + `X/N done` progress counter + de-emphasis (`ResolvedNextAction`) in the `decompose` HOW block. The rest of the module is already audited and hardened (`decompose-edgecases.md`, ADR 0011/0010) — those gaps are not repeated here.

Each row has a `file:line` — where the new logic *should* handle the case (mainly `NextActionItem.tsx`, which today renders tasks as bare `–` bullets without state, `NextActionItem.tsx:121-130`).

## Coverage
- **Spec already covered** (`docs/modules/decompose.md` Edge Cases, added ADR 0057): next-action without tasks (no counter) · mix of states (`1/2 done`, no de-emphasis) · re-break-down preserves `state` (diff-by-text) · task without `state` → neutral · `dismissed` ≠ `completed` (both calm, not red) · a11y (glyph+text) · resolved next-action still editable.
- **Not yet built in code** — the feature is a pure display change; `NextActionItem.tsx` today ignores `task.state`. "Behavior today" below = the current state (before implementation).
- **Gaps found (beyond what the spec already covers)**: **7** (the spec covered 7 related; here the diagnosis is about implementation details).
- **By severity**: 🔴 0 · 🟡 4 · 🟢 7.

> The biggest source of fragility in the new feature: **interaction with the existing break-down modal** (`DecomposeModal`) — the modal operates on task texts alone and doesn't know their state, so editing a done task's text silently reverts it to `pending` (#1). The rest is a11y (#3) and a defensive guard on missing `state` (#4) — cheap to handle at implementation.

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🟡 | Cross-module / Action outcomes | Re-break-down silently reverts a done/dismissed task to `pending` | `DecomposeModal` shows only texts (`initialSteps = tasks.map(t=>t.text)`, `NextActionItem.tsx:135`) — no state. Editing a done task's text / a small change breaks the match in `replaceTasksForNextAction` (`use-tasks.ts:62-81`) → the old done task is removed, a new `pending` one appears. The user loses "done/irrelevant" status without knowing; the modal doesn't warn. | Show the task state in the modal (a ✓/⊘ marker next to the step) OR warn when editing/removing the text of a resolved step. Design decision in `proto-harden`. | `DecomposeModal.tsx:112-134` (step list), `:46-49` (save → replace); diff `use-tasks.ts:62-81`; mount `NextActionItem.tsx:132-139` |
| 2 | 🟡 | Data states (semantics) | `dismissed` counted toward the counter's "done" | The `X/N done` counter counts `completed`+`dismissed` (consistent with `Run.progress`). A next-action with only `dismissed` reads "N/N done" + de-emphasis — it looks fully complete, even though nothing was done (all irrelevant). Semantically misleading. | Accept it (parity with `Run.progress`, simple communication) OR change the label/counter ("resolved", or split "done · irrelevant"). Decision on the already-deferred wording question (user AFK → default "X/N done"). | count badge `NextActionItem.tsx:89-96`; derivative `:44` |
| 3 | 🟡 | a11y | Task state / resolved next-action unavailable to AT | If done=strike+✓ and dismissed=⊘+tag are only visual, a screen reader will read just the text. Next-action de-emphasis (opacity+strike) is also silent for AT. | `aria-label`/visually-hidden per task ("…: done" / "…: not relevant"); an `aria-label`/role affordance on the de-emphasized next-action ("resolved"). State via glyph+text, not only color (already in the ADR 0057 spec). | task list `NextActionItem.tsx:121-130`; container/de-emphasis `:47-52` |
| 4 | 🟡 | Cross-module / lifecycle (guard) | Legacy/migrated task without a `state` field | `migrate.ts:114-116` backfills `runId`, **not** `state`. A task persisted before the `state` field was introduced doesn't have it. Natural code (switch/ternary with default→neutral) won't crash and won't count as resolved — but this needs to be made **explicit** (don't assume `state ∈ {5}`). | Explicit default→neutral in the per-task render; `resolvedCount` with `===` is safe for `undefined`. Document the assumption. | per-task switch `NextActionItem.tsx:121-130`; filter `:44` |
| 5 | 🟢 | Action outcomes (copy) | Delete ConfirmDialog doesn't mention done tasks | Deleting a resolved next-action: the existing dialog says "I'll also delete its tasks" (`NextActionItem.tsx:141-151`) with no info that the tasks are done/irrelevant. Minor (existing behavior). | Optionally refine the copy, or accept (read-only applies to state; deletion is an existing action). | `NextActionItem.tsx:141-151` |
| 6 | 🟢 | Data states (aggregate) | Stressor with all next-actions resolved | The screen shows only de-emphasized/grey next-actions with no aggregate at the stressor level — it may read as "broken/greyed out". | Optionally a subtle stressor-level hint ("all actions handled") — deferred in the plan (ADR 0056 "Later"). Acceptable for the MVP. | `DecomposeView.tsx` HOW block (stressor level) |
| 7 | 🟢 | Data states | `active`/`skipped` render neutrally | The MVP shows only completed/dismissed; an `active` task (under the timer) or a `skipped` one (deferred) renders as a bare `–`. A next-action with only `skipped` doesn't get de-emphasis (skipped ≠ resolved) — correct, but the user might expect "resolved". | Acceptable for the MVP (per the ADR 0057 spec). Optionally later. | task list `NextActionItem.tsx:121-130` |
| 8 | 🟢 | Errors / a11y (contrast) | Strike-through + muted resolved contrast | De-emphasis (opacity-60 + strike) lowers contrast; make sure the muted text meets WCAG AA. `dismissed` is NOT red (DESIGN.md anti-ref "harsh red alarm"). | Verify contrast at implementation; use muted tokens (not a fixed alpha below AA). | de-emphasis `NextActionItem.tsx:47-52`; task list `:121-130` |
| 9 | 🟢 | Data states | Long task text under strike-through | Long text + strike-through + truncate (`NextActionItem.tsx:124`) — make sure the truncate reads well with the strike-through. | Verify at implementation; truncate already exists. | `NextActionItem.tsx:124` |
| 10 | 🟢 | Data states | Many resolved tasks under one next-action | A long list of struck-through tasks = visual noise; no collapse. | Acceptable for the prototype; optionally collapse later. | task list `NextActionItem.tsx:121-130` |
| 11 | 🟢 | Loading & async (cross-tab) | State changes in another tab while decompose is open | A task marked done in `focus`/`run` in another tab: `useLocalStorage` syncs (`storage` event), `tasks` reactively → `HowBlock` re-groups → the marker/counter/de-emphasis update live. Probably ✓ already works. | Verify the reactive path; change not expected. | `HowBlock.tsx:42-50` (grouping), `use-tasks.ts` |

### Checked categories — no gaps / N/A
- **Empty collection / empty states**: covered by the baseline (`decompose-edgecases.md`); the new feature adds no screen, it only decorates the existing list.
- **Double submit / in-flight state**: N/A — read-only, no mutating action.
- **Field validation / invalid formats / required fields**: N/A — the feature adds no inputs (read-only display).
- **State transitions (FSM)**: N/A — `decompose` doesn't mutate `Task.state` (read-only; `focus`/`run` mutate).
- **Storage write/read failure**: the existing `StorageStatusToast` (hardened #1/#2, ADR 0011) covers the task store; on `readError` the display degrades gracefully (no tasks → no markers, no crash).
- **`alert()` / unexpected error**: N/A.
- **Dead ends / navigation**: N/A — the feature doesn't change the flow.
- **Offline**: N/A — read-only from localStorage.
- **Permissions / roles**: N/A (single-user).

## Priority list
1. 🟡 **#1 — re-break-down reverts resolved tasks** — the only real "loss" (of status) in the new feature; `DecomposeModal` doesn't know about state. Show state in the modal or warn.
2. 🟡 **#3 — state a11y** — convey done/irrelevant + resolved to screen readers (glyph+text + aria).
3. 🟡 **#4 — guard on missing `state`** — explicit default→neutral (legacy/migrated data; `migrate.ts` doesn't backfill `state`).
4. 🟡 **#2 — counter semantics** — confirm the wording "done" vs "resolved" (default "X/N done", parity with `Run.progress`).
5. 🟢 **Polish** (#5-#11) — dialog copy, stressor aggregate, neutral active/skipped, contrast, truncate, long lists, verify cross-tab.

## Hand-off to proto-harden
Top-priority gaps the harden should implement together with the display (residual edit in `NextActionItem.tsx`, plan ADR 0056):
- **#1 — state-aware `DecomposeModal`**: when implementing the marker, consider showing the task state in the break-down modal (or a warning), so editing the text doesn't silently revert done/irrelevant.
- **#3 — a11y from the first line**: `aria-label` per task + resolved next-action (don't add it later).
- **#4 — defensive default**: a neutral branch for a missing/unknown `state`.
- **#2 — confirm with the designer** the counter wording ("X/N done" vs alternatives).

> Note: this feature is thin and read-only, so most "states" are implementation decisions, not separate state screens as in a typical harden. `proto-harden` here = implement #1/#3/#4 together with the residual edit + optionally a Storybook story (resolved next-action, mix of states, dismissed-only, task without `state`).
