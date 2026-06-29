# [0028] - add lastActiveAt to Run for launcher ordering

**Date**: 2026-06-29
**Module**: dashboard
**Status**: Accepted

## Context
The dashboard's dominant card is the run the user **last worked on**, not the most recently created. The `Run` entity has `lastReachedStep` (for resume routing) and a creation timestamp (baked into the default name), but no marker of when it was last active/touched. The launcher needs to order active runs by recency of work to pick the dominant card and sort the smaller cards.

## Decision
Add `lastActiveAt` (`datetime`) attribute to `Run`, stamped whenever the user does work inside that run (capture/decompose/process/focus activity, Continue). Active runs are ordered by `lastActiveAt` desc; the dominant dashboard card = `max(lastActiveAt)`.

## Impact
`ENTITY_MAP.md` Run entity updated — new attribute added to the mermaid block and the attributes list. Implementation must stamp `lastActiveAt` on relevant actions; in the prototype, stats/timestamps are mock (per `run.md` "statystyki poglądowe" edge case) until cross-module integration. Cross-references ADR 0026 (dominant card).
