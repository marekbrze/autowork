# Design Direction

> Direction dla `proto-design`. Każda wartość tu jest obronna i wynika z wywiadu z designerem.
> Stack: React + Vite + TS + Tailwind v4 + shadcn/ui (base-nova). Token layer = `:root` w `src/index.css` (Tailwind v4 `@theme inline` mapuje je na klasy). To jest baseline, który `proto-design` zastępuje.

## Register
**product** — appka-zadań (lejek: brain dump → ranking → decompose → process → focus → celebrcja). Design służy zadaniu. Arcade/retro-game/joyful to **osobowość** nałożona na product (model Duolingo), NIE brand-theatre.

## Scene
Osoba z ADHD, przytłoczona i zamrożona, **w dzień / rano, przy jasnym świetle, przy biurku** — potrzebuje, żeby appka radośnie wyciągnęła ją z paraliżu i zamieniła "nie wiem od czego zacząć" w grę z jasnymi zasadami. To wymusiło **motyw LIGHT** (handheld-cheerful, Game Boy / Duolingo na jasnym): delikatniejszy dla zmęczonej uwagi, lepszy do czytania zadań pod timerem. Ciemność/neon by przebodźcowały; jasność rozjaśnia overwhelm.

## Personality
**żwawe, ciepłe, okrągłe.** Żwawe (energia arcade, ruch do przodu), ciepłe (zielony + radość, nie zimny tech), okrągłe (chunky rounded forms — przyciski, sans, radius). Referencje (Things 3 + Forest) pociągnęły to ku **radości z restraint/craftem**, nie głośnemu arcade — więc "żwawe" znaczy zipping forward, nie krzyk.

## References
- **Things 3**: calm product-craft — pokazuje jak być playful bez szumu. Generous whitespace, precyzyjny spacing rhythm, tinted neutrals zrobione dobrze. To jest nasz wzór *restraintu pod radością*.
- **Forest / pomodoro-reward apps**: focus-timer + reward loop. Celebrcja = nagroda (jak nasze "Usuń skończone"). Gentle, nie krzykliwy payoff.

## Anti-references
- **AI slop: blue-violet gradient productivity SaaS**: glassmorphism, gradient mesh, linear-clone bez craftu. Generic "która AI to zrobiła". Twierdza do unikania.
- **Harsh red alarm / countdown timer**: presyjny, stresujący — odwrotność calm-through-joy. Timer u nas NIE jest alarmem.
- **Rainbow "category color" clutter**: kolorowy szum = overwhelm = dokładnie to, co walczymy u osoby z ADHD. JEDEN akcent.
- **Synthwave neon-on-black**: wybraliśmy LIGHT — dark-neon arcade jest off-theme.

## Color
**Strategy**: **Committed** — jeden nasycony zielony niesie 30–60% powierzchni (przyciski, primary actions, progress, akcenty), ale canvas + body zostają spokojne tinted-near-white. JEDEN akcent. Semantyka zróżnicowana (success = brand green + glyph ✓, nie osobny zielony).
**Seed hue**: **zielony, oklch hue ~149** — "go / progress / done", idealnie mapuje na lejek tasków; radosny i uspokajający jednocześnie (Duolingo / Game Boy green).

### Palette (OKLCH)

