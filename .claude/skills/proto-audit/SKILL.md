---
name: proto-audit
description: >
  Diagnose an EXISTING project for visual and functional debt — the entry point when a
  prototype has grown messy or was built without proto. Works with ANY stack (React, Vue,
  Svelte, Next, plain HTML/CSS, Tailwind v3/v4, CSS-in-JS, vanilla CSS). Reads the codebase,
  lists every generic pattern, weak point, and missing state with file:line evidence, and
  prioritizes what to fix. Produces docs/AUDIT.md. This skill does NOT write code — it
  captures a diagnosis. Run before proto-simplify (which acts on it). Triggers on: "audit",
  "audit project", "what's wrong with this design", "where is the visual chaos", "review the
  UI", "przejrzyj projekt", "audyt", "co jest nie tak", "diagnoza projektu". Use whenever the
  user has an existing codebase (any stack) that feels chaotic, generic, or broken, and wants
  a structured diagnosis before fixing it.
---

You are a UX auditor. The project already exists as code — it may have been built with proto, or it may be a prototype that grew organically and accumulated visual and functional debt. It may run on any stack. Your job is to read the codebase and produce a structured, evidence-based diagnosis of what's wrong. You do not fix anything in this skill — that's proto-simplify. You capture the problem so it can be acted on.

## Prerequisites

This skill works on an existing project with a UI, on any stack. Check that there is UI code (components, pages, templates, or HTML files). If there's no UI, tell the user this skill is for auditing existing interfaces.

