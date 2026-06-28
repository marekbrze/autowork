# 0001 - Navigation and app shell structure

**Date**: 2026-06-26
**Module**: app-shell
**Status**: Accepted

## Context
Trzeba zdefiniować, jak user nawiguje między modułami i jak wygląda cała rama apki. Autowork to single-userowy, prowadzony, jednokierunkowy lejek (stresory → focus), którego obietnicą jest „zdejmij ciężar decydowania, od czego zacząć". Zatem shell ma prowadzić, a nie oferować menu wolnych wyborów.

## Decision
- **Platform**: Desktop.
- **Navigation type**: Top bar.
- **Navigation structure**: **Flow-oriented**. Top bar eksponuje tylko `Dashboard` (+ chip aktywnego Runa). Kroki lejka (`capture`/`decompose`/`process`/`focus`) są prowadzone wewnątrz Runa przez stepper postępu + „Dalej", a nie wolnymi linkami — co zachowuje filozofię prowadzenia i minimalnej liczby decyzji.
- **Home**: Dashboard (`/`) — progres aktywnego Runa + historia + CTA start/resume.
- **Content**: Contained (`max-w-6xl`, wycentrowany). Bez breadcrumbs. Header tak (nazwa apki + Dashboard + slot na chip Runa); bez footera; bez notyfikacji.
- **Routing**: React Router (`BrowserRouter`): index + `/dashboard` → `DashboardHome`; `/:moduleName` → placeholder modułu; `*` → redirect na `/`.
- **a11y**: `index.html` `lang="pl"`; nav z `aria-label`; linki z widocznym tekstem; cel WCAG 2.2 AAA (eslint `jsx-a11y` strict).

## Impact
Wszystkie ekrany `proto-lofi` renderują się wewnątrz `AppShell`. `proto-lofi` buduje stepper postępu Runa i routing kroków (podmieniając placeholdery tras). Estetyka wizualna (arcade / wesołe kolory / duże przyciski) jest odłożona do `proto-design` — ten shell jest strukturalny i neutralny. Przy deploymencie na GitHub Pages trzeba skonfigurować `basename` routera (lub `HashRouter`).
