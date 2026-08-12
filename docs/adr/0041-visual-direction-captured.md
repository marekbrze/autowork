# 0041 - visual direction captured (proto-brand)
**Date**: 2026-07-01
**Status**: Accepted

## Context
The prototype was a neutral lo-fi on shadcn defaults (pure-gray neutrals chroma 0, Geist Variable, `--radius: 0.625rem`, default light + dark stub). `proto-harden` done (ADR 0040). Before hi-fi (`proto-design`) a fixed visual direction was needed, so every choice wouldn't be re-litigated at the code. `UI-STRATEGY.md` already carried the designer's intent: arcade / retro-game, playful, joyful, cheerful-saturated, big buttons — but without specifics (register, scene→theme, seed hue, typography, motion).

## Decision
A `proto-brand` interview (3 rounds, one decision per question, in Polish) + synthesis from hard design standards → a direction recorded in `docs/DESIGN.md`:

- **Register**: **product** + arcade-personality (the Duolingo model — the task rules, arcade is the joyful voice, NOT brand-theatre). The key tension resolved: arcade TEMPTS with pixel fonts everywhere + rainbow, but product for ADHD = readable body, standard affordances, **zero colorful noise**.
- **Scene → theme**: light handheld-cheerful (Game Boy / Duolingo joy on a light background). The scene (ADHD, overwhelmed, daytime, paralysis → a joyful lift) forced LIGHT — dark/neon would overstimulate.
- **Personality**: **snappy, warm, rounded**. References (Things 3 + Forest) pulled toward joy with restraint/craft, not loud arcade.
- **Color strategy**: **Committed** — one saturated green (~oklch hue 149) carries 30–60% of the surface; canvas + body calm tinted-near-white. ONE accent. Neutrals tinted with chroma 0.004–0.022 toward hue 150 (NOT the default-warm hue 60 = AI cream/sand).
- **Typography**: a rounded chunky sans workhorse (**Nunito**, replaces Geist) + a pixel face (**Press Start 2P**) ONLY in signature moments (celebration/hero) — NEVER in UI labels/buttons/data.
- **Motion**: state-only default (150–250ms) + 3 earned signature moments (celebrcja payoff, tactile press, task transition); `prefers-reduced-motion` fallback.
- **Dark mode**: NIE target (scene = light). Stub `.dark` zostaje, nie aktywny.

Anti-refs (mandatory): AI slop blue-violet SaaS, harsh red alarm/countdown, rainbow category clutter, synthwave neon-on-black.

## Impact
- `proto-design` implements the direction per module, reading `docs/DESIGN.md`. Highest-leverage first step: replace the neutral baseline (pure grays → green-tinted neutrals; `--primary` black → brand green; Geist → Nunito).
- Module order: tokens globally → `focus` (payoff + celebration + timer) → `capture` (tone) → `process` → `decompose` → `run` → `dashboard`.
- `proto-polish` = the final pass (including verifying the contrast floor: muted-foreground/placeholder ≥4.5:1 on tinted near-white — the most common failure).
- To change the direction: edit `docs/DESIGN.md` or run `proto-brand` again.