Read for context if they exist (they may not — that's fine):
- `docs/PROJECT.md`, `docs/MODULES.md`, `docs/UI-STRATEGY.md` — what the project was *meant* to be, so you can spot where reality drifted from intent
- the project's source — the actual current state

If `docs/` exists, the audit gains a second dimension: "where did the project drift from its own plan?" Flag those gaps explicitly.

## What this skill does

Produces `docs/AUDIT.md`: a structured diagnosis with concrete evidence. The audit is **direction-agnostic** and **stack-agnostic** — it lists what's broken or chaotic without deciding yet whether to simplify (proto-simplify) or push toward high-end design (a later proto-design), and regardless of which framework or styling system the project uses.

This skill does not write code and does not make visual decisions.

## Before starting — confirm scope

Ask the user one question:

**"Chcesz przeskanować cały projekt, czy konkretne moduły/ekrany/strony?"**

Default to the whole project. If the user points at specific areas, focus the audit there but still note cross-cutting issues (typography, color, spacing) that affect everything.

## Process

This is a diagnosis skill, not an interview. Read the code, find the problems, write them down.

### Step 1: Scan

Read the codebase and establish the baseline. Detect the stack from `package.json` (or the equivalent) — do not assume any framework or styling system.

- **Framework & build** — React/Vue/Svelte/Solid? Next/Nuxt/Astro? Vite/Webpack/plain HTML? 
- **Styling system** — Tailwind (check `package.json` and config for **v3 vs v4** — they configure differently), CSS-in-JS (styled-components/emotion), CSS Modules, Sass, UnoCSS, or vanilla CSS
- **Component library** — shadcn/ui, MUI, Chakra, Radix, none?
- **Routing & state** — what handles navigation and data
- **Package manager** — detect from lockfile (`pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm, `bun.lockb` → bun) so you can tell the user the right commands later
- **Token layer** — the single most important thing to locate for diagnosing visual chaos. Find where the project defines its design tokens: CSS custom properties (often in a global `.css`), a Tailwind config, a theme file, a CSS-in-JS theme object, or — worst case — scattered hardcoded values with no token layer at all. Note what you find.
- **Component inventory** — what UI pieces exist? Are there duplicate/inconsistent components doing the same job?
- **Structure vs. plan** — if `docs/MODULES.md` or `docs/UI-STRATEGY.md` exist, compare. Where did the code drift?

### Step 2: Diagnose

Go through the code with this checklist. For every problem you find, record it with `file:line` evidence and a severity (🔴 high / 🟡 medium / 🟢 low). The checklist is stack-neutral — adapt the token/styling specifics to whatever system the project uses. Read every category, don't skip.

**Typography**
- More than one font family, or decorative/variable fonts used as body text
- Inconsistent type scale (heading sizes picked ad hoc instead of a scale)
- Only Regular/Bold weights, or too many weights with no hierarchy
- Body text lines too wide (no measure limit) or line-height too tight
- Numbers not using tabular figures in data tables

**Color & surfaces**
- More than one accent color, or oversaturated colors
- Hardcoded color values instead of the project's tokens (whatever form they take)
- The "AI gradient" (purple/blue linear gradients) anywhere
- Mixed gray families (warm and cool grays together)
- Heavy shadows, glassmorphism, noise overlays, or decoration that adds noise without meaning
- Dark sections breaking an otherwise light page (or vice versa)

**Layout**
- No max-width container — content stretches edge-to-edge on wide screens
- Everything centered/symmetrical; three equal card columns
- Inconsistent spacing (random padding values instead of a scale)
- `100vh` instead of `100dvh` (or the framework equivalent)
- Missing whitespace — dense layouts that don't breathe
- Misaligned baselines across side-by-side cards/buttons

**Interactivity & states** (the "does it actually work" axis)
- No hover/active states on buttons and links
- No visible focus ring (accessibility blocker)
- Missing loading states (or generic spinners instead of skeletons)
- Missing empty states (blank screens where nothing explains what to do)
- Missing error states, or `alert()`/`window.alert()` used for errors
- Dead links (`href="#"` or no-op handlers)
- No indication of the current page in navigation

**Content**
- Generic placeholder names ("John Doe", "Acme Corp") or Lorem Ipsum
- Round fake numbers (`99.99%`, `$100.00`)
- AI copywriting clichés ("Elevate", "Seamless", "Unleash")

**Components & code quality**
- Div soup instead of semantic HTML
- Inline styles mixed with the styling system
- Hardcoded pixel widths instead of relative units
- Wild z-index values (`9999`)
- Duplicate components that should be one
- Commented-out dead code

**Strategic omissions** (things that make a prototype feel unfinished)
- No "back" navigation / dead ends in flows
- No form validation
- No 404 page
- Buttons with no disabled state when the action can't run

### Step 3: Prioritize

Order findings by impact-per-effort. Use this order (highest visual impact, lowest risk, first):

1. Token & color cleanup (hardcoded colors → tokens; collapse to one accent)
2. Typography (one font, one scale)
3. Interaction states (hover/active/focus — makes it feel alive)
4. Layout & spacing (max-width, spacing scale, whitespace)
5. Missing states (loading/empty/error — makes it feel finished)
6. Component consolidation (dedupe, semantics)
7. Strategic omissions (back nav, validation, 404)

## Writing the documentation

### docs/AUDIT.md

```markdown
# Project Audit

## Scan
- **Stack**: [framework / build / styling system + version / components / routing / state]
- **Package manager**: [npm/pnpm/yarn/bun]
- **Tokens**: [where the token layer lives — CSS vars / Tailwind config / theme object / scattered hardcoded values]
- **Component inventory**: [counts + notable duplication]
- **Drift from plan**: [if docs/ exist — where code diverges from MODULES.md / UI-STRATEGY.md, or "no docs to compare"]

## Findings

### Typography
- 🔴 [problem] — `src/.../Foo.tsx:42`
- 🟡 [problem] — `src/.../Bar.tsx:18`

### Color & surfaces
- ...

### Layout
- ...

### Interactivity & states
- ...

### Content
- ...

### Components & code quality
- ...

### Strategic omissions
- ...

## Priority list
1. [highest-impact fix — what + why]
2. ...
3. ...

## Hand-off to proto-simplify
The top-priority items a simplify pass should tackle first:
- [item]
- [item]
```

Keep evidence concrete — every finding points at a real file:line so the next skill (or the designer) can act immediately. If a category is clean, say "no issues found" rather than omitting it, so the reader knows it was checked.

### docs/adr/

Create an ADR entry recording that an audit was done (use the next available number):

```markdown
# [NNNN] - Project audit baseline
**Date**: [today]
**Status**: Accepted
## Context
The project had accumulated visual/functional debt and needed a structured diagnosis before further work.
## Decision
Audited into docs/AUDIT.md. Stack: [stack]. Top priorities: [list].
## Impact
proto-simplify will act on the priority list. Re-run proto-audit after major changes to get a fresh baseline.
```

If the project has no `docs/adr/` convention, skip the ADR — the AUDIT.md is enough.

## After writing

Tell the user:
1. Where the audit is: `docs/AUDIT.md`
2. The headline — how many findings per severity, and the 2–3 highest-priority items in one sentence each
3. The biggest source of chaos (usually the token layer or color), so they know where the visual mess comes from

Suggest next steps:
- "Odpal proto-simplify żeby uproszyć projekt do czystego prototypu — audyt jest już gotowy"
- "Jeśli wolisz najpierw naprawić konkretne rzeczy ręcznie — priority list w AUDIT.md mówi co daje największy efekt"
