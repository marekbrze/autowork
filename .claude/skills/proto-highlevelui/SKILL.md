---
name: proto-highlevelui
description: >
  Interview the UX designer about high-level UI structure — navigation pattern, layout,
  home page, and shared shell. Creates AppShell with routing, shared components, and
  docs/UI-STRATEGY.md. Must run after proto-devsetup. proto-lofi then fills the shell
  with module-specific screens. Triggers on: "high level ui", "app shell", "navigation",
  "layout", "app structure", "navigation structure", "shell", "proto-highlevelui".
  Use whenever the user wants to define how modules connect in the UI, where navigation
  lives, or what the overall app frame looks like. This skill writes code.
---

You are a UX architect defining the app shell. The project scaffold exists from proto-devsetup, and the module breakdown is in docs/MODULES.md. Your job is to interview the designer about navigation and layout, then build the shell that proto-lofi will fill with module screens.

## Prerequisites

Read before starting:
- `docs/MODULES.md` — module names, types, integration points
- `docs/PROJECT.md` — core idea and user problems (context for home page decision)
- `docs/GLOSSARY.md` — code names

Check that the project scaffold exists (`src/App.tsx`, `vite.config.ts`). If not, tell the user to run `proto-devsetup` first.

## What this skill does

Creates the application shell — the frame that wraps all module screens:
- Navigation between modules (sidebar, top bar, bottom tabs, hybrid)
- Home page / landing screen
- Content container layout
- Shared elements (header, footer, breadcrumbs)
- Routing structure

This skill does NOT make visual decisions (colors, typography, spacing) — that's proto-design territory. It's purely about structure: where things are and how the user navigates.

## Interview

Ask questions **one at a time**. Show options when possible. Each answer shapes the next question.

### Phase 1: Platform

The foundational decision — everything else depends on it.

**"Na jakiej platformie bedzie uzywana aplikacja?"**

Options:
- **Desktop** — sidebar navigation, large content area, hover interactions
- **Mobile** — bottom tabs, stacked screens, touch-first
- **Responsive** — desktop sidebar + mobile bottom tabs, content adapts

Explain that responsive means building two navigation variants — more work upfront, but covers both platforms. The designer picks based on their target users.

### Phase 2: Navigation

Based on the platform choice, ask about navigation type.

**For desktop:**
"Jak ma wygladac nawigacja glowna? Opcje:"
- **Sidebar** — moduly po lewej, ikony + labelki, collapsible
- **Top bar** — poziome menu na gorze, moduly jako linki
- **Hybrid** — top bar z glowna nawigacja + sub-nawigacja wewnatrz modulow

Recommend sidebar for 4+ modules (scales better), top bar for 2-3 modules.

**For mobile:**
"Jak ma wygladac nawigacja glowna? Opcje:"
- **Bottom tabs** — moduly jako ikony na dole ekranu
- **Hamburger menu** — moduly schowane w bocznym menu
- **Tab bar + hamburger** — core moduly na dole, reszta w hamburger

Recommend bottom tabs for up to 5 modules, tab bar + hamburger for more.

**For responsive:**
"Na desktopie sidebar czy top bar? Na mobile bottom tabs czy hamburger?"

Recommend the most common pairing: sidebar (desktop) + bottom tabs (mobile).

### Phase 3: Home page

"Co user widzi po wejsciu w aplikacje — zanim wejdzie w konkretny modul?"

Options:
- **Dashboard** — podsumowanie z wielu modulow (ostatnie akcje, statystyki, widgety)
- **Pusta strona glowna** — tylko nawigacja, user od razu wybiera modul
- **Start page z call to action** — onboarding lub glowna akcja na srodku
- **Wprost do pierwszego modulu** — brak strony glownej, redirect

Recommend based on project type: dashboard for data-heavy apps, direct-to-module for simple tools, start page for apps with onboarding.

### Phase 4: Module labels

Read the module names from MODULES.md. For each module, ask:

"Modul `[module-name]` — jaki label ma widziec user w nawigacji? Domyślnie: `[human-readable default based on name]`"

Offer a sensible default based on the module name, but let the designer override. The code name stays from MODULES.md — this is purely the display label.

Example: module `recipe-management` → suggest "Recipes" or "Recipe Management", designer might say "Biblioteka przepisow".

Also ask: "Czy kolejnosc modulow w nawigacji jest ok?" — show the list from MODULES.md and let designer reorder.

### Phase 5: Content container

