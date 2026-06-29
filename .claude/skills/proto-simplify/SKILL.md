---
name: proto-simplify
description: >
  Reduce an existing project's visual chaos to a clean, neutral prototype/lo-fi style — the
  inverse of decoration. Works with ANY stack (React, Vue, Svelte, Next, plain HTML/CSS,
  Tailwind v3/v4, CSS-in-JS, vanilla CSS) and works with the existing stack — it never migrates
  frameworks or styling libraries. Strips ornament, unifies the project to one neutral palette
  and one font via whatever token system the project already uses, flattens surfaces, AND
  restores missing interaction states and core functioning so the result is a clean prototype
  that actually works. Use after proto-audit when docs/AUDIT.md exists, or run directly on a
  messy project (it does a quick inline scan first). This skill writes code. Triggers on:
  "simplify", "clean up the UI", "reduce visual noise", "make it look like a prototype",
  "uprość", "zrób z tego prototyp", "oczyść", "przywróć do lo-fi". Use whenever the user has a
  working but visually chaotic/generic app (any stack) and wants it pared back to a clean,
  neutral, working prototype before developing the graphic direction further. This is NOT the
  skill for adding brand character or high-end visual design — that's a later proto-design.
---

You are paring a chaotic existing project back to a clean, neutral prototype. The project works but has accumulated visual noise — too many colors, fonts, shadows, gradients, and decoration, plus missing states that make it feel broken. It may run on any stack. Your job is to remove the noise, unify everything to one neutral system (using whatever token layer the project already has), and restore the interaction states so what's left reads as a calm, working prototype. You do not add brand personality or visual richness — that comes later, in a proto-design pass. Restraint is the whole point of this skill.

## Git checkpoint

Every proto skill keeps the project's git history clean so each stage is its own rollback-able checkpoint — you can `git reset` / `git checkout` back to any skill's state. Commits land **on the current branch only**: never push, never create branches, never rewrite history or force-push. The user controls pushing.

### Before your own work — checkpoint pending changes

Do this **first**, before reading prerequisites or touching anything, so this skill's commit only contains this skill's work:

1. In a git repo? `git rev-parse --is-inside-work-tree` — if it errors, the project isn't a repo; skip the checkpoint and tell the user.
2. Anything pending? `git status --porcelain` — empty means nothing to checkpoint; continue.
3. **Stop and ask the user** if there's an unfinished merge/rebase/cherry-pick, unresolved conflicts, or staged changes you didn't make — never commit someone else's half-finished state.
4. **Don't commit generated junk**: if `node_modules/`, `dist/`, `build/`, `.next/`, `.turbo/`, or other build output would be staged, stop and tell the user to add a `.gitignore` first.
5. Stage and commit the pending work: `git add -A && git commit -m "chore(proto): checkpoint before <skill>"`.
6. Tell the user what you checkpointed (one line + file count).

### After your work — commit this skill's checkpoint

When you finish the skill, before the handoff:

1. `git status --porcelain` — empty means nothing changed; skip.
2. `git add -A && git commit -m "proto:<skill>: <short summary>"` — e.g. `proto-harden(recipe-management): implement edge-case states`.
3. Tell the user the commit hash and what's in it.

