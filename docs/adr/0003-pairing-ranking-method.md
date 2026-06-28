# 0003 - Parowanie jako metoda ranking stresorów

**Date**: 2026-06-28
**Module**: capture
**Status**: Accepted

## Context
W dokach ranking stresorów był pojedynczą akcją („Rank Stressor") bez opisanej mechaniki. User zaproponował hybrydę: domyślnie ręczne układanie listy, a opcjonalnie **proces parowania** — zobowiązany ciąg porównań parami („który bardziej stresuje: A czy B?"), z którego „mądry algorytm" układa finalną kolejność. Cel: każda decyzja jest mniejsza (para vs cała lista) — w duchu „zdejmij ciężar decydowania".

## Decision
Wprowadzono **`Pairing`** — opcjonalną metodę ranking: user startuje ciąg porównań parami, przerabia wszystkie pary, a po pełnym przejściu algorytm (do ustalenia w `proto-lofi`/impl — np. insertion/merge sort albo ranking ELO) układa finalną kolejność. Zobowiązany ciąg — nie da się wyjść w połowie. Ranking **zostaje w module `capture`**. Dodać termin do `GLOSSARY.md`, akcję „Run Pairing" do `ACTIONS.md`, doprecyzować akcję „Rank Stressor" (ręcznie lub przez `Pairing`) i doprecyzować `rank` Stressora w `ENTITY_MAP.md`.

## Impact
- `GLOSSARY.md`: nowy wiersz `Pairing`.
- `ACTIONS.md`: nowa akcja „Run Pairing"; doprecyzowane „Rank Stressor".
- `ENTITY_MAP.md`: doprecyzowane `rank` Stressora (ustalany ręcznie lub przez `Pairing`).
- Parowanie wymaga ≥2 stresorów; ranking trywialny przy jednym.