"Jak ma wygladac kontener na tresc modulu? Opcje:"
- **Full-width** — tresc rozciaga sie na cala szerokosc (tabele, dashboardy)
- **Contained** — max-width ~1200px, wycentrowany (formularze, czytanie)
- **Responsive** — contained na desktop, full-width na mobile

Recommend responsive as default — contained content on wide screens is easier to scan.

" Czy chcesz breadcrumbs wewnatrz modulow?" — yes/no. Useful when modules have deep navigation (list → detail → sub-detail).

### Phase 6: Shared elements

"Jakie wspólne elementy maja byc widoczne zawsze? Opcje (wybierz wszystkie ktore pasuja):"

- **Header** — logo/app name + ewentualnie user info, notyfikacje
- **Footer** — rzadko potrzebny w prototypach, ale moze byc
- **Notifications area** — bell icon z badge, placeholder na przyszlosc

Recommend header as default (app name gives context), skip footer unless the designer specifically wants it.

## What to produce

### 1. docs/UI-STRATEGY.md

```markdown
# UI Strategy

## Platform
[desktop / mobile / responsive]

## Navigation
- Type: [sidebar / top bar / bottom tabs / hybrid]
- Mobile (if responsive): [bottom tabs / hamburger / tab bar + hamburger]

## Home page
[description — dashboard / empty / start page / redirect to module]

## Module navigation
| Module (code) | Label (display) | Order |
|---|---|---|
| [module-name] | [display label] | 1 |
| ... | ... | ... |

## Content layout
- Container: [full-width / contained / responsive]
- Breadcrumbs: [yes / no]

## Shared elements
- Header: [yes — description / no]
- Footer: [yes — description / no]
- Notifications: [yes / no]
```

### 2. docs/adr/

Create an ADR entry:

```markdown
# [NNNN] - Navigation and app shell structure

**Date**: [today]
**Module**: app-shell
**Status**: Accepted

## Context
Need to define how users navigate between modules and what the overall app frame looks like.

## Decision
[Platform] with [navigation type]. Home page: [type]. [Other key decisions].

## Impact
All proto-lofi modules will render inside this shell. Navigation between modules is handled by the shell.
```

Use the next available ADR number.

### 3. Install React Router

If React Router is not installed:

```bash
npm install react-router-dom
```

(Use the package manager the user chose during devsetup.)

### 4. Shared components

Create the shell components in `src/shared/components/`:

**AppShell** — the main layout wrapper. Renders navigation + content slot. Structure depends on designer's decisions:

- Sidebar variant: sidebar on the left with module links, content area on the right
- Top bar variant: horizontal nav at the top, content below
- Bottom tabs variant: content fills the screen, tab bar at the bottom
- Responsive: sidebar on desktop, bottom tabs on mobile (use Tailwind breakpoints)

**Navigation items** — map MODULES.md entries to nav links. Use display labels from the interview. Each link navigates to `/{module-name}`.

**Header** (if chosen) — app name on the left, optional placeholder slot on the right (user menu, notifications).

**Layout** — content container with max-width if "contained" was chosen. Padding consistent with shadcn defaults. Breadcrumbs area if chosen.

Use shadcn components where applicable (Button for nav items, Sheet for mobile sidebar if needed). Keep styling minimal — shadcn neutral defaults, no custom colors.

### 5. Routing in App.tsx

Update `src/App.tsx` to set up React Router:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './shared/components/AppShell';
import { DevToolbar } from './shared/components/DevToolbar';

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Home route */}
          <Route index element={<HomePage />} />
          {/* Module routes — lazy loaded */}
          <Route path="/:moduleName" />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
      <DevToolbar />
    </BrowserRouter>
  );
}

export default App;
```

Module routes are placeholders — proto-lofi fills them with actual screens. The `/:moduleName` route catches navigation from the sidebar but doesn't render anything yet (lofi adds the real components).

HomePage depends on the designer's decision:
- Dashboard → simple placeholder with module summary cards
- Empty → just the navigation shell
- Start page → centered CTA
- Redirect → `Navigate` to the first module

### 6. Verify

Run `npm run dev` briefly to check for errors. Confirm the app shell renders with navigation and module links work (even if they show empty pages).

## After building

Tell the user:
1. What was created — list the shared components and routing setup
2. What the navigation looks like — describe or show a screenshot
3. How to see it: `npm run dev`
4. That proto-lofi will now fill module routes with actual screens
5. Where the strategy is documented: `docs/UI-STRATEGY.md`

Suggest next steps:
- "Odpal proto-lofi na pierwszym module żeby zobaczyć ekrany wewnątrz shella"
- "Jeśli chcesz zmienić nawigację — edytuj UI-STRATEGY.md i przetestuj"
