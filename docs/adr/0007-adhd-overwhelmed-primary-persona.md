# 0007 - ADHD / overwhelmed as primary design persona

**Date**: 2026-06-28
**Module**: cross-cutting
**Status**: Accepted

## Context
Podczas detailing `decompose` user doprecyzował odbiorcę: **osoba z ADHD jest głównym odbiorcą**, a oprócz niej każdy **overwhelmed** (przytłoczony). Do tej pory `PROJECT.md` opisywał target jedynie jako „autor projektu / przytłoczony zadaniami", bez wyciągnięcia konsekwencji projektowych z konkretnej neurotypowości.

## Decision
Take **ADHD / overwhelmed** as the primary design persona and document the consequences:
- a large task paralyzes → **we break it into small ones**;
- prowadzimy **promptami (nudge), nie zmuszamy**;
- **motivation = fuel**, which returns in a hard moment (`focus`).

Single-user / local stays unchanged — it's still the author's personal tool.

## Impact
- `PROJECT.md`: the *Target Users* section expanded with the persona; new entries in *Decisions*.
- The design direction of all Core modules (especially `decompose`, `process`, `focus`) is tuned for this persona.
