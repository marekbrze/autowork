# 0004 - Undo przy usuwaniu stresora

**Date**: 2026-06-28
**Module**: capture
**Status**: Accepted

## Context
User podkreślił, że w brain dumpie musi być łatwo usuwać źle wpisane rzeczy — i że nawigacja / usuwanie ma być **z klawiatury** (Enter / strzałki / Backspace). Przy szybkim kasowaniu z klawiatury rośnie ryzyko wywalenia czegoś omyłkowo. Przyjęto decyzję o undo.

## Decision
Undo przy usuwaniu stresora **domyślnie włączone** (Ctrl+Z — przywraca ostatnio usunięty wpis). Zaktualizować akcję „Delete Stressor" w `ACTIONS.md` (dodać notkę o obsłudze klawiatury i undo).

## Impact
- `ACTIONS.md`: notka przy „Delete Stressor" — obsługa klawiatury (Backspace/Usuń) + undo (Ctrl+Z).
- Zmniejsza koszt omyłkowego usunięcia przy szybkim brain dumpie.
