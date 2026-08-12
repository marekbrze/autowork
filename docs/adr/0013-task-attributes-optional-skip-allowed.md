# 0013 - atrybuty Taska opcjonalne (skip w procesowaniu)

**Date**: 2026-06-28
**Module**: process
**Status**: Accepted

## Context
`process` assigns tasks `Context`, `Energy`, `EstimatedTime` — attributes `focus` uses to filter the session. The detailing question: can they be skipped (left null)? In `dopadone` every step can be skipped (ADR 0012). Our risk: a task without context/energy won't enter the session filter.

## Decision
The `context`, `energy`, `estimatedTime` attributes are **optional (nullable)**. Skip (Esc) leaves the attribute empty — a **nudge, not a gate** (consistent with ADR 0007). Consequence: a task without a given attribute simply **doesn't qualify** for sessions filtered by that attribute (Context/Energy); without time → `focus` with no set time (the default timer). It's a conscious user choice, not a validation error.

## Impact
- `ENTITY_MAP.md`: atrybuty Taska (`context`, `energy`, `estimatedTime`) oznaczone jako opcjonalne (nullable).
- `docs/modules/process.md`: skip udokumentowany w akcjach (`Skip attribute`) i edge cases.
- `ACTIONS.md`: `Skip attribute` added with a reference to this ADR.
