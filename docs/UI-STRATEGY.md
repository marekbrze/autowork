# UI Strategy

Structural decisions for the shell (from the `proto-highlevelui` interview). Visual concerns (colors, typography, sizes) are deliberately deferred to `proto-design`.

## Platform
**Desktop** — single-user, a personal tool; ultimately a static SPA on GitHub Pages.

## Navigation
- **Type**: Top bar (horizontal navigation at the top).
- **Structure**: **Flow-oriented** — the top bar exposes only `Dashboard` (+ an active-Run chip). The funnel steps (Stressors → Next actions → Processing → Focus) are a **clickable stepper** — the user freely navigates the active Run's steps (supersedes the early "not free links", ADR 0048). Still also led by the "Next" button and the progress stepper within the run route. The stepper is built by `proto-lofi`.

## Home page
**Dashboard** (`/`). Placeholder: active-Run progress + recent runs + the main "Start a new Run" CTA (→ `/capture`). `proto-lofi` replaces these with real data from the scenarios.

## Module navigation

| Module (code) | Label (display) | Route | Role |
|---|---|---|---|
| dashboard | Dashboard | `/` (alias `/dashboard`) | top-bar link |
| capture | Stresory | `/capture` | krok lejka (stepper) |
| decompose | Next actions | `/decompose` | krok lejka (stepper) |
| process | Procesowanie | `/process` | krok lejka (stepper) |
| focus | Focus | `/focus` | krok lejka (stepper) |
| run | Run | `/run` | container — a chip in the header, not a link |

Display labels are in English (the app's language); code names are English (from `MODULES.md`). With flow-oriented, `capture`/`decompose`/`process`/`focus` are **step names in the progress stepper**, not links in the top bar.

## Content layout
- **Container**: Contained — `max-w-6xl` (~1150px), wycentrowany.
- **Breadcrumbs**: **Tak** — klikalny stepper lejka (swobodna nawigacja po krokach aktywnego Runa); supersede ADR 0001 / wczesnego „Nie" (ADR 0048).

## Shared elements
- **Header**: Yes — top bar: the "Autowork" name (→ home) + a `Dashboard` link + a right slot for the active-Run chip (real state is wired by `proto-lofi`).
- **Footer**: Nie.
- **Notifications**: Nie (single-user, MVP).

## Visual direction (dla `proto-design` — NIE zaimplementowane w tym shellu)
Zapisana intencja designera na kolejny skill:
- **Vibe**: arcade / retro-game, žartobliwy, radosny.
- **Kolory**: cheerful, nasycone (shell jest obecnie neutralny shadcn base-nova; paleta do ustalenia w proto-design).
- **Buttons**: large, expressive ("big buttons").

The shell is deliberately neutral/structural, so `proto-design` can lay an arcade aesthetic on top without rebuilding the structure.

## Notes
- Routing: `BrowserRouter`. When deploying to GitHub Pages, set a `basename` (or switch to `HashRouter`) to avoid a 404 on refresh — to resolve at deploy time.
- `index.html` `lang="en"` (the app is in English — an a11y AAA requirement).
