# 0006 - next-actions written in active, concrete language

**Date**: 2026-06-28
**Module**: decompose
**Status**: Accepted

## Context
W `decompose` next-actiony są materiałem, który trafia na listę focus i ma być realnie wykonany. User podkreślił, że **akcje muszą być zapisane aktywnym językiem i być konkretne** — bo właśnie ogólne/vague sformułowania rodzą paraliż (główny driver apki dla osoby ADHD/overwhelmed).

## Decision
Przyjąć standard treściowy: każdy **NextAction zapisany aktywnym, konkretnym językiem** — czasownik na początku, fizycznie wykonalne („zrobisz to w jednym siadaniu"). App **modeluje ten styl w promptach i przykładach** (np. „zadzwoń do…", „wyślij…", „wpłać…"), ciągnąc usera ku konkretnym sformułowaniom — analogicznie do wzorca nudge (prompt + skip) z WHY i z `capture`.

## Impact
- `ACTIONS.md`: notka przy `Add NextAction` (aktywny/konkretny język) i przy `Decompose into Tasks` (prompt „Jak to możesz rozbić?" + skip = 1 task).
- `docs/modules/decompose.md`: zasada odzwierciedlona w wizji, flow (krok 3) i edge cases.
