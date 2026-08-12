# 0005 - add motivation material to decompose (WHY half)

**Date**: 2026-06-28
**Module**: decompose
**Status**: Accepted

## Context
During `decompose` module detailing the user described it as an answer to two questions: WHY a stressor matters to them and HOW to push it forward. The existing docs (`ENTITY_MAP`, `ACTIONS`, `GLOSSARY`) covered only HOW (`NextAction` → `Task`). The WHY half was missing — motivational material the user creates for each stressor and that should come back later (e.g. in `focus`) as a reminder "why you're doing this".

The user refined the shape of this material: there can be several reasons, each with a **valence** — positive (gain) or negative (pain avoidance); additionally there can be a **positive outcome vision** (the done state). The user enters the material, but the app can guide; the block is shown for each stressor, optional/skippable.

## Decision
Introduce motivational material (`Motivation`) in `decompose`:
- a new entity **`Reason`** — why a stressor matters, with a **`valence`** attribute: `positive` (gain) | `negative` (pain avoidance); 0..N per stressor;
- a **`doneVision`** attribute on `Stressor` — optional (0..1), a vivid vision of the done state (text + emoji);
- a WHY block shown for each stressor, **optional/skippable** (a nudge, not a gate — consistent with `capture`);
- consumed later in `focus` (surfaced e.g. on a hard task).

## Impact
- `ENTITY_MAP.md`: added the `Reason` entity (relation `Stressor ||--o{ Reason`), the `doneVision` attribute on `Stressor`, the `Valence` / `DoneVision` value types.
- `ACTIONS.md`: nowa sekcja `Motivation` (Add Reason, Add DoneVision, Skip motivation).
- `GLOSSARY.md`: terms `Motivation`, `Reason`, `Valence`, `DoneVision`; updated `decompose` module description.
- `MODULES.md`: `decompose` entities and description expanded with WHY; a motivation → focus edge in the integration map.
- `decompose` gains a second function: not only does it produce tasks, it **stores motivational fuel** for `focus`.
