# [0030] - dashboard prototype hardened

**Date**: 2026-06-29
**Module**: dashboard
**Status**: Accepted

## Context
The dashboard prototype (`DashboardView` + `DominantRunCard`) handled happy paths but not the edge cases surfaced by `proto-edgecases` (`docs/modules/dashboard-edgecases.md`, 6 gaps). Storage/error/destructive handling was already inherited and solid from the `run` module; the gaps were dashboard-specific.

## Decision
Implemented 4 edge-case states:
- **Completed dominant** — when the last-worked run is 100% done (not archived), the dominant card's primary CTA swaps from „Kontynuuj" to „Archiwizuj ten przejazd" (consistent with `RunDetails`' completed-run pattern; designer confirmed).
- **Double-click on „Start new"** — `useRef` guard prevents a second synchronous `createRun` from creating an orphan run.
- **Zero-task dominant** — a fresh run (`totalTasks === 0`) shows „Jeszce bez tasków — zacznij od brain dumpu" instead of a meaningless „0 z 0 … zostały 0" breakdown.
- **`lastActiveAt` tie-break** — secondary sort key (`createdAt` desc) makes dominant-card selection deterministic.

Deferred (with reasons):
- **Unbounded active-runs list** (#4) — lofi-acceptable; cap/pagination is a design-phase concern.
- **Archive entry hidden when 0 archived** (#5) — deliberate UX: hiding an empty link is cleaner than a dead link to an empty archive.

## Impact
The prototype now handles every flow path, not just the happy one. No model change (archive is an existing action). Visual polish remains a separate future `proto-design` pass. Re-run `proto-edgecases` for a fresh baseline if the prototype changes.
