# 0044 - Feature: per-Run funnel isolation (planned)

**Date**: 2026-07-01
**Status**: Accepted

## Context
A feature request (surfaced as a bug in ADR 0043 / `docs/changes/runs-share-funnel-data.md`): every Run should own its own stressors and tasks, but creating a new Run shows the previous Run's data. The funnel data layer is global with no `runId` and no active-Run concept — a documented deferral (ADR 0020). The user confirmed they want true per-Run isolation.

## Decision
Planned in `docs/changes/per-run-funnel-isolation.md`. Affects **all 6 modules** (run primary; capture/decompose/process/focus re-scoped; dashboard wires Create/Continue). **New module: no.** The riskiest integration: the funnel gains coupling to `run` (today zero) via an active-Run concept.

MVP (confirmed with user): **full funnel isolation** (stressors, tasks, next-actions, reasons, done-visions, focus session/order) + **dashboard-driven active-Run switching** (set on Create/Continue, no new UI) + **per-Run stats** + **cascade delete** + **migration seeding existing data into the most-recent Run**. Deferred: in-funnel Run switcher, compare runs (ADR 0027), export.

Tech decision (mine): **Design B** — `runId` field on ownable entities + in-memory filtering by `activeRunId` inside the funnel hooks. Chosen over Design A (key-per-run) because the existing `useLocalStorage` reads its key once per mount (`use-local-storage.ts:24-34`), so a dynamic key on Run-switch would need storage-hook changes or remounts; Design B is reactive without them. Trade-off accepted: global arrays hold all Runs (localStorage grows), delete filters.

## Impact
**Inverts the typical order — this feature is data-layer-led.** Step 0 (residual direct-edits: `runId` on entities, `run:active` store + context, hook re-scoping, per-Run stats in `useLiveRuns`, cascade delete, migration) goes FIRST as the foundation everything depends on. Then: `proto-detail run` (spec + ACTIONS/ENTITY_MAP/GLOSSARY), `proto-lofi run` (header active-Run chip wiring, Create/Continue set active), `proto-edgecases run`, `proto-harden run`, `proto-design/polish run`. Regression surface: every reader of funnel data across all modules + scenarios + Storybook fixtures. Re-run `proto-feature` if scope changes.
