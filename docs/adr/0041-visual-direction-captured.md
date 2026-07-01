# 0041 - visual direction captured (proto-brand)
**Date**: 2026-07-01
**Status**: Accepted

## Context
Prototyp był neutralnym lo-fi na shadcn defaults (pure-gray neutrals chroma 0, Geist Variable, `--radius: 0.625rem`, default light + dark stub). `proto-harden` skończony (ADR 0040). Przed hi-fi (`proto-design`) potrzebny był ustalony kierunek wizualny, żeby nie re-litigować każdego wyboru przy kodzie. `UI-STRATEGY.md` już nosił intent designera: arcade / retro-game, żartobliwy, radosny, cheerful-saturated, duże przyciski — ale bez konkretnów (register, scene→motyw, seed hue, typografia, motion).

## Decision
`proto-brand` wywiad (3 rundy, jedna decyzja na pytko, w PL) + synteza z twardych standardów designu → zapisany kierunek w `docs/DESIGN.md`:

- **Register**: **product** + arcade-personality (model Duolingo — zadanie rządzi, arcade to radosny głos, NIE brand-theatre). Kluczowe napięcie rozwiązane: arcade WABI się pixel-fontami wszędzie + rainbow, ale product dla ADHD = czytelne body, standardowe affordances, **zero barwnego szumu**.
- **Scene → motyw**: light handheld-cheerful (Game Boy / Duolingo radość na jasnym). Scena (ADHD, przytłoczona, w dzień, paralysis → radosne wyciągnięcie) wymusiła LIGHT — ciemność/neon by przebodźcowały.
- **Personality**: **żwawe, ciepłe, okrągłe**. Referencje (Things 3 + Forest) pociągnęły ku radości z restraint/craftem, nie głośnego arcade.
- **Color strategy**: **Committed** — jeden nasycony zielony (~oklch hue 149) niesie 30–60% powierzchni; canvas + body spokojne tinted-near-white. JEDEN akcent. Neutrals tintowane chromą 0.004–0.022 w stronę hue 150 (NIE default-warm hue 60 = AI cream/sand).
- **Typography**: rounded chunky sans workhorse (**Nunito**, zastępuje Geist) + pixel face (**Press Start 2P**) TYLKO w momentach sygnaturowych (celebrcja/hero) — NIGDY w UI labels/buttons/data.
- **Motion**: state-only default (150–250ms) + 3 earned signature moments (celebrcja payoff, tactile press, task transition); `prefers-reduced-motion` fallback.
- **Dark mode**: NIE target (scene = light). Stub `.dark` zostaje, nie aktywny.

Anti-refs (mandatory): AI slop blue-violet SaaS, harsh red alarm/countdown, rainbow category clutter, synthwave neon-on-black.

## Impact
- `proto-design` wdraża kierunek per moduł, czytając `docs/DESIGN.md`. Highest-leverage first step: zastąpić neutral baseline (pure grays → green-tinted neutrals; `--primary` black → brand green; Geist → Nunito).
- Kolejność modułów: tokeny globalnie → `focus` (payoff + celebrcja + timer) → `capture` (ton) → `process` → `decompose` → `run` → `dashboard`.
- `proto-polish` = final pass (w tym verify contrast floor: muted-foreground/placeholder ≥4.5:1 na tinted near-white — najczęstszy failure).
- Aby zmienić kierunek: edytuj `docs/DESIGN.md` albo odpal `proto-brand` ponownie.
