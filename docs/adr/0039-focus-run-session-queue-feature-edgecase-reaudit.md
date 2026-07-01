# 0039 - focus+run session-queue feature edge-case re-audit
**Date**: 2026-07-01
**Module**: focus, run
**Status**: Accepted

## Context
Po `proto-lofi` feature'u session-queue-order + run-task-list (ADR 0035) trzeba było wystresować nowe powierzchnie: lista dopasowanych + `TaskOrder` w `focus` (`SessionTaskList`) oraz sekcja „Tasks" + akcje z listy w `run` (`RunTaskList`). Powierzchnie sprzed feature'u były już audytowane (ADR 0018/0024) i hartowane (ADR 0019/0025) — re-audit skupia się na nowościach i ich interakcjach.

## Decision
Dopisano datowane sekcje re-auditu do `docs/modules/focus-edgecases.md` (7 luk: 🟡 2 · 🟢 5) i `docs/modules/run-edgecases.md` (6 luk: 🔴 1 · 🟡 3 · 🟢 2).

**Najwyższy priorytet — R2-1 (🔴)**: po akcjach Done/Not-relevant z listy na `RunDetails` statystyki (`RunStatTiles`) i Continue **nie odświeżają się na żywo**. `RunDetails` trzyma dwie instancje `useTasks()` (własną do mutacji + wewnątrz `useLiveRuns` do statystyk), a `useLocalStorage` synchronizuje instancje **tylko cross-tab** (event `storage` nie pinguje tego samego okna). `RunTaskList` się odświeża (instancja mutująca), ale statystyki czytają instancję statystyk — stale do refresha. Łamie to obietnicę „statystyki przeliczają się na żywo" (ADR 0035). Fix: wystawić mutatory z `useLiveRuns` (już woła `useTasks`) i użyć jednej instancji w `RunDetails` (albo dodać same-tab sync do `useLocalStorage`).

Pozostałe priority: F2-1 (reset bez undo), R2-2 (dismiss z listy bez undo/confirm — ADR 0017), R2-3 (akcje na zarchiwizowanym Runie), F2-2 (resume vs live `TaskOrder`).

## Impact
`proto-harden` wdraża priority list — **R2-1** jako direct-edit/harden (priorytet, bo main-interaction regression), F2-1/R2-2/R2-3/R2-4 w harden, reszta (🟢) w polish. Re-run `proto-edgecases` po zmianach dla świeżego baseline'u.
