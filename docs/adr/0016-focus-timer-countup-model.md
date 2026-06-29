# 0016 - focus-timer-countup-model

**Date**: 2026-06-28
**Module**: focus
**Status**: Accepted

## Context
Podczas detailowania modułu `focus` user opisał timer jako **liczący w górę od 0:00**, gdzie `EstimatedTime` jest progiem, po którego przekroczeniu licznik robi się czerwony. To sprzeczne z dotychczas zapisanym modelem (PROJECT / ENTITY_MAP / ACTIONS / GLOSSARY): odliczanie w dół od `EstimatedTime`, a po zerze liczenie w górę. Dla persony ADHD/overwhelmed count-up jest łagodniejszy — mierzy czas spędzony, nie kreuje presji „czas ucieka".

## Decision
Przyjęto **model B**: timer liczy **w górę od 0:00**; `EstimatedTime` taska to próg, po którego przekroczeniu licznik renderuje się czerwono (stan `overtime`). Porzucono model odliczania w dół. `timerElapsed` (per Task, persystowane) to po prostu wartość licznika — uproszczenie semantyki.

## Impact
- `ENTITY_MAP.md`: opis encji `Timer` i jej stanów (`overtime` = `timerElapsed` > `EstimatedTime`), semantyka `timerElapsed`.
- `ACTIONS.md`: akcja Timera „liczy dalej w górę po zerze" → „liczy w górę, czerwono po przekroczeniu oszacowania".
- `GLOSSARY.md`: definicja `Timer`.
- `PROJECT.md`: Happy Path krok 6 + Decisions.
