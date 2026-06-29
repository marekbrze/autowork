# [0027] - drop Compare runs from MVP

**Date**: 2026-06-29
**Module**: dashboard
**Status**: Accepted

## Context
`proto-deepen` surfaced "motywacja przez kontrast z poprzednimi przejazdami" as a dashboard value, and `MODULES.md` / `ACTIONS.md` listed a "Compare runs" action. During dashboard detailing, the user's stated motivator was consistently **progress momentum** ("głównie progres"); when asked about comparison, the user could not recall what it was meant to entail. The dashboard is Low priority / MVP-skippable.

## Decision
Remove "Compare runs" from MVP scope. The archive/history view is a **passive list** of archived runs with per-run stats (which invites informal comparison) but no dedicated compare UI. Comparison may be revisited post-MVP if motivation data later supports it.

## Impact
`ACTIONS.md` "View Dashboard" note updated (porównanie removed); `MODULES.md` dashboard description updated (porównanie przejazdów removed); `GLOSSARY.md` Dashboard term updated. Reversible — comparison can be re-added; this ADR records why it was deferred.
