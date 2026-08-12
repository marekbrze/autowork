# 0056 - Feature decompose task-status indicator planned
**Date**: 2026-07-02
**Status**: Accepted

## Context
A feature request on the living system: on the **Next actions** screen (`decompose`, the HOW block) the user wants to see that a task has already been marked `completed` (done) or `dismissed` (irrelevant) — because today every task renders as a bare bullet regardless of state. It needed impact scoping before implementation.

## Decision
Zaplanowane w `docs/changes/decompose-task-status-indicator.md`.

- **Scope (confirmed with the user):** read-only (no state change from `decompose`); only `completed` + `dismissed`; a `{resolved}/{total} done` progress counter by the next-action + de-emphasis of a fully handled next-action.
- **Module:** extends **only `decompose`**. `NextActionItem` **already receives full `Task` objects with `state`** — the field is in the data, it's just not displayed.
- **New module:** no.
- **Cross-module:** brak nowej integracji — czysty odczyt istniejącego pola (stan ustawiają `focus`/`run`; ten sam byt `Task`).
- **MVP:** 3 points; deferred: state-change actions from decompose, the `skipped`/`active` states, hi-fi (decompose is still neutral).
- **Routing:** `proto-detail decompose` (light) → **a residual direct-edit in `NextActionItem.tsx`** (the core) → `proto-edgecases` → `proto-harden` (mainly a11y); `proto-design`/`polish` deferred to decompose's hi-fi.
- **Residual:** 1 plik (`NextActionItem.tsx`) — znacznik stanu taska + licznik + de-emphasis.

Niskie ryzyko — cienki, read-only slice na jednym komponencie.

## Impact
`proto-detail`/`edgecases`/`harden` work off the plan; the residual edit implements the core. A DESIGN.md constraint: `dismissed` is neutral (anti-ref "harsh red alarm"), one accent. Re-run `proto-feature` if the scope changes (e.g. adding a state-change action or the skipped/active states).
