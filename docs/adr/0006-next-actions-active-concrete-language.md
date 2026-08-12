# 0006 - next-actions written in active, concrete language

**Date**: 2026-06-28
**Module**: decompose
**Status**: Accepted

## Context
In `decompose`, next-actions are the material that lands on the focus list and is meant to be really executed. The user stressed that **actions must be written in active language and be concrete** — because general/vague phrasings are exactly what breeds paralysis (the app's main driver for an ADHD/overwhelmed person).

## Decision
Adopt a content standard: every **NextAction written in active, concrete language** — a verb up front, physically doable ("you can do it in one sitting"). The app **models this style in prompts and examples** (e.g. "call…", "send…", "pay in…"), pulling the user toward concrete phrasings — analogous to the nudge pattern (prompt + skip) from WHY and from `capture`.

## Impact
- `ACTIONS.md`: a note by `Add NextAction` (active/concrete language) and by `Decompose into Tasks` (the "How can you break this down?" prompt + skip = 1 task).
- `docs/modules/decompose.md`: zasada odzwierciedlona w wizji, flow (krok 3) i edge cases.
