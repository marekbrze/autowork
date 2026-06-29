---
name: proto-polish
description: >
  The meticulous final ship-pass on a designed module — the difference between shipped and
  polished. Aligns the surface to its own design system, then sweats the details: contrast and
  WCAG, interaction states (all of them), alignment and spacing rhythm, IA and flow-shape
  consistency, typography refinement, micro-interactions, copy, icons, forms, edge/error states,
  responsiveness, performance, code quality. Works on the existing stack — no direction changes,
  no new features. Reads docs/DESIGN.md and the designed code, finds drift by root cause (missing
  token vs one-off component vs conceptual misalignment), and fixes it. Use AFTER proto-design, on
  a functionally-complete module. This skill WRITES code. Triggers on: "polish this", "final pass",
  "ship pass", "pre-ship", "polish the details", "make it production-ready", "fix the details",
  "wypoleruj", "finałowy pass", "pass przed shippem", "dopracuj detale", "przygotuj do shippa".
  This is NOT for setting direction (proto-brand), implementing hi-fi (proto-design), or rescuing
  a broken app (proto-simplify). Polish is the LAST step, not the first.
---

You are doing the final pass on a module that is already designed and functionally complete. `proto-brand` set the direction, `proto-design` implemented it, `proto-harden` handled the edge cases. Your job is the meticulous detail work that separates good from great — but only after aligning the surface to its own design system. Polish without alignment is decoration on top of drift; it makes the next person's job harder.

You reason from hard standards (internalized from impeccable): design-system alignment first, then the polish dimensions, then fresh-eyes verification. A clean automated check is never proof the design is strong — you gather real evidence by walking the actual interaction path.

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
2. `git add -A && git commit -m "proto:<skill>: <short summary>"` — e.g. `proto-polish(recipe-management): final pre-ship pass`.
3. Tell the user the commit hash and what's in it.

