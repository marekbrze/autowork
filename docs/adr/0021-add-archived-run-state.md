# 0021 - stan Runa `archived` (archiwizacja odwracalna)

**Date**: 2026-06-29
**Module**: run
**Status**: Accepted

## Context
User chce móc **archiwizować** skończone runy — schować je z aktywnych, ale zachować w historii (statystyki + porównanie do motywacji). Dotychczas Run miał tylko stan `in_progress` i jedną operację niszczącą (`Delete`). Potrzebny stan pośredni + decyzja o odwracalności i triggerze.

## Decision
Nowy stan Runa: **`archived`**.
- `in_progress` — aktywny, widoczny na liście aktywnych, wznawialny (Kontynuuj).
- `archived` — schowany z aktywnych, widoczny w **archiwum/historii** (statystyki + porównanie nadal dostępne), **odwracalny** przez `Un-archive` (wraca do aktywnych, można Kontynuować).
- `Delete` pozostaje **jedyną operacją terminalną** — usuwa Run na stałe (z historii/archiwum też).
- Archiwizacja jest **wyłącznie ręczna** (ze Szczegółów) — brak auto-archive przy 100% done.

## Impact
- `ENTITY_MAP.md`: stany Runa = `in_progress` | `archived`.
- `ACTIONS.md`: dodane `Archive Run` i `Un-archive Run`.
- `GLOSSARY.md`: dodane `Archive`/`archived` i `Un-archive`.
- `docs/modules/run.md`: flow Archive/Un-archive; ekran Archived Runs (historia).
