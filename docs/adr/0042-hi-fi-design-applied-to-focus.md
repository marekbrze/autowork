# 0042 - hi-fi design applied to focus
**Date**: 2026-07-01
**Module**: focus
**Status**: Accepted

## Context
The `focus` module was a neutral lo-fi on shadcn defaults (pure-gray neutrals, Geist). `docs/DESIGN.md` (ADR 0041) defined the direction: register **product** + arcade-personality, **light** theme, **green** seed (oklch hue ~149), **Committed** strategy, **Nunito** + **Press Start 2P** typography (signature moments only), state-only motion + earned moments. The `focus` code was already semantic-token-driven, so a global token swap restyled most surfaces automatically.

## Decision
Implemented hi-fi per `docs/DESIGN.md`, in priority order (top-down):

1. **Token layer (project, `src/index.css`)** — a green brand-300..700 scale, neutrals tinted with chroma 0.004–0.022 toward hue 150 (NOT the default-warm hue 60), semantic success/warning/destructive/info + a new **`--overtime`** (warm coral-red oklch 0.62 0.17 25), `--radius: 0.75rem`, a brand-green focus ring. `--primary`/`--brand-700` = oklch(0.46 0.14 150) — chosen so small white text on green (chips, stepper) clears 4.5:1. Bright brand-500/600 = the accent/ring/celebration roles. The dark stub is green-tinted (NOT a target — no toggle).
2. **Typografia** — Geist → **Nunito Variable** (workhorse, rounded chunky), **Press Start 2P** (`--font-pixel`) dodany TYLKO do celebrcji. `font-display: swap`, fallback `ui-rounded, system-ui`.
3. **Focus components** — FocusTimer (text-7xl/8xl, overtime → `--overtime`, paused dim), FocusTaskScreen (chunky title, elevated `bg-card` panels, a large pill Done CTA h-12 + tactile `active:scale`), MotivationPanel (de-reflex uppercase eyebrow → bold + a Sparkles glyph; ✓ in green circles, doneVision in a green-tint box), SessionFilter (chunky title, bold lowercase legends, a chunky pill Start), SessionTaskList (on-brand rows + badges), SessionSummary (**celebration**: a pixel "LEVEL UP!" on a green banner + a `celebrate` animation). Shared FunnelStepper: active semibold (contrast).
4. **Motion** — `@keyframes celebrate` (summary payoff) + `pop` (task transition, key per task id) + tactile `active:scale-[0.97]` na primary CTA. `prefers-reduced-motion` → instant (wszystkie animacje/transition 0.001ms).
5. **Timer-over drift resolved** — PROJECT ("red") ∩ DESIGN ("no alarm") = a separate `--overtime` token (warm coral-red), NOT reusing `--destructive` (don't confuse "past the threshold" with "an error").

Verified: `tsc && vite build` ✅, `eslint` ✅, dev server 200, Playwright screenshots of 4 screens (filter / filter-matched / task / summary) — visually consistent with DESIGN.md.

## Impact
- `focus` jest hi-fi i on-brand; interakcje, dane, stany edge-case i persystencja **niezmienione** (tylko warstwa wizualna).
- **The token layer is project-wide** — other modules (capture/decompose/process/run/dashboard) got a free green+Nunito re-style as a side effect; they'll get their full hi-fi in their own `proto-design`.
- Slop test passed: no side-stripes / gradient-text / glassmorphism / uppercase-eyebrow-reflex / pixel-w-labels; jeden akcent (green); pixel tylko w celebrcji.
- **For proto-polish** (the last 5%): verify/fine-tune the contrast of small text on green (chips/stepper ~4.6:1 — close, confirm), metric-match the Nunito fallback font (size-adjust), touch DnD on SessionTaskList, aria-live on the celebration.
- To change the direction: edit `docs/DESIGN.md` (ADR 0041) and run `proto-brand` again.
