# UI Strategy

Decyzje strukturalne shella (z wywiadu `proto-highlevelui`). Kwestie wizualne (kolory, typografia, wielkości) są celowo odłożone do `proto-design`.

## Platform
**Desktop** — single-user, osobiste narzędzie; docelowo statyczne SPA na GitHub Pages.

## Navigation
- **Type**: Top bar (pozioma nawigacja na górze).
- **Structure**: **Flow-oriented** — top bar eksponuje tylko `Dashboard` (+ chip aktywnego Runa). Kroki lejka (Stresory → Next actions → Procesowanie → Focus) **nie są** wolnymi linkami; prowadzi ich Run przez akcję „Dalej" i stepper postępu wewnątrz trasy runa. Stepper i routing kroków buduje `proto-lofi`.

## Home page
**Dashboard** (`/`). Placeholder: progres aktywnego Runa + ostatnie runy + główne CTA „Zacznij nowy Run" (→ `/capture`). `proto-lofi` podmienia na rzeczywiste dane ze scenariuszy.

## Module navigation

| Module (code) | Label (display) | Route | Role |
|---|---|---|---|
| dashboard | Dashboard | `/` (alias `/dashboard`) | top-bar link |
| capture | Stresory | `/capture` | krok lejka (stepper) |
| decompose | Next actions | `/decompose` | krok lejka (stepper) |
| process | Procesowanie | `/process` | krok lejka (stepper) |
| focus | Focus | `/focus` | krok lejka (stepper) |
| run | Run | `/run` | kontener — chip w nagłówku, nie link |

Labele display po polsku (język apki); nazwy kodowe ang. (z `MODULES.md`). Przy flow-oriented `capture`/`decompose`/`process`/`focus` to **nazwy kroków w stepperze postępu**, nie linki w top-barze.

## Content layout
- **Container**: Contained — `max-w-6xl` (~1150px), wycentrowany.
- **Breadcrumbs**: **Nie** — lejek jest płaski/prowadzony; brak głębokiej nawigacji list→detail na tym etapie.

## Shared elements
- **Header**: Tak — top bar: nazwa „Autowork" (→ home) + link `Dashboard` + prawy slot na chip aktywnego Runa (realny stan podłącza `proto-lofi`).
- **Footer**: Nie.
- **Notifications**: Nie (single-user, MVP).

## Visual direction (dla `proto-design` — NIE zaimplementowane w tym shellu)
Zapisana intencja designera na kolejny skill:
- **Vibe**: arcade / retro-game, žartobliwy, radosny.
- **Kolory**: cheerful, nasycone (shell jest obecnie neutralny shadcn base-nova; paleta do ustalenia w proto-design).
- **Przyciski**: duże, wyraziste („duże przyciski").

Shell jest celowo neutralny/strukturalny, żeby `proto-design` mógł nałożyć estetykę arcade bez przebudowy struktury.

## Notes
- Routing: `BrowserRouter`. Przy deploymencie na GitHub Pages ustawić `basename` (lub przejść na `HashRouter`), by uniknąć 404 przy odświeżeniu — do rozstrzygnięcia przy deploymencie.
- `index.html` `lang="pl"` (apka po polsku — wymóg a11y AAA).
