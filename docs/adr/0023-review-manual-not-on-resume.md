# 0023 - Review ręczny, nie uruchamiany automatycznie przy resume

**Date**: 2026-06-29
**Module**: run
**Status**: Accepted

## Context
`ACTIONS.md` listowało akcję „Review on resume" — sugerując, że przegląd (co nadal aktualne vs do usunięcia) odpala się przy wznawianiu Runa. Pytanie z detailing: czy review ma być **bramką** wymuszoną przed wejściem w lejek, czy opcjonalny? Spójnie z filozofią „nudge, nie bramka" (ADR 0007) i osobą z ADHD/overwhelmed — przerwanie resume wymuszonym przeglądem dodaje tarcie.

## Decision
Review jest **wyłącznie ręczny** — user odpala go sam ze **Szczegółów**, kiedy chce posprzątać przeterminowane rzeczy (stresory / taski: relevant vs stale). **Nie** uruchamia się automatycznie przy Kontynuuj/resume — user ląduje prosto w kroku lejka. Nazwa akcji pozostaje `Review` (zamiast „Review on resume"), by nie sugerować automatycznego triggera.

## Impact
- `ACTIONS.md`: „Review on resume" → `Review` z notką „tylko ręcznie".
- `GLOSSARY.md`: `ReviewOnResume` doprecyzowane.
- `docs/modules/run.md`: flow Review (ręczny, ze Szczegółów).
