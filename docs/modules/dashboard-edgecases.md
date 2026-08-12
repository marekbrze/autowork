# Dashboard — Edge Cases

Audit stress-test of the `dashboard` prototype (after `proto-lofi`). A behavior-focused inventory of gaps: what the prototype does today, the suggested default behavior (the starting point for `proto-harden` — not a final decision), and the `file:line` where the gap should be handled.

Scope: the whole module (one launcher screen `DashboardView` + `DominantRunCard`).

## Coverage

**Spec already captured** (`docs/modules/dashboard.md` → Edge Cases): zero runs, one active run, all archived, completed-not-archived run, storage read error, multiple active runs (sorting), overview statistics (mock).

**Already handled in code:**
- Zero runs → a large CTA "Start your first Run" — `DashboardView.tsx:110-124`.
- One active run → only the dominant card (the "others" section doesn't render) — `DashboardView.tsx:66-72,74`.
- All archived → "no active runs" + start + archive entry — `DashboardView.tsx:102-109,127`.
- Storage read error → `RunReadError` (reload) — `DashboardView.tsx:49-55` → `RunStates.tsx:20-37`.
- Active runs sorted by `lastActiveAt` desc — `DashboardView.tsx:27-33`.
- **Save failure (quota/disabled)** — `useLocalStorage` does NOT update state on a failed save, reports `writeError`, remembers the value for `retry` — `use-local-storage.ts:53-76`; in the dashboard it's surfaced via `StorageStatusToast` — `DashboardView.tsx:137-143` → `StorageStatusToast.tsx:21-63`.
- `createRun` returns `null` on save failure, and `handleStartNew` navigates only on success (`if (run)`) — `use-runs.ts:37-38`, `DashboardView.tsx:42-45`.

**New gaps found:** 6 (after `proto-harden`: ✅ 4 implemented, ❌ 2 deferred).
**By severity:** 🔴 0 · 🟡 2 · 🟢 4.

The module is a thin view layer over the already-hardened `run` module (storage, errors, destructive confirmations = inherited and solid). The gaps below are specific to the dashboard.

## Inventory

| # | Sev | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|-----|----------|-----------|----------------|--------------------|-------|
| 1 | 🟡 | State transitions | **Completed run (100%) as dominant** — the primary CTA "Continue" lies; nothing to resume; no archive nudge on the card. | `completed` only changes cosmetics (emerald text `DominantRunCard.tsx:50-51`, bar color `:75`). "Continue" stays primary (`:89-91`) → routes to `/focus` (celebration) with nothing to do. The spec says "Continue → details completed", but the card has no archive CTA (unlike `RunDetails`, which swaps to `RunCompleted`). | When `completed`: swap the primary CTA to "Archive this run" (the `RunCompleted` pattern from `RunStates.tsx:48-65`) or a nudge "completed — archive?"; push Continue down. | `src/modules/dashboard/components/DominantRunCard.tsx:88-98`; routing `DashboardView.tsx:70` |
| 2 | 🟡 | Action outcomes | **Double click "Start new"** → creates an orphaned empty Run. | `handleStartNew` calls `createRun()` (sync) and `navigate('/capture')`; the button isn't disabled in-flight (`DashboardView.tsx:42-45`). Two quick clicks before unmount → two `createRun` calls → two runs, one is navigated to, the other is left orphaned. Affects 3 buttons: empty CTA (`:120`), all-archived (`:106`), "+ new run" (`DominantRunCard.tsx:95`). | An in-flight guard (disable the button until navigation) or dedup `createRun` within a short window. | `src/modules/dashboard/components/DashboardView.tsx:42-45` |
| 3 | 🟢 | Data states | **Run without tasks (0/0) as dominant** → a meaningless stats line. | A fresh run (`totalTasks: 0`, e.g. the `minimal` scenario or one just created) shows "0 of 0 done · 0 remaining · 0s in focus" (`DominantRunCard.tsx:79-84`); `runProgress` = 0 (`run.ts`). A new run should invite action, not show zeroes. | When `totalTasks === 0`: an inviting line ("No tasks yet — start with a brain dump") instead of breaking down zeroes. | `src/modules/dashboard/components/DominantRunCard.tsx:79-84` |
| 4 | 🟢 | Data states | **Very many active runs** — unbounded list. | Smaller runs render in a flat `<ul>` with no cap/pagination (`DashboardView.tsx:77-98`). With many runs the page gets long (dominant + N mini-cards + archive). | Lofi: acceptable; consider a soft cap (first N + "X more") or grouping later. | `src/modules/dashboard/components/DashboardView.tsx:74-100` |
| 5 | 🟢 | Navigation & flow | **Archive entry hidden when `archivedCount === 0`.** | The archive link renders only when `archivedCount > 0` (`DashboardView.tsx:127`). The spec says "archive entry at the end of the active runs list" (implies a constant presence). With zero archived — no link. | Either always-present "Archive (0)" or consciously hide-when-empty (confirm with the designer). | `src/modules/dashboard/components/DashboardView.tsx:127-135` |
| 6 | 🟢 | Data states | **`lastActiveAt` tie** → non-deterministic dominant selection. | Sort `b.lastActiveAt.localeCompare(a.lastActiveAt)` (`DashboardView.tsx:31`); on equal values (mock-seed or the same tick) the order between ties depends on entry order, and `active[0]` (dominant) is underdetermined. | Sort with a secondary key (e.g. `createdAt` desc) so ties are deterministic. | `src/modules/dashboard/components/DashboardView.tsx:27-33` |

## Categories checked with no gaps

- **Forms & input** — the dashboard has no forms (rename lives in `RunDetails`, already validated: `aria-invalid`, `maxLength 60`). N/A.
- **Validation** — no fields. N/A.
- **Destructive actions** — none on the launcher (delete/archive in `RunDetails`/`ArchivedRuns` with `ConfirmDialog`). Inherited ✓.
- **Undo** — N/A for the launcher.
- **Loading & async** — `localStorage` read synchronously on first render (`use-local-storage.ts:27-34`); no blank/spinner. ✓.
- **Errors** — readError → `RunReadError`; writeError → `StorageStatusToast`; no `alert()`/`window.alert`. ✓.
- **Error recovery** — reload (read) / retry (write). ✓.
- **Navigation & flow** — no dead-ends; every action leads somewhere; refresh-safe (stateless view over localStorage). ✓.
- **Cross-module / lifecycle** — a deleted run disappears from the list (filter recomputed); no dangling references. ✓.
- **Storage failure (quota/disabled)** — `useLocalStorage` catches it (`use-local-storage.ts:46`), reports `writeError`, state not updated; toast + retry. Solid ✓.
- **Offline** — client-side; works offline. ✓.

## Priority list

1. **Completed run as dominant (#1)** — the primary CTA "Continue" is misleading; biggest user-facing impact, low cost (CTA swap via the `RunCompleted` pattern).
2. **Double click "Start new" (#2)** — orphaned run = data pollution; an in-flight guard is a small change.
3. **Run without tasks (#3)** — message clarity on a fresh dominant.
4. **Archive entry hidden (#5)** — navigation discoverability; design decision.
5. **`lastActiveAt` tie (#6)** — determinism, rarely hit.
6. **Unbounded list (#4)** — scale; to defer.

## Hand-off to proto-harden

Top-priority gaps to implement first:
- **#1 Completed dominant** — swap the primary CTA to archive / nudge, push Continue down.
- **#2 Double click "Start new"** — in-flight guard on the buttons that create a Run.

## Status after proto-harden

Implemented (✅):
- **#1 Completed dominant** → primary CTA "Archive this run" (Continue removed) — `src/modules/dashboard/components/DominantRunCard.tsx` (actions) + `DashboardView.tsx` (`onArchive` → `archiveRun`).
- **#2 Double click "Start new"** → `creatingRef` guard blocks the second `createRun` — `src/modules/dashboard/components/DashboardView.tsx` (`handleStartNew`).
- **#3 Run without tasks (0/0)** → "No tasks yet — start with a brain dump" instead of breaking down zeroes — `src/modules/dashboard/components/DominantRunCard.tsx`.
- **#6 `lastActiveAt` tie** → secondary key `createdAt` desc — `src/modules/dashboard/components/DashboardView.tsx` (sort).

Deferred (❌, justified):
- **#4 Unbounded active runs list** — acceptable for lofi (like the "overview statistics" in `run.md`); a soft cap / pagination belongs in the design phase, not harden.
- **#5 Archive entry hidden at 0** — conscious decision: hiding the empty link = cleaner UX (no dead link to an empty archive); revisit if navigation discoverability becomes a problem.
