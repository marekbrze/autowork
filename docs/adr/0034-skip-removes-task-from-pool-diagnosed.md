# 0034 - Bug „Skip removes task from pool" diagnosed
**Date**: 2026-06-30
**Status**: Accepted

## Context
A bug report: skipping a focus task removes it from the available pool — behaving like Dismiss („Not relevant") instead of the intended temporary deferral (*„nie teraz, wrócę przy następnej sesji"*). Needed a root-cause diagnosis before fixing.

## Decision
Diagnosed in `docs/changes/skip-removes-task-from-pool.md`. Root cause: **logic** — the pool (`attributed`, `FocusView.tsx:79`) admits only `state === 'pending'`, and the only restore path (`returnSkippedToPool`, `:270-272`) is wired to three specific buttons (`exit`/`clearCompleted`/`onNewSession`). Every other way back to the filter — navigate to Dashboard (unmount, `App.tsx:41`), refresh, abandon snapshot, exhaust-then-leave — never resets, so skipped tasks stay `skipped` and vanish from the pool permanently. Severity: 🔴 high (silent loss of access to tasks on a core action; collapses the Skip/Dismiss distinction, ADR 0017). Routes to a **direct-edit plan** (3 edits in `FocusView.tsx`: `:79`, `:91`, `:182`) — make the pool treat `skipped` as available and restore `skipped → pending` at the start of each new session. Regression sites: `SessionFilter.tsx:84-99`, `matchCount`/`start` (`:105,182`), dashboard stat tiles (`stats.ts`); redundant-but-harmless existing reset calls at `:277,314,416`.

## Impact
The fix is implemented from the change doc. Re-run proto-bug if the fix reveals a deeper cause (e.g. resume-snapshot interaction with the restored-to-pending tasks).
