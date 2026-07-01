# 0042 - hi-fi design applied to focus
**Date**: 2026-07-01
**Module**: focus
**Status**: Accepted

## Context
Moduł `focus` był neutralnym lo-fi na shadcn defaults (pure-gray neutrals, Geist). `docs/DESIGN.md` (ADR 0041) zdefiniował kierunek: register **product** + arcade-personality, motyw **light**, seed **zielony** (oklch hue ~149), strategia **Committed**, typografia **Nunito** + **Press Start 2P** (tylko momenty sygnaturowe), motion state-only + earned moments. Kod `focus` był już semantic-token-driven, więc globalny swap tokenów restylował większość powierzchni automatycznie.

## Decision
Wdrożono hi-fi per `docs/DESIGN.md`, priorytetowo (top-down):

1. **Token layer (projektowy, `src/index.css`)** — zielona skala brand-300..700, neutrals tintowane chromą 0.004–0.022 w stronę hue 150 (NIE default-warm hue 60), semantyczne success/warning/destructive/info + nowy **`--overtime`** (warm coral-red oklch 0.62 0.17 25), `--radius: 0.75rem`, focus ring w brand green. `--primary`/`--brand-700` = oklch(0.46 0.14 150) — dobrane tak, by mały biały tekst na zielonym (chips, stepper) clearingował 4.5:1. Bright brand-500/600 = role akcentu/ringu/celebracji. Dark stub przetintowany na zielono (NIE target — brak toggle'a).
2. **Typografia** — Geist → **Nunito Variable** (workhorse, rounded chunky), **Press Start 2P** (`--font-pixel`) dodany TYLKO do celebrcji. `font-display: swap`, fallback `ui-rounded, system-ui`.
3. **Komponenty focus** — FocusTimer (text-7xl/8xl, overtime → `--overtime`, paused dim), FocusTaskScreen (chunky title, elevated `bg-card` panels, duży pill Done CTA h-12 + tactile `active:scale`), MotivationPanel (de-reflex uppercase eyebrow → bold + Sparkles glyph; ✓ w zielonych kolkach, doneVision w green-tint box), SessionFilter (chunky title, bold lowercase legends, chunky pill Start), SessionTaskList (on-brand rows + badges), SessionSummary (**celebrcja**: pixel "LEVEL UP!" na green banerze + animacja `celebrate`). Shared FunnelStepper: active semibold (kontrast).
4. **Motion** — `@keyframes celebrate` (summary payoff) + `pop` (task transition, key per task id) + tactile `active:scale-[0.97]` na primary CTA. `prefers-reduced-motion` → instant (wszystkie animacje/transition 0.001ms).
5. **Timer-over drift rozstrzygnięty** — PROJECT ("czerwony") ∩ DESIGN ("nie alarm") = osobny token `--overtime` (warm coral-red), NIE reuse `--destructive` (nie myli "ponad próg" z "błędem").

Zweryfikowano: `tsc && vite build` ✅, `eslint` ✅, dev serwer 200, Playwright screenshoty 4 ekranów (filter / filter-matched / task / summary) — wizualnie zgodne z DESIGN.md.

## Impact
- `focus` jest hi-fi i on-brand; interakcje, dane, stany edge-case i persystencja **niezmienione** (tylko warstwa wizualna).
- **Token layer jest projektowy** — inne moduły (capture/decompose/process/run/dashboard) dostały darmowy green+Nunito re-style jako side effect; ich pełne hi-fi dostaną we własnym `proto-design`.
- Slop test passed: no side-stripes / gradient-text / glassmorphism / uppercase-eyebrow-reflex / pixel-w-labels; jeden akcent (green); pixel tylko w celebrcji.
- **Do proto-polish** (ostatnie 5%): verify/dokładne tuning kontrastu małego tekstu na zielonym (chips/stepper ~4.6:1 — blisko, potwierdzić), metric-match fallback fontu Nunito (size-adjust), DnD touch na SessionTaskList, aria-live na celebracji.
- Aby zmienić kierunek: edytuj `docs/DESIGN.md` (ADR 0041) i odpal `proto-brand` ponownie.
