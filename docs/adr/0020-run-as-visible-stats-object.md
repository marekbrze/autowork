# 0020 - Run jako widoczny obiekt ze statystykami (wiele runów)

**Date**: 2026-06-29
**Module**: run
**Status**: Accepted

## Context
`MODULES.md` pierwotnie ramował moduł `run` jako minimalny MVP — „wystarczy jeden aktywny Run", traktowany raczej jako cicha warstwa persystencji. W trakcie detailing `run` user sprecyzował odwrotną wizję: Run to **widoczny, namacalny obiekt, którym świadomie zarządza** — widzi statystyki (czas spędzony, wykonane, zostało, progress), a **wiele runów żyje równolegle**, odpalanych z dashboardu.

## Decision
Run = widoczny obiekt ze statystykami (nie ukryty pojedynczy kontener). Wiele runów równolegle. Każdy Run niesie statystyki: `timeSpent` (łączny czas z focusa — suma `timerElapsed`), wykonane (`completed + dismissed`), zostało, `progress` %. To **superseded** notki „MVP = jeden aktywny Run" z `MODULES.md`.

## Impact
- `MODULES.md`: wpis `run` rozszerzony (multi-run, statystyki, archive); usunięta minimalistyczna ramka MVP.
- `ENTITY_MAP.md`: Run zyskuje atrybut `timeSpent`.
- `ACTIONS.md`: dodane `View Details / Stats`.
- `docs/modules/run.md`: utworzony (Vision, flow Create/Continue/Details).
