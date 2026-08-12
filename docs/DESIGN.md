# Design Direction

> Direction for `proto-design`. Every value here is defensible and follows from the interview with the designer.
> Stack: React + Vite + TS + Tailwind v4 + shadcn/ui (base-nova). The token layer = `:root` in `src/index.css` (Tailwind v4 `@theme inline` maps them onto classes). This is the baseline that `proto-design` replaces.

## Register
**product** — a tasks app (funnel: brain dump → ranking → decompose → process → focus → celebration). Design serves the task. Arcade/retro-game/joyful is the **personality** layered on top of the product (the Duolingo model), NOT brand-theatre.

## Scene
A person with ADHD, overwhelmed and frozen, **during the day / in the morning, in bright light, at a desk** — they need the app to cheerfully pull them out of paralysis and turn "I don't know where to start" into a game with clear rules. This forced a **LIGHT mood** (handheld-cheerful, Game Boy / Duolingo in the light): gentler on tired attention, better for reading tasks under a timer. Darkness/neon would overstimulate; brightness lifts the overwhelm.

## Personality
**brisk, warm, round.** Brisk (arcade energy, forward motion), warm (green + joy, not cold tech), round (chunky rounded forms — buttons, sans, radius). The references (Things 3 + Forest) pulled this toward **joy with restraint/craft**, not loud arcade — so "brisk" means zipping forward, not shouting.

## References
- **Things 3**: calm product-craft — shows how to be playful without noise. Generous whitespace, a precise spacing rhythm, tinted neutrals done right. This is our model of *restraint under joy*.
- **Forest / pomodoro-reward apps**: focus-timer + reward loop. Celebration = the reward (like our "Clear completed"). A gentle, not loud payoff.

## Anti-references
- **AI slop: blue-violet gradient productivity SaaS**: glassmorphism, gradient mesh, a linear clone with no craft. A generic "which AI made this" look. A fortress to avoid.
- **Harsh red alarm / countdown timer**: pushy, stressful — the opposite of calm-through-joy. Our timer is NOT an alarm.
- **Rainbow "category color" clutter**: colorful noise = overwhelm = exactly what we're fighting for a person with ADHD. ONE accent.
- **Synthwave neon-on-black**: we chose LIGHT — dark-neon arcade is off-theme.

## Color
**Strategy**: **Committed** — one saturated green carries 30–60% of the surface (buttons, primary actions, progress, accents), but the canvas + body stay calm tinted-near-white. ONE accent. Differentiated semantics (success = brand green + a ✓ glyph, not a separate green).
**Seed hue**: **green, oklch hue ~149** — "go / progress / done", maps perfectly onto the task funnel; joyful and calming at the same time (Duolingo / Game Boy green).

### Palette (OKLCH)

