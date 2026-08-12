# 0016 - focus-timer-countup-model

**Date**: 2026-06-28
**Module**: focus
**Status**: Accepted

## Context
During `focus` module detailing the user described the timer as **counting up from 0:00**, where `EstimatedTime` is a threshold past which the counter turns red. This contradicts the previously recorded model (PROJECT / ENTITY_MAP / ACTIONS / GLOSSARY): counting down from `EstimatedTime`, then counting up after zero. For an ADHD/overwhelmed persona a count-up is gentler — it measures time spent, it doesn't create "time is running away" pressure.

## Decision
Adopted **model B**: the timer counts **up from 0:00**; a task's `EstimatedTime` is a threshold past which the counter renders red (the `overtime` state). The count-down model is dropped. `timerElapsed` (per Task, persisted) is simply the counter value — a simplification of the semantics.

## Impact
- `ENTITY_MAP.md`: a description of the `Timer` entity and its states (`overtime` = `timerElapsed` > `EstimatedTime`), the `timerElapsed` semantics.
- `ACTIONS.md`: the Timer action "keeps counting up after zero" → "counts up, red past the estimate".
- `GLOSSARY.md`: definicja `Timer`.
- `PROJECT.md`: Happy Path krok 6 + Decisions.
