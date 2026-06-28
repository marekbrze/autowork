# 0013 - atrybuty Taska opcjonalne (skip w procesowaniu)

**Date**: 2026-06-28
**Module**: process
**Status**: Accepted

## Context
`process` nadaje taskom `Context`, `Energy`, `EstimatedTime` — atrybuty, których `focus` używa do filtrowania sesji. Pytanie z detailing: czy można je pominąć (zostawić null)? W `dopadone` każdy krok można skipować (ADR 0012). U nas ryzyko: task bez kontekstu/energii nie wejdzie do filtra sesji.

## Decision
Atrybuty `context`, `energy`, `estimatedTime` są **opcjonalne (nullable)**. Skip (Esc) zostawia atrybut pusty — **nudge, nie bramka** (spójnie z ADR 0007). Konsekwencja: task bez danego atrybutu po prostu **nie kwalifikuje się** do sesji filtrowanych po tym atrybutze (Context/Energy); bez czasu → `focus` bez zadanego czasu (default timera). To świadomy wybór usera, nie błąd walidacji.

## Impact
- `ENTITY_MAP.md`: atrybuty Taska (`context`, `energy`, `estimatedTime`) oznaczone jako opcjonalne (nullable).
- `docs/modules/process.md`: skip udokumentowany w akcjach (`Skip attribute`) i edge cases.
- `ACTIONS.md`: `Skip attribute` dodane z odsyłką do tego ADR.