| Role | Token | Value | Notes |
|------|-------|-------|-------|
| Primary (button solid, white fg) | `--primary` | `oklch(0.55 0.16 149)` | green; primary buttons ALWAYS bold (→ floor 3:1). If text on green ends up non-bold → use `--brand-700`. |
| Primary foreground | `--primary-foreground` | `oklch(0.99 0.02 150)` | near-white, faint green tint |
| Brand/500 (identity, accent on light) | `--brand-500` | `oklch(0.68 0.17 149)` | canonical cheerful green; accents/fills with dark text |
| Brand/600 (hover, secondary green) | `--brand-600` | `oklch(0.60 0.16 149)` | hover state for primary |
| Brand/700 (pressed, deep, safe-for-text) | `--brand-700` | `oklch(0.50 0.15 150)` | white text ≥4.5:1; use when green carries non-bold text |
| Brand/400 (soft accent) | `--brand-400` | `oklch(0.82 0.10 149)` | chips, selected states |
| Brand/300 (bg tint) | `--brand-300` | `oklch(0.92 0.05 150)` | subtle green wash on sections |
| Canvas (body bg) | `--background` | `oklch(0.99 0.008 150)` | near-white, faintly green — NOT warm cream (hue 60) |
| Surface (card) | `--card` | `oklch(1.00 0.004 150)` | a cleaner white than canvas → subtle elevation |
| Popover | `--popover` | `oklch(1.00 0.004 150)` | + soft shadow |
| Muted | `--muted` | `oklch(0.965 0.010 150)` | green-tinted neutral |
| Muted foreground | `--muted-foreground` | `oklch(0.50 0.022 150)` | placeholder/secondary text — ≥4.5:1 on canvas (verify in the polish pass) |
| Accent (highlight wash) | `--accent` | `oklch(0.95 0.03 150)` | light green wash on hover/list-highlight |
| Accent foreground | `--accent-foreground` | `oklch(0.30 0.05 150)` | |
| Secondary | `--secondary` | `oklch(0.965 0.012 150)` | neutral-ish secondary surface |
| Secondary foreground | `--secondary-foreground` | `oklch(0.30 0.020 150)` | |
| Border | `--border` | `oklch(0.91 0.012 150)` | full hairline, green-tinted |
| Input | `--input` | `oklch(0.91 0.012 150)` | |
| Ring (focus) | `--ring` | `oklch(0.58 0.16 149)` | focus ring = brand green (brand-600) |
| Ink (body text) | `--foreground` | `oklch(0.26 0.020 150)` | deep green-tinted charcoal, not pure black |
| Semantic/success | `--success` | `oklch(0.62 0.16 150)` | = brand green; differentiate with a ✓ glyph, not a separate green |
| Semantic/warning | `--warning` | `oklch(0.80 0.14 80)` | warm gold; timer-over-threshold = this/gentle coral, NOT harsh red |
| Semantic/destructive | `--destructive` | `oklch(0.60 0.19 27)` | warm coral-red (not an alarm); `--destructive-foreground` white |
| Semantic/info (rare) | `--info` | `oklch(0.65 0.10 230)` | muted teal, low chroma; single-user MVP → almost unused |

