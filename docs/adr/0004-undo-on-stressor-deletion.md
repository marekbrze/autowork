# 0004 - Undo przy usuwaniu stresora

**Date**: 2026-06-28
**Module**: capture
**Status**: Accepted

## Context
The user stressed that in the brain dump it must be easy to delete mistyped things — and that navigation / deletion should be **from the keyboard** (Enter / arrows / Backspace). With fast keyboard deletion the risk of accidentally removing something grows. An undo decision was adopted.

## Decision
Undo on stressor deletion **enabled by default** (Ctrl+Z — restores the most recently deleted entry). Update the "Delete Stressor" action in `ACTIONS.md` (add a note about keyboard handling and undo).

## Impact
- `ACTIONS.md`: a note by "Delete Stressor" — keyboard handling (Backspace/Delete) + undo (Ctrl+Z).
- Lowers the cost of an accidental deletion during a fast brain dump.