| Role | Token | Value | Notes |
|------|-------|-------|-------|
| Primary (button solid, white fg) | `--primary` | `oklch(0.55 0.16 149)` | green; primary buttons ZAWSZE bold (→ floor 3:1). Jeśli tekst na zielonym ląduje non-bold → użyj `--brand-700`. |
| Primary foreground | `--primary-foreground` | `oklch(0.99 0.02 150)` | near-white, faint green tint |
| Brand/500 (identity, accent on light) | `--brand-500` | `oklch(0.68 0.17 149)` | canonical cheerful green; akcenty/fills z dark text |
| Brand/600 (hover, secondary green) | `--brand-600` | `oklch(0.60 0.16 149)` | hover state dla primary |
| Brand/700 (pressed, deep, safe-for-text) | `--brand-700` | `oklch(0.50 0.15 150)` | white text ≥4.5:1; użyj gdy green niesie non-bold text |
| Brand/400 (soft accent) | `--brand-400` | `oklch(0.82 0.10 149)` | chips, selected states |
| Brand/300 (bg tint) | `--brand-300` | `oklch(0.92 0.05 150)` | subtle green wash na sekcjach |
| Canvas (body bg) | `--background` | `oklch(0.99 0.008 150)` | near-white, faintly green — NIE warm cream (hue 60) |
| Surface (card) | `--card` | `oklch(1.00 0.004 150)` | czystiejsza biel niż canvas → subtle elevation |
| Popover | `--popover` | `oklch(1.00 0.004 150)` | + soft shadow |
| Muted | `--muted` | `oklch(0.965 0.010 150)` | green-tinted neutral |
| Muted foreground | `--muted-foreground` | `oklch(0.50 0.022 150)` | placeholder/secondary text — ≥4.5:1 na canvas (verify w polish) |
| Accent (highlight wash) | `--accent` | `oklch(0.95 0.03 150)` | light green wash na hover/list-highlight |
| Accent foreground | `--accent-foreground` | `oklch(0.30 0.05 150)` | |
| Secondary | `--secondary` | `oklch(0.965 0.012 150)` | neutral-ish secondary surface |
| Secondary foreground | `--secondary-foreground` | `oklch(0.30 0.020 150)` | |
| Border | `--border` | `oklch(0.91 0.012 150)` | full hairline, green-tinted |
| Input | `--input` | `oklch(0.91 0.012 150)` | |
| Ring (focus) | `--ring` | `oklch(0.58 0.16 149)` | focus ring = brand green (brand-600) |
| Ink (body text) | `--foreground` | `oklch(0.26 0.020 150)` | deep green-tinted charcoal, nie pure black |
| Semantic/success | `--success` | `oklch(0.62 0.16 150)` | = brand green; różnicuj glyphem ✓, nie osobnym zielonym |
| Semantic/warning | `--warning` | `oklch(0.80 0.14 80)` | warm gold; timer-over-threshold = ten/gentle coral, NIE harsh red |
| Semantic/destructive | `--destructive` | `oklch(0.60 0.19 27)` | warm coral-red (nie alarm); `--destructive-foreground` white |
| Semantic/info (rzadko) | `--info` | `oklch(0.65 0.10 230)` | muted teal, low chroma; single-user MVP → prawie nieużywany |

**Neutrals**: tintowane chromą **0.004–0.022** w stronę hue **150** (zielony) — NIE default-warm (hue 60, AI cream/sand). Skala 11-stopniowa mappingowana na powyższe tokeny shadcn.
**Surfaces / elevation**: LIGHT → depth przez **lighter card na tintowanym canvas + soft shadow**, NIE przez ciemniejsze surface (to logika dark-mode). 2 poziomy: card (canvas-level), popover (elevated + shadow).
**Dark mode**: SCENE NIE WYMAGA (wybrano light handheld-cheerful). Istniejący stub `.dark` w `index.css` zostaje, ale NIE jest targetem. Jeśli dodany później: surface-lightness depth scale [15/20/25%] hued do brand green, akcenty lekko desaturation, body weight −1.
**Radius**: single `--radius: 0.75rem` (base, chunky-rounds forms). Primary CTA "duże przyciski" mogą iść **pill** (`rounded-full`) dla wyrazistych akcji. Warianty liczone z base (jak dziś: sm/md/lg/xl…).
**Focus ring**: brand green (`--ring`), 2px offset, zawsze widoczny na keyboard nav.

## Typography
**Direction**: jeden well-tuned rounded chunky sans jako workhorse (body/UI/data/buttons) + **jeden pixel/display face TYLKO w momentach sygnaturowych** (celebrcja, hero). Zastępuje neutralny Geist.
**Family/ies**:
- **Workhorse — Nunito** (rounded grotesque, weights 400/600/700/800). Ciepłe, okrągłe, pełna czytelność body — daje arcade ciepło przez roundness bez pixela. Odrzuca reflex "tech = cold neutral grotesk (Geist/Inter)". Metric-matched fallback: system rounded sans (`-apple-system, "Segoe UI", system-ui, sans-serif`).
- **Pixel signature — Press Start 2P** (classic arcade pixel) — **TYLKO** krótki (≤4 słów), duży (≥24px) display text: celebrcja "LEVEL UP!" / session-complete banner. Odrzuca reflex "monospace = lazy technical". Czytelniejsza alternatywa jeśli potrzeba: VT323 / Pixelify Sans. **NIGDY** w UI labels, buttons, data, body, ani w timerze jeśli ryzykuje niejednoznaczne cyfry.
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
| 5xl | 3.0 | celebrcja hero (pixel lub Nunito 800) |
**Weights**: 400 (body) · 600 (UI emphasis) · 700 (buttons/headings) · 800 (display). ≤4. ✓
**Loading**: `font-display: swap`; preload tylko critical weight (Nunito 400 + 700); metric-matched fallback (fallback ma mieć zbliżone x-height/width → minimalny layout shift).
**Details**: `tabular-nums` w data i timerze; measure 65–75ch dla prozy; line-height 1.5–1.6 body, 1.1–1.2 display; chunky buttons → min-height ≥44px (a11y touch) + bold.

