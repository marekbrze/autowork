# 0021 - stan Runa `archived` (archiwizacja odwracalna)

**Date**: 2026-06-29
**Module**: run
**Status**: Accepted

## Context
The user wants to be able to **archive** finished runs — hide them from active, but keep them in history (stats + comparison for motivation). Previously a Run had only the `in_progress` state and one destructive operation (`Delete`). An intermediate state is needed, plus a decision on reversibility and the trigger.

## Decision
Nowy stan Runa: **`archived`**.
- `in_progress` — active, visible in the active list, resumable (Continue).
- `archived` — hidden from active, visible in the **archive/history** (stats + comparison still available), **reversible** via `Un-archive` (returns to active, can be Continued).
- `Delete` remains **the only terminal operation** — it permanently removes the Run (from history/archive too).
- Archiving is **manual only** (from Details) — no auto-archive at 100% done.

## Impact
- `ENTITY_MAP.md`: stany Runa = `in_progress` | `archived`.
- `ACTIONS.md`: dodane `Archive Run` i `Un-archive Run`.
- `GLOSSARY.md`: dodane `Archive`/`archived` i `Un-archive`.
- `docs/modules/run.md`: flow Archive/Un-archive; ekran Archived Runs (historia).
