# 0001 - Navigation and app shell structure

**Date**: 2026-06-26
**Module**: app-shell
**Status**: Accepted

## Context
We need to define how the user navigates between modules and what the whole app frame looks like. Autowork is a single-user, guided, one-way funnel (stressors → focus) whose promise is "lift the burden of deciding what to start with". So the shell should lead, not offer a menu of free choices.

## Decision
- **Platform**: Desktop.
- **Navigation type**: Top bar.
- **Navigation structure**: **Flow-oriented**. The top bar exposes only `Dashboard` (+ an active-Run chip). The funnel steps (`capture`/`decompose`/`process`/`focus`) are guided within a Run by a progress stepper + "Next", not by free links — which preserves the leading philosophy and a minimal number of decisions.
- **Home**: Dashboard (`/`) — progres aktywnego Runa + historia + CTA start/resume.
- **Content**: Contained (`max-w-6xl`, wycentrowany). Bez breadcrumbs. Header tak (nazwa apki + Dashboard + slot na chip Runa); bez footera; bez notyfikacji.
- **Routing**: React Router (`BrowserRouter`): index + `/dashboard` → `DashboardHome`; `/:moduleName` → placeholder modułu; `*` → redirect na `/`.
- **a11y**: `index.html` `lang="pl"`; nav z `aria-label`; linki z widocznym tekstem; cel WCAG 2.2 AAA (eslint `jsx-a11y` strict).

## Impact
Wszystkie ekrany `proto-lofi` renderują się wewnątrz `AppShell`. `proto-lofi` buduje stepper postępu Runa i routing kroków (podmieniając placeholdery tras). Estetyka wizualna (arcade / wesołe kolory / duże przyciski) jest odłożona do `proto-design` — ten shell jest strukturalny i neutralny. Przy deploymencie na GitHub Pages trzeba skonfigurować `basename` routera (lub `HashRouter`).
