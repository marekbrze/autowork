# 0003 - Pairing as a stressor-ranking method

**Date**: 2026-06-28
**Module**: capture
**Status**: Accepted

## Context
In the docs, stressor ranking was a single action ("Rank Stressor") with no described mechanics. The user proposed a hybrid: by default, manually arranging the list, and optionally a **pairing process** — a committed series of pairwise comparisons ("which is more stressful: A or B?"), from which a "smart algorithm" arranges the final order. Goal: each decision is smaller (a pair vs the whole list) — in the spirit of "lift the burden of deciding".

## Decision
Introduced **`Pairing`** — an optional ranking method: the user starts a series of pairwise comparisons, goes through all the pairs, and after a full pass an algorithm (to decide in `proto-lofi`/impl — e.g. insertion/merge sort or an ELO ranking) arranges the final order. A committed series — you can't leave halfway. Ranking **stays in the `capture` module**. Add the term to `GLOSSARY.md`, a "Run Pairing" action to `ACTIONS.md`, refine the "Rank Stressor" action (manually or via `Pairing`), and refine the Stressor's `rank` in `ENTITY_MAP.md`.

## Impact
- `GLOSSARY.md`: nowy wiersz `Pairing`.
- `ACTIONS.md`: nowa akcja „Run Pairing"; doprecyzowane „Rank Stressor".
- `ENTITY_MAP.md`: refined the Stressor's `rank` (set manually or via `Pairing`).
- Pairing requires ≥2 stressors; ranking is trivial with one.
