# 0023 - Manual Review, not triggered automatically on resume

**Date**: 2026-06-29
**Module**: run
**Status**: Accepted

## Context
`ACTIONS.md` listed a "Review on resume" action — suggesting the review (what's still current vs to remove) fires on resuming a Run. The detailing question: should review be a forced **gate** before entering the funnel, or optional? Consistent with the "nudge, not a gate" philosophy (ADR 0007) and an ADHD/overwhelmed person — interrupting resume with a forced review adds friction.

## Decision
Review is **manual only** — the user runs it themselves from **Details**, when they want to clean up stale items (stressors / tasks: relevant vs stale). It does **not** fire automatically on Continue/resume — the user lands straight in the funnel step. The action name stays `Review` (instead of "Review on resume"), so it doesn't suggest an automatic trigger.

## Impact
- `ACTIONS.md`: "Review on resume" → `Review` with a "manual only" note.
- `GLOSSARY.md`: `ReviewOnResume` doprecyzowane.
- `docs/modules/run.md`: the Review flow (manual, from Details).
