# Capture — Edge Cases

Diagnosis of the `capture` prototype (brain dump + ranking + pairing) for unhandled edge cases, and after hardening (`proto-harden`) — the implementation status of each gap.

## Coverage
- **Spec already covered** (`docs/modules/capture.md` Edge Cases): empty list ("Next" off) · single stressor (ranking trivial, pairing ≥2) · accidental deletion (undo Ctrl+Z) · duplicates (not blocked) · very long text (truncate + full on edit) · banner ignored (keeps rotating).
- **Already handled in code before harden**: empty list (`BrainDump.tsx:113-119`, `:148-153`; `Ranking.tsx:48-51`), single stressor/pairing ≥2 (`Ranking.tsx:30`, `PairingFlow.tsx:69-73`), undo on delete (`BrainDump.tsx`), duplicates (intentional), truncating long texts (`StressorItem.tsx:89-90`), banner rotation (`PromptBanner.tsx:38-42`).
- **Gaps found by `proto-edgecases`**: **15**.
- **After `proto-harden`**: ✅ **12 implemented** · ❌ **3 deferred** (with rationale).
- **By severity**: 🔴 2 (both ✅) · 🟡 9 (✅ 7 · ❌ 2) · 🟢 4 (✅ 3 · ❌ 1).

## Inventory

Legend: ✅ implemented (link to where it now lives) · ❌ deferred (reason).

| # | Status | Severity | Category | Edge case | Decision / where now |
|---|--------|----------|----------|-----------|------------------------|
| 1 | ✅ | 🔴 | Prototype-specific | Save to LocalStorage fails | Honest persistence: state doesn't change on a failed save + `writeError`; toast with retry. `src/shared/hooks/use-local-storage.ts` (`setValue`, `retry`), `src/modules/capture/components/StorageStatusToast.tsx` |
| 2 | ✅ | 🔴 | Errors | Corrupted/invalid JSON in storage | `readError` instead of a silent fallback to `[]`; informational toast. `use-local-storage.ts` (init + `readError`), `StorageStatusToast.tsx` |
| 3 | ❌ | 🟡 | Cross-module / lifecycle | Stressors not scoped to the Run | **Deferred** — requires building the `run` module (cross-module feature, outside the `capture` harden scope). To be solved together with `run`. |
| 4 | ✅ | 🟡 | Prototype-specific | Multi-tab last-write-wins | Listen for the `storage` event → sync state from other tabs. `use-local-storage.ts` (`useEffect` storage) |
| 5 | ❌ | 🟡 | Forms / Navigation | Draft in the field is lost on "Next" | **Deferred** — the designer chose "discard draft" (behavior unchanged). |
| 6 | ✅ | 🟡 | Navigation & flow | Touch/mobile: no reorder | Explicit ↑/↓ buttons on the row (work on touch and keyboard; arrows on button focus). Drag + keyboard unchanged. `src/modules/capture/components/Ranking.tsx` |
| 7 | ✅ | 🟡 | Action outcomes | No Ctrl+Z (only a 6 s toast) | Global Ctrl/Cmd+Z → undo the last deletion (with a pass for text fields — native undo there). `BrainDump.tsx` (`useEffect` keydown) |
| 8 | ✅ | 🟡 | Action outcomes | Edit to empty = silent delete | Empty draft on commit = cancel edit (keep the original); deletion is a separate explicit action. `src/modules/capture/components/StressorItem.tsx` (`commit`) |
| 9 | ✅ | 🟡 | Flow | Pairing abortable mid-sequence without warning | Progress counter (Question N, Stressor X of Y) + abort confirmation. `src/modules/capture/components/PairingFlow.tsx` (`requestClose`, `confirmAbandon`) |
| 10 | ✅ | 🟡 | Action outcomes | Quickly deleting several → undo only the last one | Undo stack: all quick deletions are undoable; remaining counter. `BrainDump.tsx` (`undoStack`), `src/modules/capture/components/UndoToast.tsx` |
| 11 | ✅ | 🟡 | Errors | `crypto.randomUUID` requires a secure context | Fallback when `randomUUID` is unavailable. `src/shared/types/index.ts` (`generateId`) |
| 12 | ✅ | 🟢 | Polish | Wrong Polish pluralization | `pluralize` helper (1 / 2-4 / 5+) in counters. `src/lib/utils.ts`, used in `BrainDump.tsx`, `PairingFlow.tsx` |
| 13 | ✅ | 🟢 | Polish | "Question 0" off-by-one | `Pytanie {count + 1}`. `PairingFlow.tsx` |
| 14 | ✅ | 🟢 | Data states | Long text in the edit field, no `maxLength` | `maxLength={300}` on the brain dump and edit fields. `BrainDump.tsx`, `StressorItem.tsx` (textarea/auto-grow intentionally omitted — that's polish) |
| 15 | ❌ | 🟢 | Loading & async | Very long list — no virtualization | **Deferred** — acceptable for the prototype; low priority. |

### Checked categories — no issues / N/A after harden
- **Loading / in-flight (skeletons, spinners)**: N/A — `capture` persistence is synchronous (localStorage in a `useState` initializer), so there's no async loading or in-flight actions; skeletons and disable+spinner would be artificial.
- **Special chars / unicode / emoji / RTL**, **boundary values** (no numeric fields), **invalid formats** (one text field), **double submit** (guarded), **optional fields** (N/A), **success feedback** (the list = feedback), **state transitions** (no FSM), **permissions/roles** (single-user), **offline** (works), **empty collection** (solid empty-state).
- **a11y (marginal)**: focus-trap in the PairingFlow modal remains unhandled (low priority); the rest of a11y (aria-live, aria-label, role, focus) is preserved/improved.

## Priority list (status)
1. ✅ **Silent data loss on LocalStorage save** (#1, #2) — honest persistence + toast with retry + read-error.
2. ❌ **No scoping to the Run** (#3) — deferred to the `run` module.
3. ✅ **Ctrl+Z undo** (#7) + draft on "Next" (#5 deferred by design choice).
4. ✅ **Touch: ranking** (#6) — ↑/↓ buttons.
5. ✅ **Silent delete on edit-to-empty** (#8) + **multiple undo** (#10).
6. ✅ **Abandoning pairing** (#9) — confirmation + progress.
7. ✅ **Multi-tab overwrite** (#4) + **`crypto.randomUUID`** (#11).
8. ✅ **Polish** (#12-#14) · ❌ virtualization (#15).

## Harden outcome
12/15 gaps implemented, 3 deferred (2 by design/scope decision: #3, #5; 1 polish: #15). Biggest removed fragility: **silent data loss in the LocalStorage layer** — a save no longer "succeeds" in the UI while failing, and a corrupted read no longer silently zeroes the list; both states have a toast with a recovery path. Happy path unchanged.

The new states have stories in Storybook: `Capture/StorageStatusToast` (Write/Read error), `Capture/UndoToast` (single/multiple), `Capture/PairingFlow` (intro/mid-sequence/abandon-confirm/done).