**Neutrals**: tinted with chroma **0.004–0.022** toward hue **150** (green) — NOT default-warm (hue 60, AI cream/sand). An 11-step scale mapped onto the shadcn tokens above.
**Surfaces / elevation**: LIGHT → depth through **a lighter card on a tinted canvas + soft shadow**, NOT through a darker surface (that's dark-mode logic). 2 levels: card (canvas-level), popover (elevated + shadow).
**Dark mode**: the SCENE doesn't require it (a light handheld-cheerful was chosen). The existing `.dark` stub in `index.css` stays, but it's NOT a target. If added later: a surface-lightness depth scale [15/20/25%] hued toward brand green, accents slightly desaturated, body weight −1.
**Radius**: a single `--radius: 0.75rem` (base, chunky-rounds forms). Primary CTA "big buttons" can go **pill** (`rounded-full`) for emphatic actions. Variants computed from the base (as today: sm/md/lg/xl…).
**Focus ring**: brand green (`--ring`), 2px offset, always visible on keyboard nav.

## Typography
**Direction**: one well-tuned rounded chunky sans as the workhorse (body/UI/data/buttons) + **one pixel/display face ONLY in signature moments** (celebration, hero). Replaces the neutral Geist.
**Family/ies**:
- **Workhorse — Nunito** (rounded grotesque, weights 400/600/700/800). Warm, round, full body legibility — it brings arcade warmth through roundness without a pixel face. Rejects the reflex that "tech = cold neutral grotesk (Geist/Inter)". Metric-matched fallback: a system rounded sans (`-apple-system, "Segoe UI", system-ui, sans-serif`).
- **Pixel signature — Press Start 2P** (classic arcade pixel) — **ONLY** short (≤4 words), large (≥24px) display text: the celebration "LEVEL UP!" / session-complete banner. Rejects the reflex that "monospace = lazy technical". A more legible alternative if needed: VT323 / Pixelify Sans. **NEVER** in UI labels, buttons, data, body, or in the timer if it risks ambiguous digits.
**Scale** (product, fixed rem, ratio ~1.125–1.2):
| Token | rem | Use |
|---|---|---|
| xs | 0.75 | meta/labels |
| sm | 0.875 | secondary text |
| base | 1.0 | body |
| lg | 1.125 | lead |
| xl | 1.25 | subsection heading |
| 2xl | 1.5 | card heading |
| 3xl | 1.875 | screen heading |
| 4xl | 2.25 | display heading (Fredoka/Nunito 800) |
| 5xl | 3.0 | celebration hero (pixel or Nunito 800) |
**Weights**: 400 (body) · 600 (UI emphasis) · 700 (buttons/headings) · 800 (display). ≤4. ✓
**Loading**: `font-display: swap`; preload only the critical weight (Nunito 400 + 700); a metric-matched fallback (the fallback should have a similar x-height/width → minimal layout shift).
**Details**: `tabular-nums` in data and the timer; measure 65–75ch for prose; line-height 1.5–1.6 body, 1.1–1.2 display; chunky buttons → min-height ≥44px (a11y touch) + bold.

## Motion
**Default**: 150–250ms, ease-out, **state-only** (hover/focus/active/open-close/route transition) — no choreography.
**Earned signature moments** (arcade + reward loop justify these 3):
1. **Celebration payoff** (SessionSummary / "Clear completed" / session complete / "LEVEL UP") — joyful choreography: scale-in + bouncy/confetti, 400–600ms, a custom spring. **THE motion moment** of the whole funnel.
2. **Tactile press** of buttons — chunky primary buttons `scale(0.96–0.98)` on `:active`, ~100ms, snappy — joystick-feel.
3. **Task transition in focus** (Done → next task) — a snappy slide/scale, ~200ms, game-like.
**reduced-motion**: all signature moments collapse to instant/short fade; respect `prefers-reduced-motion: reduce`.

## Guardrails
**Absolute bans** (match-and-refuse — if a screen needs these, the direction is wrong):
- Side-stripe borders (`border-left/right > 1px` as a colored accent) → full hairline, bg tints, or a leading glyph.
- Gradient text (`background-clip: text`) → one solid color; emphasize with weight/size.
- Glassmorphism as a default → rare and deliberate, or none.
- Hero-metric template, identical card grids, tiny uppercase tracked eyebrows above every section, `01/02/03` numbered markers as default scaffolding.
- Text overflowing the container at any breakpoint.

**Product bans** (this register):
- Decorative motion that isn't a state — **with the exception** of the 3 earned moments above.
- Inconsistent component vocabulary between screens.
- **Display/pixel font in UI labels / buttons / data** — pixel is ONLY for celebration/hero.
- Reinvented standard affordances (custom scrollbars, weird form controls) — chunky, but standard.
- Heavy accents on inactive states.
- Modal-as-first-thought — exhaust inline first.
- **ADHD-specific**: zero colorful noise — max. ONE accent (green); no rainbow category colors; generous whitespace at the Things 3 level; calm > loud.

**Contrast floor**: body text ≥4.5:1, large text/UI components ≥3:1, **placeholder text ≥4.5:1** (not a muted-gray default — this is the most common failure: a muted green-gray on a tinted near-white). `--muted-foreground` here is intentionally darker than the shadcn default — verify in the polish pass.

## Hand-off to proto-design
**Token layer to roll out**: shadcn `:root` custom properties in `src/index.css` (Tailwind v4 `@theme inline` already maps `--color-*` onto classes). Add `--brand-300..700` as primitives.

**Highest-leverage first step**: **replace the neutral baseline** — (1) pure grays (chroma 0) → green-tinted neutrals (hue 150); (2) `--primary` black → brand green; (3) Geist → Nunito (swap `--font-sans` + `@import`). This one step moves the whole app from "neutral shadcn" to "brisk, warm, round, green". The rest is applying the personality per module.

**Per-module implementation order** (from the `MODULES.md` prototyping order + design priority):
1. **Tokens globally** (palette + Nunito + radius + ring) — foundation.
2. **`focus`** — the payoff of the whole funnel, the greatest complexity, and where the signature celebration + timer + tactile press live. The most design attention.
3. **`capture`** — the first contact, the must-feel-good moment ("no deciding"); sets the tone for the whole arcade vibe.
4. **`process`** — efficient attribute pinning (High priority); the GTD inbox style.
5. **`decompose`** → **`run`** → **`dashboard`**.

The pixel face (Press Start 2P) comes in **only** at the celebration in `focus` — not earlier.
