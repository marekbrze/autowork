# 0040 - focus+run session-queue prototype hardened
**Date**: 2026-07-01
**Module**: focus, run
**Status**: Accepted

## Context
Po `proto-lofi` + `proto-edgecases` feature'u session-queue-order + run-task-list (ADR 0035/0039) trzeba było zahardować nowe powierzchnie. Re-audit (ADR 0039) wskazał 13 luk (focus 7, run 6), z czego 1 🔴 (R2-1) i 5 🟡.

## Decision
Wdrożono stany harden top-down z re-auditu:
- **R2-1 (🔴)** — `useLiveRuns` wystawia `tasks`/`updateTask`/`deleteTask`/`taskStorage` ze swojej instancji `useTasks`; `RunDetails` używa jednej instancji → kafelki statystyk i Continue przeliczają się **na żywo** po akcjach Done/Not-relevant z listy (wcześniej dwie niesynchronizowane w tej samej karcie instancje `useTasks` = statystyki stale do refresha; łamało obietnicę ADR 0035).
- **R2-2 (🟡)** — undo dla Dismiss z listy (`DismissUndoToast`; ADR 0017).
- **R2-3 (🟡)** — zarchiwizowany Run → lista tasków read-only (akcje ukryte + hint „Read-only — unarchive to edit").
- **R2-4 (🟡)** — honest persistence (`if (!updateTask) return` w `markNotRelevant`) + implicit feedback dla Done (migracja do grupy Done).
- **F2-1 (🟡)** — `ConfirmDialog` dla „Reset to default" w filtrze focus (destruktywne — utrata ręcznego `TaskOrder`).

Story: `Run/RunTaskList → ReadOnly`. ✅ tsc + eslint + build.

Odroczone: **F2-2** (decyzja designu — resume vs live `TaskOrder`; zmienia happy-path, poza zakresem harden), **F2-3…F2-7 / R2-5 / R2-6** (polish — DnD na touch, długie listy, aria-live, prune ID).

## Impact
Prototype obsługuje teraz ścieżki błędne nowych powierzchni: destruktywne akcje z confirm/undo, archived read-only, live stats po mutacjach cross-module. Największa usunięta kruchtość: **R2-1** — statystyki Runa kłamały po akcjach z listy. Wizualny polish → osobny `proto-design`/`proto-polish`.
