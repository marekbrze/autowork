# 0038 - Bug „Skipped tasks hang on Resume" diagnosed
**Date**: 2026-06-30
**Status**: Accepted

## Context
A bug report: after skipping tasks and leaving the session, Resume shows "3 of 3" — the skipped tasks "hang" (unavailable / look handled). The symptom persists despite the ADR 0034 fix (`2a0a7f7`), which itself foresaw in its Impact section *"resume-snapshot interaction with the restored-to-pending tasks"*.

## Decision
Diagnosed in `docs/changes/skipped-tasks-hang-on-resume.md`. Accepted model (user): **Resume unchanged** (where you left off; skips return on a fresh Start). Root cause: **logic** — `exit()` prematurely resets `skipped → pending` (`FocusView.tsx:290`) instead of leaving them deferred until Start (`:194`), creating `pending`-behind-the-cursor tasks unreachable on Resume and inconsistent with Dashboard-navigation; + the position indicator "3 of 3" (`:399`) misleads, counting deferred-behind as handled. Severity: 🟡 medium. Routes to **direct-edit** (2 edits: remove the early reset `:290`; a "deferred" indicator `:399` + `FocusTaskScreen`) + optionally `proto-polish` (copy) / `proto-edgecases` (skip × Resume lifecycle). Regression sites: `clearCompleted`/`onNewSession` (`:327`, `:429`), `attributed` (`:78-90`), `start` (`:194`).

## Impact
Fix implemented alongside the change-doc. Re-run proto-bug if the fix reveals a deeper cause.
