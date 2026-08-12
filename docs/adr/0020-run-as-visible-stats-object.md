# 0020 - Run as a visible object with stats (multiple runs)

**Date**: 2026-06-29
**Module**: run
**Status**: Accepted

## Context
`MODULES.md` originally framed the `run` module as a minimal MVP — "one active Run is enough", treated more as a silent persistence layer. During `run` detailing the user specified the opposite vision: a Run is a **visible, tangible object they manage consciously** — they see stats (time spent, done, left, progress), and **many runs live in parallel**, launched from the dashboard.

## Decision
Run = a visible object with stats (not a hidden single container). Many runs in parallel. Each Run carries stats: `timeSpent` (total time from focus — sum of `timerElapsed`), done (`completed + dismissed`), left, `progress` %. This **supersedes** the "MVP = one active Run" note in `MODULES.md`.

## Impact
- `MODULES.md`: the `run` entry expanded (multi-run, stats, archive); the minimalistic MVP framing removed.
- `ENTITY_MAP.md`: Run zyskuje atrybut `timeSpent`.
- `ACTIONS.md`: dodane `View Details / Stats`.
- `docs/modules/run.md`: utworzony (Vision, flow Create/Continue/Details).
