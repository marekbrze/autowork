# [0051] - Hi-fi design applied to run
**Date**: 2026-07-01
**Module**: run
**Status**: Accepted

## Context
`run` sat at harden-level on the project-wide token layer (ADR 0041 brand, ADR 0042 focus hi-fi — tokens + type + motion already in place). Its screens were functional and token-based but un-designed: a hardcoded **emerald** drift (DESIGN.md: success = the single brand green, no separate green) and an un-celebrated `RunCompleted` (run's earned payoff moment, DESIGN.md motion #1).

## Decision
Applied the **existing** OKLCH token layer + component vocabulary to `run` — no new direction, no token-layer change. Fixed hardcoded-color drift system-wide (2 emerald instances → brand tokens): `RunStatTiles` progress fill now always `bg-primary` (success = brand green; completion is signaled by the celebration block, not a second green); `RunDetails` "Completed" badge → `bg-brand-300 text-brand-700`. Delivered the earned **`RunCompleted` celebration**: `bg-brand-300/60` wash + `border-brand-400/50`, `CheckCircle2` in `brand-700`, Nunito extrabold heading, `animate-celebrate` scale-in (global `prefers-reduced-motion` fallback applies); pixel face intentionally **not** used (reserved for `focus`). Stat-tile values bumped to `font-bold` (data presence). `ActiveRunChip` (`bg-brand-400`), `RunCard`, `ArchivedRuns` were already on-brand — left intact. Register: product; light-only (DESIGN.md).

## Impact
`run` is on-brand hi-fi; **no functional change** (interactions / data / edge-case states preserved). Token layer unchanged — project-wide, carries to other modules. `proto-polish` is the final pass (audit item CS-3 guard still open). Re-run `proto-audit` later for a fresh baseline on evolved code.
