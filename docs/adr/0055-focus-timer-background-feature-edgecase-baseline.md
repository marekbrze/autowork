# 0055 - Focus timer background feature edge-case baseline

**Date**: 2026-07-02
**Module**: focus
**Status**: Accepted

## Context
A re-audit after implementing the ADR 0053/0054 feature (timestamp-based timer + Web Worker + Wake Lock + resync + time in `document.title`). The focus module was already edge-cased + hardened twice (original: ADR 0018/0019; session-queue: re-audit 2026-07-01) — this pass covers **only the new behaviors**.

## Decision
The audit is attached as a new section in `docs/modules/focus-edgecases.md` ("Re-audit: timer background keep-alive + tab title feature"). **6 gaps**: 🔴 0 · 🟡 1 · 🟢 5. Top priority: **FT-1** — the timer reset keyed on the value of `initialElapsed` instead of the task's identity; in multi-tab of the same session it rolls the timer back (a flush from tab A → `storage` event → reset in B). The rest: FT-2 (a clock-change clamp), FT-3 (verify the Worker after deploy), FT-4/FT-5 (documented best-effort/per-Run limitations), FT-6 (an affordance deferred in the plan).

## Impact
The feature is robust (no 🔴, no new UI states — fallbacks degrade silently). The real change is **FT-1/FT-2** (logic → a residual direct-edit, not a classic `proto-harden`). `proto-harden` is optional / no key work. Re-run `proto-edgecases` after FT-1 to refresh the baseline.
