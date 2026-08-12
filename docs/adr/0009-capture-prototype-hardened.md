# 0009 - Capture prototype hardened
**Date**: 2026-06-28
**Module**: capture
**Status**: Accepted

## Context
The `capture` prototype handled happy paths, but `proto-edgecases` (ADR 0008) found 15 unhandled edge cases — the most serious being **silent data loss in the LocalStorage layer** (a write succeeded in the UI, then vanished after refresh; a corrupt read zeroed the list without a word). `proto-harden` implements the states without changing the happy path.

## Decision
**12/15** edge-case states implemented (priority order from `docs/modules/capture-edgecases.md`):

1. **Persistence (data blockers)** — `useLocalStorage` is now "honest": on a failed write it does NOT update the state (the UI always reflects what's saved), it reports `writeError` with a retry of the last failed value; a corrupt read reports `readError` instead of a silent fallback to `[]`. Surface: a `StorageStatusToast` toast (a retry toast — a design decision, not a banner). Additionally: multi-tab sync (the `storage` event) and a `generateId` fallback for secure-context.
2. **Deletion/undo** — a global `Ctrl/Cmd+Z` (with a guard on text fields), an **undo stack** (several fast deletions all undoable, `UndoToast`), edit-to-empty **cancels** instead of deleting.
3. **Pairing** — a progress counter (Question N, Stressor X of Y; fixes the off-by-one "Question 0") + a confirmation on interrupting mid-sequence.
4. **Ranking on touch** — explicit ↑/↓ buttons on a row (drag and arrows on focus remain); the row rewritten from `role="button"` to `role="listitem"`, to avoid nested controls (a11y).
5. **Polish** — polska pluralizacja (`pluralize`), `maxLength` 300 na polach.

**Deferred (3)**: scoping stressors to the active Run (#3 — needs the `run` module, a cross-module feature); the field draft on "Next" (#5 — the designer chose discard); long-list virtualization (#15 — polish, acceptable). Focus-trap in the pairing modal remains (a low a11y priority). Loading/in-flight (skeletons/spinners) N/A — synchronous persistence.

Design decisions (AskUserQuestion): a write error → **a retry toast** (not a banner); the draft on "Next" → **discard** (behavior unchanged).

Nie dodano frameworków/bibliotek — stany w istniejących komponentach (`@base-ui/react` + Tailwind), w stylu istniejących hand-built overlayów (modal PairingFlow, toast undo).

## Impact
Każdy flow `capture` obsługuje teraz świadomie też ścieżki błędne, nie tylko happy path; happy path bez zmian. Największa usunięta kruchość: **cicha utrata danych w LocalStorage**. Nowe stany mają story w Storybooku (`Capture/StorageStatusToast`, `Capture/UndoToast`, `Capture/PairingFlow` z fazami). Po zmianach w prototypie uruchomić ponownie `proto-edgecases`, żeby odświeżyć baseline. Wizualny polish to oddzielny przyszły `proto-design`.
