# [0052] - Run clickable-steps feature hardened (CS-1, CS-3)
**Date**: 2026-07-01
**Module**: run
**Status**: Accepted

## Context
The clickable-steps feature (ADR 0047/0048) edge baseline (ADR 0049) routed two items to `proto-harden`: **CS-3** (the focus-session-leave guard could over-trigger in the rare safeguard state where `screen === 'session'` but the task vanished) and **CS-1** (the guard fires only on stepper clicks, not browser-back / reload / header nav). The rest of `run` was already hardened (ADR 0025 base + per-run-isolation feature).

## Decision
**CS-3**: gated the guard on `currentTask` — now `screen === 'session' && currentTask && running` (`FocusView.tsx:413`); over-trigger eliminated. **CS-1**: accepted the audit's recommendation — the guard stays **stepper-only** (the session snapshot persists per-Run regardless of exit path, so leaving via back/reload/header is silent but lossless and resumable via `SessionResumeBanner`); documented as the decided behavior in `run.md` Edge Cases. Extending the guard to all leave-paths (react-router history-blocking / `beforeunload`) deferred — fragile and not MVP-justified.

## Impact
The feature's two open harden items are closed: CS-3 ✅ implemented, CS-1 ✅ accepted + documented. CS-2 was already resolved in `proto-polish` (ADR 0050); CS-4/5/6 stay deferred (design/polish, not harden). No new UI states or stories — these were a guard refinement and a scope decision, not missing states. Happy paths unchanged. Re-run `proto-edgecases` for a fresh baseline if the feature evolves.
