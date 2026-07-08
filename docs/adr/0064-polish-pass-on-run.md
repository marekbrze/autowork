# 0064 - Polish pass on run (estimated-time totals + accuracy)
**Date**: 2026-07-08
**Module**: run
**Status**: Accepted

## Context
The `run` module was designed (ADR 0041/0051) and functionally complete + hardened (ADR 0063). Pre-ship polish on the estimated-time-totals feature surfaces + the deferred **ET-3** (a11y of the "—" tile).

## Decision
**Design-system alignment verified first** — the new surfaces (`RunStatTiles` 4th tile + sub-line, `DominantRunCard` segment, `SessionFilter` match line) already reuse neighboring class patterns (`text-sm text-muted-foreground tabular-nums`, `font-medium text-foreground`), `formatMinutes` is in `shared`, all numerics use `tabular-nums`, colors are tokens, contrast sits on the brand `--muted-foreground` floor. **No drift to resolve.** Then polished:

- **ET-3 (a11y)** — the "estimated" tile gets `title="No time estimates yet"` in its "—" state (hover tooltip + SR context for the ambiguous dash); `title={undefined}` when it has a value, so the tooltip appears only where it's needed.
- **Accuracy** — removed the stale user-facing caption "Live stats … per-run breakdown comes later" in `RunStatTiles` (false since ADR 0044 shipped per-run isolation; the per-run re-audit had explicitly called for removing it), and corrected stale "global / per-run-deferred (ADR 0020)" code comments across `run/stats.ts`, `run/types/run.ts`, `RunTaskList.tsx`, `scenarios/data/run.ts`.

Quality bar: match the module's existing hi-fi (ADR 0051) — restrained, no new direction, no new components. No genuine design-system ambiguities encountered (so none escalated to the designer).

## Impact
The estimated-time surfaces ship clean and accurate. ET-3 closed → **all 3 estimated-time gaps (ET-1/2/3) resolved**. Stale per-run-deferred copy/comments cleaned up. `tsc` + `eslint` clean. The app does everything it did before — only more precise. Re-run `proto-audit` later for a fresh baseline on evolved code.
