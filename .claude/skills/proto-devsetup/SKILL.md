---
name: proto-devsetup
description: >
  Scaffold a React + Vite project with TypeScript, Tailwind, shadcn/ui, Storybook, and
  LocalStorage abstraction, structured around modules identified in proto-strategize.
  Uses a pre-built template repo for reliable, fast setup. Use this skill after
  proto-strategize when docs/MODULES.md exists and you're ready to start prototyping.
  Triggers on: "setup project", "dev setup", "scaffold", "initialize project",
  "create project structure", "install dependencies". This skill writes code —
  it sets up the technical foundation for proto-lofi prototyping.
---

You are a developer setting up a new project. The design work is done — `proto-init`, `proto-deepen`, and `proto-strategize` have produced the documentation. Now you're creating the technical foundation for building lo-fi prototypes.

## Prerequisites

Read `docs/MODULES.md` to understand the module structure. If it doesn't exist, tell the user to run `proto-strategize` first.

Also read `docs/ENTITY_MAP.md` and `docs/ACTIONS.md` for context on what entities and actions exist.

Read `docs/GLOSSARY.md` for correct English code names of domain terms.

## Setup questions

Before touching any files, ask the user two questions:

**1. Package manager**

Ask: "Which package manager do you want to use?"
Options: npm, pnpm, bun, deno, yarn
Default if unsure: npm

Use the chosen tool for all install commands throughout the setup (`npm install` / `pnpm install` / `bun install` / etc.).

**2. Accessibility level**

Ask: "Which WCAG conformance level do you want to target?"
- **AA** — industry standard, covers most accessibility needs
- **AAA** — highest level, stricter contrast requirements, more verbose labeling

The chosen level affects the eslint config and sets the standard for all proto-lofi components.

## What this skill does

Clone a pre-built template (`marekbrze/proto-template`) into the current directory and install its dependencies, then customize it per project. The template ships ready to build — it is designed to work out of the box, so most of the setup is already done. Your job is: clone, install, then apply project-specific customization.

The template includes:
- React + Vite + TypeScript
- Tailwind CSS v4 with shadcn/ui base-nova style (neutral theme, dark mode support)
- Storybook with the a11y addon (axe-core) and docs
- `eslint-plugin-jsx-a11y` (flat config) + `typescript-eslint`
- LocalStorage abstraction hook (`useLocalStorage<T>`)
- Shared types (`BaseEntity`, `generateId()`)
- Data scenario system (`empty` / `minimal` / `full`) + developer toolbar
- Demo `Button` component (shadcn base-nova, built on `@base-ui/react`) + Storybook story
- `npm run dev`, `npm run build`, `npm run lint`, `npm run storybook` scripts

Then customize per project: module folders from MODULES.md, app name, WCAG level.

This skill **writes code** — it's the bridge between design documentation and prototyping.

## Accessibility standard

All prototypes must meet **WCAG 2.2** at the level the user chose (AA or AAA). Accessibility is a core requirement, not a nice-to-have. The template enforces this at two levels:

1. **Storybook a11y addon** — every story shows a11y violations in the Storybook panel (axe-core). Proto:lofi components that fail a11y checks are immediately visible.
2. **eslint-plugin-jsx-a11y** — catches accessibility issues in the editor and during build (missing alt text, wrong ARIA roles, keyboard-inaccessible elements, etc.). Run with `npm run lint`.

## Project setup steps

### 1. Scaffold from template

Copy the template into the current directory without its git history using degit:

```bash
npx degit marekbrze/proto-template --force
```

This copies all template files into the current directory. It does NOT touch `.claude/`, `docs/`, or any existing files not present in the template.

### 2. Install dependencies

Install with the package manager the user selected. This must succeed without `--force` or `--legacy-peer-deps` — if it fails on a peer-dependency conflict, the template's pinned versions are wrong; report it rather than papering over it.

```bash
npm install       # or pnpm install / bun install / etc.
```

### 3. Replace placeholders

The template uses `__APP_NAME__` as a placeholder in three files. Replace it with the actual app name from `docs/PROJECT.md`:

- `package.json` — `"name": "__APP_NAME__"` (also use it as a valid, lowercase npm name, e.g. `my-app`)
- `index.html` — `<title>__APP_NAME__</title>`
- `src/App.tsx` — `<h1 ...>__APP_NAME__</h1>`

Use the Read + Edit tools to replace `__APP_NAME__` with the actual project name in all three files.

### 4. Adjust WCAG level

The template defaults to **AA** (jsx-a11y recommended ruleset). In `eslint.config.js` there is a comment marking the accessibility line:

```js
// For WCAG AAA, swap `flatConfigs.recommended` for `flatConfigs.strict`.
jsxA11y.flatConfigs.recommended,
```

If the user chose **AAA**, change `flatConfigs.recommended` to `flatConfigs.strict`. For **AA** — no change needed.

### 5. Create module folders

Read `docs/MODULES.md` and create a folder for each module under `src/modules/`:

```
src/modules/
├── [module-name-1]/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── index.ts
├── [module-name-2]/
│   └── ...
```

Module names come from MODULES.md — use the English names exactly as specified there. Each `index.ts` should be an empty export:

```typescript
export {}
```

### 6. Data scenario system (already in the template)

The template ships a global data scenario system that lets developers and testers switch between data states across the whole app (empty / minimal / full), wired into a `DevToolbar` already rendered in `src/App.tsx`. **Do not recreate these files — they are part of the template.** This step is just orientation so you know what `proto-lofi` will extend.

How it works:
- `src/scenarios/types.ts` — `ScenarioName` and `AppData` types.
- `src/scenarios/index.ts` — a registry with `registerScenario(name, factory)`, `getScenario(name)`, `getScenarioNames()`. The built-in `empty`, `minimal`, and `full` scenarios are registered here and currently return empty `AppData` (`{}`).
- `src/scenarios/empty.ts`, `minimal.ts`, `full.ts` — the built-in scenario factories. **`proto-lofi` fills these with realistic mock data per module as it builds each one.**
- `src/scenarios/loader.ts` — `loadScenario(name)` clears app data from LocalStorage, writes the scenario's data, and reloads. `getCurrentScenarioName()` reads the active one.
- `src/shared/components/DevToolbar.tsx` — fixed-position toolbar (dev only, hidden in production via `import.meta.env.PROD`) with a scenario dropdown.

Nothing to do here during setup. `proto-lofi` will populate the scenario factories.

### 7. Add more shadcn components (as needed)

The base `Button` ships in the template. When `proto-lofi` (or the user) needs additional shadcn components, add them with the CLI — the `base-nova` style and `@base-ui/react` are already configured:

```bash
npx shadcn@latest add dialog   # or table, select, form, etc.
```

Note: shadcn's `add` command writes the component file but does **not** always add new transitive dependencies to `package.json`. After adding a component, re-run your install command and check that any new runtime deps (e.g. a new `@base-ui/react/*` or other package it imports) are in `dependencies` before relying on it.

### 8. Verify setup

Confirm the project builds and lints cleanly:

```bash
npm run lint      # eslint + jsx-a11y, should pass with no errors
npm run build     # tsc + vite build
```

Then start the dev server briefly to check for runtime errors:

```bash
npm run dev
```

Kill it after confirming it starts. Then verify Storybook:

```bash
npm run storybook
```

Kill it after confirming it starts and shows the `Shared/Button` story with the Accessibility panel.

All four commands must pass out of the box. If any fails, fix the template/config before continuing — do not hand the user a broken scaffold.

## After setup

Tell the user:
1. What was created — template scaffolded, modules created, dependencies installed
2. How to start the dev server: `npm run dev`
3. How to start Storybook: `npm run storybook`
4. How to lint and build: `npm run lint`, `npm run build`
5. What module folders were created (list them from MODULES.md)
6. That they can now run `proto-detail` for any module to refine its design, then `proto-lofi` to build the prototype

Ask the user to verify the setup by running both commands and confirming everything works.
