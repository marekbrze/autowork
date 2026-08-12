# 0008 - Capture edge-case baseline
**Date**: 2026-06-28
**Module**: capture
**Status**: Accepted

## Context
The `capture` module prototype (brain dump + ranking + pairing) handled happy paths, but it hadn't been stress-tested for edge cases. The module is the app's entry point (first contact with the "lift the burden of deciding" promise), so gaps in non-happy state handling hurt most. `proto-detail` left the systematic audit for later — `proto-edgecases` does it.

## Decision
Przeprowadzono systematyczny stress-test (checklist kategorii: data states, forms, action outcomes, state transitions, loading, errors, navigation, cross-module/lifecycle, prototype-specific LocalStorage). Wynik w `docs/modules/capture-edgecases.md`. Znaleziono **15 luk**: 🔴 2 · 🟡 9 · 🟢 4.

Top priorities (to implement via `proto-harden`):
1. **Silent LocalStorage write/read loss** (quota/disabled + corrupt JSON) — `use-local-storage.ts` only `console.error`/falls back to `[]`; the UI lies that it saved, or silently zeros the data.
2. **Stressors not scoped to a Run** — "Start a new Run" shows the previous run's data, no reset (the `run` module isn't implemented).
3. **Loss of entered data** — the draft is lost on "Next"; undo unavailable via Ctrl+Z (contrary to ADR 0004), only a 6-second toast.
4. **Ranking blocked on touch** (HTML5 DnD doesn't work on mobile, no ↑↓ buttons on the screen).

The biggest source of gaps: the LocalStorage persistence layer (silent write and parse failures) — it's the prototype's "backend" and the most fragile part.

## Impact
`proto-harden` implements the priority list, confirming/overriding each suggested behavioral decision with the designer. After the prototype changes, re-run `proto-edgecases` to refresh the baseline (new code = new edge cases).
