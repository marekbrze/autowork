# 0007 - ADHD / overwhelmed as primary design persona

**Date**: 2026-06-28
**Module**: cross-cutting
**Status**: Accepted

## Context
Podczas detailing `decompose` user doprecyzował odbiorcę: **osoba z ADHD jest głównym odbiorcą**, a oprócz niej każdy **overwhelmed** (przytłoczony). Do tej pory `PROJECT.md` opisywał target jedynie jako „autor projektu / przytłoczony zadaniami", bez wyciągnięcia konsekwencji projektowych z konkretnej neurotypowości.

## Decision
Uznać **ADHD / overwhelmed** za główną personę projektową i dokumentować konsekwencje:
- duże zadanie paraliżuje → **rozbijamy na małe**;
- prowadzimy **promptami (nudge), nie zmuszamy**;
- **motywacja = paliwo**, które wraca w trudnym momencie (`focus`).

Single-user / lokalne pozostaje bez zmian — to wciąż osobiste narzędzie autora.

## Impact
- `PROJECT.md`: sekcja *Target Users* rozszerzona o personę; nowe wpisy w *Decisions*.
- Kierunek projektowy wszystkich modułów Core (zwłaszcza `decompose`, `process`, `focus`) strojony pod tę personę.
