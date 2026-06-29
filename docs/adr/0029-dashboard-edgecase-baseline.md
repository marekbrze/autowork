# [0029] - dashboard edge-case baseline

**Date**: 2026-06-29
**Module**: dashboard
**Status**: Accepted

## Context
The dashboard prototype (`DashboardView` + `DominantRunCard`) handled happy paths and inherited hardened storage/error handling from the `run` module, but had not been stress-tested for dashboard-specific edge cases.

## Decision
Audited into `docs/modules/dashboard-edgecases.md`. 6 gaps found (🔴 0 · 🟡 2 · 🟢 4). The module is a thin view layer over an already-hardened `run` module, so storage failure, read/write errors, and destructive-action confirmation are covered by inheritance; the genuine gaps are dashboard-specific. Top priorities: (1) completed run as dominant → misleading "Kontynuuj" primary CTA with no archive nudge; (2) double-click on "Start new" can create an orphan run.

## Impact
`proto-harden` will implement the priority list (gaps #1 and #2 first). Re-run `proto-edgecases` after the prototype changes to get a fresh baseline.
