# 0017 - add-dismissed-task-state

**Date**: 2026-06-28
**Module**: focus
**Status**: Accepted

## Context
W `focus` user potrzebuje oznaczyć task jako **nieaktualny** — stracił sens (termin minął, ktoś inny załatwił, okoliczności się zmieniły). To inna intencja niż `Skip` („nie teraz, wrócę" — task żyje i wraca) i `Done` („zrobione"). Dotychczasowy `TaskState` (`pending → active → completed | skipped`) nie miał na to miejsca.

## Decision
Dodano nowy stan terminalny **`dismissed`** i akcję **`Dismiss`** (oznacz task jako nieaktualny). Właściwości:
- **Nie wraca** w kolejnych sesjach (terminalny; różnica vs `Skip`, który wraca jako `pending`).
- **Undo** (jak usuwanie stresora — ADR 0004); cofnięcie → `pending`.
- **Liczy do progresem Runa** (traktowany jako „załatwione" — zdjęte z talerza).
- **Widoczny w `SessionSummary`** w **osobnej sekcji** („Nieaktualne").
- `ClearCompleted` czyści `completed` **i** `dismissed`.

`TaskState`: `pending → active → completed | skipped | dismissed`. `progress = (completedTasks + dismissedTasks) / totalTasks`.

## Impact
- `ENTITY_MAP.md`: stany `Task` (+ `dismissed`); semantyka `progress` w `Run`.
- `ACTIONS.md`: nowa akcja `Dismiss` pod `Task`; rozszerzona uwaga przy `ClearCompleted`.
- `GLOSSARY.md`: nowy termin „Nieaktualne (odrzucone)" + aktualizacja `TaskState`.
- `PROJECT.md`: Decisions.