## Motion
**Default**: 150–250ms, ease-out, **state-only** (hover/focus/active/open-close/route transition) — bez choreografii.
**Earned signature moments** (arcade + reward loop uzasadniają te 3):
1. **Celebrcja payoff** (SessionSummary / "Usuń skończone" / session complete / "LEVEL UP") — radosna choreografia: scale-in + bouncy/confetti, 400–600ms, custom spring. **THE motion moment** całego lejka.
2. **Tactile press** przycisków — chunky primary buttons `scale(0.96–0.98)` na `:active`, ~100ms, snappy — joystick-feel.
3. **Task transition w focus** (Done → next task) — snappy slide/scale, ~200ms, game-like.
**reduced-motion**: wszystkie sygnaturowe momenty kolapsują do instant/krótki fade; szanuj `prefers-reduced-motion: reduce`.

## Guardrails
**Absolute bans** (match-and-refuse — jeśli ekran tego potrzebuje, kierunek jest zły):
- Side-stripe borders (`border-left/right > 1px` jako kolorowy akcent) → full hairline, bg tints, lub leading glyph.
- Gradient text (`background-clip: text`) → jeden solidny kolor; podkreślaj weight/size.
- Glassmorphism jako default → rzadko i celowo, albo nic.
- Hero-metric template, identyczne card grids, tiny uppercase tracked eyebrows nad każdą sekcją, `01/02/03` numbered markers jako default scaffolding.
- Tekst overflow kontenera na jakimkolwiek breakpoint.

**Product bans** (ten register):
- Decorative motion, który nie jest stanem — **z wyjątkiem** 3 earned moments powyżej.
- Niespójne component vocabulary między ekranami.
- **Display/pixel font w UI labels / buttons / data** — pixel TYLKO celebrcja/hero.
- Reinventowane standardowe affordances (custom scrollbars, dziwne form controls) — chunky, ale standardowe.
- Heavy accents na inactive states.
- Modal-as-first-thought — wyczerpaj inline najpierw.
- **ADHD-specific**: zero barwnego szumu — maks. JEDEN akcent (green); żadnych rainbow category colors; generous whitespace na poziomie Things 3; calm > loud.

**Contrast floor**: body text ≥4.5:1, large text/UI components ≥3:1, **placeholder text ≥4.5:1** (nie muted-gray default — to najczęstszy failure: muted green-gray na tinted near-white). `--muted-foreground` tu jest specjalnie ciemniejsze niż shadcn default — verify w polish.

## Hand-off to proto-design
**Token layer do wdrożenia**: shadcn `:root` custom properties w `src/index.css` (Tailwind v4 `@theme inline` już mapuje `--color-*` na klasy). Dodaj `--brand-300..700` jako primitives.

**Highest-leverage first step**: **zastąpić neutral baseline** — (1) pure grays (chroma 0) → green-tinted neutrals (hue 150); (2) `--primary` black → brand green; (3) Geist → Nunito (swap `--font-sans` + `@import`). Ten jeden krok przesuwa całą appkę z "neutral shadcn" w "żwawy, ciepły, okrągły, zielony". Reszta to aplikowanie osobowości per moduł.

**Per-module implementation order** (z `MODULES.md` prototyping order + design priority):
1. **Tokeny globalnie** (palette + Nunito + radius + ring) — foundation.
2. **`focus`** — payoff całego lejka, największa złożoność, tu żyje sygnaturowa celebrcja + timer + tactile press. Najwięcej design attention.
3. **`capture`** — pierwszy kontakt, must-feel-good ("bez decydowania"); ustawia ton całego arcade vibe.
4. **`process`** — efektywne przypinanie atrybutów (High priority); inbox GTD styl.
5. **`decompose`** → **`run`** → **`dashboard`**.

Pixel face (Press Start 2P) wchodzi **dopiero** przy celebrcji w `focus` — nie wcześniej.
