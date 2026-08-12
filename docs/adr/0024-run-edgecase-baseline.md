# 0024 - run edge-case baseline

**Date**: 2026-06-29
**Module**: run
**Status**: Accepted

## Context
The `run` prototype (built in `proto-lofi`) handled happy paths and the basics (empty states, delete confirmations, a persistence toast, "not found" states), but it hadn't yet been systematically stress-tested for edge cases.

## Decision
An audit was run into `docs/modules/run-edgecases.md`. **16 gaps** found (🔴 0 · 🟡 9 · 🟢 7). The biggest group is the **architectural disconnection of the Run from real funnel data** (mock stats, `lastReachedStep` never advanced, review-items with no UI source) — CM-1/CM-2/CM-3. The remaining 🟡: a misleading empty-state on a storage read error (LE-1), rename-to-empty with no validation (FI-1), no celebration/nudge for completed Runs (ST-1), bulk-remove stale with no confirmation/undo (AO-2), no unsaved-rename guard (FI-2), no archive success feedback (AO-1).

## Impact
`proto-harden` will implement the priority list. First a **scope decision with the designer** is required for CM-1/2/3: wire real funnel-data derivation (cross-module), or leave the stats illustrative + mark them. After the prototype changes, re-run `proto-edgecases` for a fresh baseline.