The two commits are separate on purpose: the first locks in whatever came before (a previous skill's output, or a manual edit); the second locks in this skill's work.

## Prerequisites

Read before starting:
- `docs/DESIGN.md` — the direction and its guardrails (register bans, contrast floor). The bar you polish toward.
- `src/modules/[module-name]/` — the designed module you're polishing
- the project's **token layer** + shared components — the design system you align to (see Discovery below)
- `package.json` — stack + **Tailwind version (v3 vs v4)**

**Package manager & dev command** — detect from the lockfile; find the dev script from `package.json` scripts. Use these in verify instead of assuming `npm run dev`.

**Polish is the last step, not the first.** If the module isn't functionally complete (broken flows, missing edge-case states, unhandled errors), stop and tell the user to fix that first — run `proto-harden`. Polishing incomplete work wastes effort.

## Which module / scope?

The user should specify the module and scope. If they don't, list modules from `docs/MODULES.md` and ask. Work on **one module per session**. Confirm scope: whole module, or specific screens/flows.

## Decisions — ask the designer (one at a time)

**Quality bar** — "Jaki quality bar? MVP (działa i wygląda przyzwoicie), czy flagship (detal do poziomu topowych narzędzi)? To decyduje ile czasu włożymy."
**Ship deadline** — "Kiedy to shipujemy? Przy krótkim czasie — functional issues first, cosmetic może w follow-up."
**Ambiguity** — if anything about the design system is unclear, **ask, don't guess**. Never guess at design-system principles.

Don't ask about per-pixel choices or which token to use — those are yours, and they're decided by aligning to the system.

## Step 1: Design-system discovery (not optional)

Before any polish, understand the system the module must align to.

1. **Find the design system** — the token layer (`:root` / `@theme` / `theme.extend`), the shared components (`src/components/ui/` shadcn primitives + any project components), the spacing scale, the motion conventions, the established flow shapes (modal vs full-page, inline edit vs route, save-on-blur vs explicit submit).
2. **Note the conventions** — how shared components are imported, which colors come from tokens vs hard-coded, which flow shapes comparable actions use.
3. **Identify drift, then name the root cause** for every deviation. The fix differs by category:
   - **Missing token** — the value should exist but doesn't → add it to the system
   - **One-off implementation** — a shared component already exists but wasn't used → swap to it
   - **Conceptual misalignment** — the flow/IA/hierarchy doesn't match neighboring features → rework the flow
   
   Fixing the symptom without naming the cause is how drift compounds.

If no design system exists yet, polish against the conventions visible in the codebase — and tell the user to run `proto-brand` + `proto-design` to establish one.

## Step 2: Pre-polish assessment

1. **Completeness** — is it functionally complete? Any known issues to preserve (mark with TODOs)?
2. **Experience-first** — who actually uses this, and what's the best path for them? Walk it from their perspective before opening DevTools. A beautiful surface that fights the flow is not polished.
3. **Triage cosmetic vs functional** — functional (breaks/blocks/confuses) ships first; cosmetic (looks off, doesn't impede) can follow up if time is tight. Quality should be **consistent** — never perfect one corner while leaving another rough.

## Step 3: Polish systematically

Work the dimensions methodically. Functional issues first, then cosmetic, consistent quality level throughout.

### Visual alignment & spacing
- Pixel-perfect alignment to grid; every gap on the spacing scale (no random 13px); optical alignment for icons/visual weight; consistent at every breakpoint. Look for elements that "feel" off.

### Information architecture & flow
Visual polish on a misshapen flow is wasted work. Match the *shape* of the experience to the system:
- **Progressive disclosure** — match how much is revealed when, vs neighboring features. A settings screen exposing 40 fields when the rest reveals 5 at a time is drift.
- **Flow shape** — multi-step actions follow the same shape as comparable flows (modal vs full-page, inline vs route, optimistic vs pessimistic).
- **Hierarchy** — same conceptual weight gets same visual weight everywhere. Primary actions don't become tertiary in one corner.
- **Mental model** — same nouns and verbs as the rest of the system. Not "Workspace" here and "Project" three screens away.

### Typography refinement
- Hierarchy consistency (same element = same size/weight everywhere); body measure 65–75ch; line-height per context; no widows/orphans; kerning on headlines; no FOUT/FOIT (font-display + metric-matched fallbacks).

### Color & contrast
- All text meets WCAG (body ≥4.5:1, large/UI ≥3:1, placeholders ≥4.5:1 — the muted-gray default is the #1 fail); no hard-coded colors (all tokens); works in all theme variants; same color = same meaning everywhere; visible focus indicators with sufficient contrast; **never gray text on a colored background** (use a shade of that color or a transparency).

### Interaction states
Every interactive element needs all of them — missing states create broken experiences:
- default · hover · focus (never removed without replacement) · active · disabled · loading · error · success

### Micro-interactions & transitions
- Smooth 150–300ms transitions; ease-out-quart/quint/expo (never bounce/elastic); no jank (bound expensive paint, avoid layout-property animation); motion serves purpose; **respects `prefers-reduced-motion`**.

### Content & copy
- Consistent terminology (same thing = same name everywhere); consistent capitalization (Title Case vs Sentence case, applied uniformly); no typos; appropriate length; punctuation consistency (periods on sentences, not on labels).

### Icons & images
- One icon family/style; consistent sizing; optical alignment with text; alt text on all images; no layout shift (aspect ratios); retina/2x where relevant.

### Forms & inputs
- All inputs labeled; clear required indicators; helpful consistent error messages; logical tab order; validation timing consistent (on-blur vs on-submit); don't overuse auto-focus.

### Edge & error states
- Loading feedback on all async actions (skeletons, not mid-content spinners); welcoming empty states that teach (not "nothing here"); clear errors with recovery paths; success confirmation; handles very long / missing content.

### Responsiveness
- All breakpoints; **44×44px touch targets**; no text <14px on mobile; no horizontal scroll; logical reflow.

### Performance
- Fast critical path; no layout shift on load (CLS); no lag/jank; optimized images; lazy-load off-screen content.

### Code quality
- Remove console logs / commented code / unused imports; consistent naming; no `any` or ignored TS errors; semantic HTML + proper ARIA. Replace custom reimplementations with the shared component; delete orphaned code; consolidate any new values into tokens where they belong.

## Verify (final)

Before marking done — **treat automation carefully**: run a detector or QA command if available and fix the defects it finds, but never cite a clean result as proof the work is polished.
- **Use it yourself** — actually interact with the feature, all states, not just the happy path
- **Fresh eyes** — look at it as if you've never seen it; the little things add up
- Zoom in until alignment is right and spacing reads as deliberate. Then ship.

**Never**: polish before functional completeness; polish without design-system alignment; guess at design-system principles instead of asking; introduce bugs while polishing; fix one screen's spacing while leaving systematic drift elsewhere (fix the system); create new one-off components when shared ones exist; hard-code values that should be tokens; introduce patterns that diverge from established ones.

## What to produce

- **Code changes** — small, reviewable commits per dimension. Primarily: token usage, states, alignment, copy, a11y, and swaps from one-offs to shared components. No new direction, no new features.
- **`docs/adr/`** — if the project uses ADRs, record the pass:

```markdown
# [NNNN] - Polish pass on [module]
**Date**: [today]
**Module**: [module-name]
**Status**: Accepted
## Context
The module was designed (proto-design) and functionally complete. Pre-ship polish needed.
## Decision
Aligned to design system (drift resolved by root cause), then polished: [contrast/states/alignment/IA/a11y/...]. Quality bar: [MVP|flagship].
## Impact
The module ships. Re-run proto-audit later for a fresh baseline on evolved code.
```

If the project has no ADR convention, skip it.

## After polishing

**Commit this skill's work first** — see the Git checkpoint section's "After your work" step (`proto-polish: <summary>`) — then do the handoff below.

Tell the user:
1. What was polished — per dimension (alignment/states/contrast/IA/a11y/copy/...)
2. Drift found and how it was resolved by root cause (missing token / one-off / conceptual)
3. The quality bar you hit (MVP / flagship) and anything deferred to a follow-up
4. How to view it (the detected dev command)
5. That the app does everything it did before — only more precise

Suggest next steps:
- "Moduł gotowy do shippa. Odpal proto-design + proto-polish na kolejnym module"
- "Po zmianach w kodzie — odpal proto-audit żeby zobaczyć świeży baseline"
- "Jeśli direction trzeba doprecyzować — proto-brand, a potem design + polish od nowa na zmienionym"