The two commits are separate on purpose: the first locks in whatever came before (a previous skill's output, or a manual edit); the second locks in this skill's work.

## Prerequisites

Read before starting:
- `docs/AUDIT.md` — the diagnosis, if it exists (it tells you exactly what to fix and in what order)
- the project's **token layer** — wherever colors, fonts, and radii are defined (see "Detect the stack" below)
- `package.json` (or equivalent) — confirm the stack and the **Tailwind version (v3 vs v4)** if Tailwind is used; the two configure tokens differently and mixing them up is a common source of breakage

If `docs/AUDIT.md` doesn't exist, do a quick inline scan first (read the token layer + skim the UI for hardcoded colors, multiple fonts, heavy shadows, gradients) and tell the user what you found. You don't need the full audit to start, but it helps.

Check the project builds and runs. If it doesn't, tell the user to fix that first — this skill simplifies a *working* app, it doesn't rescue a broken one.

## Detect the stack — then adapt

Do not assume a framework or styling system. Detect from `package.json` and the file layout, then apply the neutral baseline through **the project's own token mechanism**. Never introduce a new styling system or migrate an existing one.

- **Tailwind** — tokens live in CSS `@theme` (v4) or the JS config `theme.extend` (v3). Check the version before editing. Restore a neutral palette there and route components through `bg-primary` / `text-muted-foreground` / `border-border` style utilities.
- **CSS custom properties** — find the global `.css` (e.g. `:root { --color-... }`). Neutrals go here. This is the most common setup, including shadcn-style projects.
- **CSS-in-JS** (styled-components, emotion) — tokens live in the theme object. Edit there.
- **CSS Modules / Sass** — look for shared variables/mixins; if none exist, introduce a single `:root` custom-property layer as the source of truth.
- **No token layer at all** (hardcoded colors everywhere) — introduce a minimal `:root` custom-property set and migrate values to it. This is the highest-leverage change on such projects.

The point is always the same: establish one neutral token source and route everything through it, using the mechanism the project already speaks.

**Package manager & dev command** — detect from the lockfile (`pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm, `bun.lockb` → bun). Find the dev script from `package.json` scripts (`dev`, `start`, or whatever runs the app). Use these in the verify step instead of assuming `npm run dev`.

## What simplify is and isn't

**Simplify IS:**
- One neutral palette (tokens, single reserved accent at most)
- One font (the project's existing sans) and one type scale
- Flat surfaces: gradients, heavy shadows, glassmorphism, noise — removed
- Consistent spacing scale, max-width container, breathing room
- Restored states: hover/active/focus/loading/empty/error, dead links fixed, active nav shown
- Working with the existing stack — no framework or styling-library migration

**Simplify IS NOT:**
- Adding brand character, custom fonts, signature moments — that's a later proto-design
- Adding decoration to "make it look better" — if anything, remove one more thing
- Rewriting the app — targeted, reviewable changes, not a big-bang rewrite
- Changing functionality — the app must do exactly what it did before, just calmer

## Decisions — ask the designer

Ask **one at a time**. These set the simplification target; everything else you decide yourself.

**Scope** — "Chcesz uprościć cały projekt, czy konkretne moduły/ekrany/strony?"

**Accent** — "Zostawiamy jeden kolor akcentu (np. obecny brand color, zdesaturowany), czy full neutral (zero akcentu, czysty lo-fi)?"
- Recommend full neutral for a true prototype; one reserved accent only if there's a real semantic need (e.g. destructive actions already use red).

**Dark mode** — "Projekt ma dark mode? Jeśli tak — zostawiamy, czy na czas prototypu przechodzimy tylko na light?"
- Keep what exists; don't add dark mode in a simplify pass.

Do not ask about technical choices (which token mechanism to use, which duplicates to merge into what) — those are yours. The designer cares about the result, not the implementation.

## The neutral baseline

Whatever the stack, the target is the same shape:
- One source of design tokens (see "Detect the stack" for where), with a **neutral** palette — achromatic neutrals, at most one accent
- One sans font, set as the default, on a single type scale
- A single corner-radius value driving all radii (compute variants from it)
- Light and dark (if present) defined as overrides of the same tokens

If the project's token layer has drifted from this (extra colors, multiple fonts, missing tokens, hardcoded values sprinkled across components), the first and highest-leverage change is to **restore this token layer**. Most visual chaos evaporates once everything routes through one neutral set of tokens instead of ad-hoc values.

## Apply in priority order

Work top-down. Each step makes the next more obvious, and the early steps carry the most visual impact for the least risk. Keep the app running after each step.

1. **Tokens & color** — restore the neutral token layer. Replace every hardcoded color/shadow/gradient in the UI with the matching token. Collapse to one accent. Remove the "AI gradient". This single step fixes most of the chaos.
2. **Typography** — one font (the existing sans), one type scale, a small set of weights. Remove decorative/variable-font tricks used for flair. Limit body measure (≈65ch) and set readable line-height. Use tabular figures in data tables.
3. **Interaction states** — every button and link gets hover + active + visible focus. Active nav link is marked. Smooth scroll on anchors. This is what makes the interface feel alive.
4. **Layout & spacing** — add a max-width container, apply a consistent spacing scale, double the whitespace where it's dense, replace `100vh` with `100dvh` (or the framework equivalent), fix misaligned baselines across side-by-side elements.
5. **Missing states** — add skeleton loaders (matching layout shape, not generic spinners), composed empty states, inline error messages (never `alert()`), disabled states on actions that can't run.
6. **Component consolidation** — merge duplicates, replace div soup with semantic HTML, move inline styles into the system, establish a sane z-index scale, delete dead code.
7. **Strategic omissions** — back navigation at dead ends, client-side form validation, a 404 page, real (non-`#`) links.

## Banned in a simplify pass

These have no place in a clean prototype — remove them when you find them (class names below are Tailwind examples; the intent is stack-neutral):
- Gradients (linear/radial used decoratively), the purple/blue "AI gradient"
- Heavy shadows (e.g. Tailwind `shadow-lg`/`xl`), glassmorphism, noise/grain overlays
- Pill shapes (`rounded-full`) on large containers/cards
- Emojis used as icons or in copy
- Multiple accent colors, oversaturated colors, mixed warm/cool grays
- Decorative motion (keep only functional micro-interactions and state transitions)
- Hardcoded colors, inline styles, `100vh`

If you're unsure whether something is decoration or function, it's decoration — remove it.

## Verify

After each major step:
- Run the project with the detected dev command — the app still builds and runs
- Click through the main flows — nothing broke, all routes still work, data still saves
- Take a screenshot if your environment supports it. Look at it with fresh eyes and apply Chanel's rule: **remove one more thing**. A simplify pass that left decoration in didn't go far enough.

The acceptance test is simple: the app should look calm, neutral, and obviously like a prototype — and do everything it did before.

## What to produce

- **Code changes** across the source — primarily the token layer and the UI files that use it (token usage, states, spacing). Small, reviewable commits per priority step. Keep changes within the existing stack.
- **`docs/adr/`** — if the project uses ADRs, record the simplification decisions:

```markdown
# [NNNN] - Visual simplification to prototype baseline
**Date**: [today]
**Status**: Accepted
## Context
The project had accumulated visual/functional debt (see docs/AUDIT.md). Goal: a clean, neutral, working prototype. Stack: [stack].
## Decision
Restored neutral token layer (via [token mechanism]), one font, flat surfaces. Accent: [full neutral / one reserved accent]. Restored states: [hover/active/focus/loading/empty/error].
## Impact
The app is now a calm prototype. Brand character / high-end design is a separate future proto-design pass.
```

If the project has no ADR convention, skip it. If you started without `docs/AUDIT.md`, optionally write a short summary of what you found and fixed.

## After building

**Commit this skill's work first** — see the Git checkpoint section's "After your work" step (`proto:<skill>: <summary>`) — then do the handoff below.

Tell the user:
1. What changed — per priority step (tokens, typography, states, layout, missing states, consolidation)
2. The biggest single source of chaos you removed (usually the token/color layer)
3. How to view it (the detected dev command)
4. That the app still does everything it did before — only calmer

Suggest next steps:
- "Przetestuj prototyp z userami w tej czystej formie — łatwiej ocenić same flows bez dekoracji"
- "Jak chcesz rozwinąć to graficznie (charakter marki, fonty, sygnatura) — odpal proto-brand żeby ustalić kierunek w docs/DESIGN.md, potem proto-design + proto-polish żeby wdrożyć hi-fi"
- "Odpal ponownie proto-audit żeby zobaczyć nowy baseline po uproszczeniu"
