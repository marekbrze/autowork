# 0002 - Rotating prompt banner in the brain dump

**Date**: 2026-06-28
**Module**: capture
**Status**: Accepted

## Context
During `capture` module detailing the user described wanting "active prompts that help catch what it's about" in the brain dump — something that draws out stressors that slip away when emptying your head. Final shape: an **interactive, rotating banner** that changes every few seconds. This is a new element not in `ACTIONS.md` or `GLOSSARY.md`.

## Decision
Introduced **`PromptBanner`** — an interactive, rotating banner in the brain dump, changing every few seconds; suggests categories / stressor examples ("finances", "What about that loan payment?") and is clickable (pre-fills the field). Add the term to `GLOSSARY.md` and a "Pick prompt suggestion" action to `ACTIONS.md` (entity `Stressor`).

## Impact
- `GLOSSARY.md`: nowy wiersz `PromptBanner`.
- `ACTIONS.md`: nowa akcja „Pick prompt suggestion" w sekcji Stressor.
- Extends the brain dump with a layer of active help — reinforces the "don't leave the user with an empty list" promise.
