---
name: proto-harden
description: >
  Harden a module's lo-fi prototype by implementing the edge-case states the happy path skips —
  empty, error, loading, validation, confirmation/undo, flow dead-ends, and LocalStorage
  failure. Works with the existing stack from proto-lofi (React + shadcn/ui + LocalStorage) and
  never migrates frameworks. Reads docs/modules/[module-name]-edgecases.md, asks the designer
  how each ambiguous case should behave (one question at a time, with the audit's suggested
  behavior as the recommended default), then implements the states into the existing screens
  with matching Storybook stories and accessibility checks. Use after proto-edgecases when the
  diagnosis exists, or run directly (it does a quick inline stress test first). This skill
  writes code. Triggers on: "harden", "harden the prototype", "handle the edge cases",
  "implement edge cases", "add empty states", "add error states", "make it robust",
  "wzmocnij", "wzmocnij prototyp", "obsłuż przypadki brzegowe", "dodaj empty states",
  "dodaj stany błędów", "zrób z tego solidny prototyp". This is NOT the skill for adding
  features or visual polish — it makes the existing flows handle every path, including the
  broken ones.
---

You are hardening a working lo-fi prototype. The happy paths work; now you make the prototype robust against everything else — empty screens, failed actions, invalid input, destructive mistakes, dead-ends, and the LocalStorage layer quietly failing. You act on the diagnosis from `proto-edgecases`. Where the behavior is obvious, you implement it directly; where it's a genuine design choice, you ask the designer (one question at a time). You don't add features, you don't change what the happy path does, and you don't add visual polish — you make the existing flows handle every path. Restraint and correctness are the whole point of this skill.

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
2. `git add -A && git commit -m "proto-<skill>: <short summary>"` — e.g. `proto-harden(recipe-management): implement edge-case states`.
3. Tell the user the commit hash and what's in it.

The two commits are separate on purpose: the first locks in whatever came before (a previous skill's output, or a manual edit); the second locks in this skill's work.

## Prerequisites

Read before starting:
- `docs/modules/[module-name]-edgecases.md` — the diagnosis (it tells you exactly what's missing and in what order)
- `src/modules/[module-name]/` — the prototype you're hardening
- `docs/modules/[module-name].md` — the module spec, for context on each flow
- `docs/ACTIONS.md`, `docs/ENTITY_MAP.md`, `docs/GLOSSARY.md` — only if a gap touches an action or entity

If `docs/modules/[module-name]-edgecases.md` doesn't exist, do a quick inline stress test first: skim the screens against the categories in `proto-edgecases` (empty/error/validation/confirmation/loading/flow/storage) and tell the user what you found. You don't need the full audit to start, but it helps.

Check the project builds and runs (`npm run dev` / the detected dev command). If it doesn't, tell the user to fix that first — this skill hardens a *working* prototype, it doesn't rescue a broken one.

## Which module?

The user should specify which module to harden. If they don't, list modules from `docs/MODULES.md` and ask. Only work on **one module per session**.

## What harden is and isn't

**Harden IS:**
- Empty states (placeholder + CTA, never a blank screen)
- Error states (inline / toast / banner — never `alert()`), with a recovery path
- Loading states (skeletons matching layout, not generic spinners) and in-flight indicators (disable + spinner while an action runs)
- Field validation (inline, accessible — `aria-invalid`, `aria-describedby`)
- Confirmation on destructive actions (shadcn `AlertDialog`); undo where the designer chose it
- Flow dead-ends fixed — back navigation, unsaved-changes warnings, deep-link survival
- LocalStorage failure handling (the prototype's "backend" is the browser — a failed/full save must tell the user)
- Every state implemented gets a Storybook story and passes the a11y panel
- Working with the existing stack — no framework or library migration

**Harden IS NOT:**
- New features or new screens — only states on existing flows
- Changing happy-path behavior — the app must do exactly what it did before, just safer
- Visual polish, brand character, signature moments — that's a later `proto-design`
- Rewriting screens — targeted, reviewable changes to existing components

## Decisions — ask the designer

Ask **one at a time**. For every gap that's a genuine design choice, frame it concretely against the screen and offer the audit's *suggested behavior* as the recommended option. Everything else you decide yourself.

**Scope** — "Chcesz zahardować cały moduł, czy konkretne flow / ekrany?" (Default: the whole module, in priority order.)

Then, per ambiguous gap (only the ones the audit flagged as not obvious), for example:
- "Lista [entity] z bardzo długą nazwą — skrócić z `…`, zawinąć w drugą linijkę, czy rozwijać po kliknięciu? (audit sugeruje: skrócić)"
- "Błąd zapisu (LocalStorage pełne) — toast z retry, czy banner na górze ekranu? (audit sugeruje: banner)"
- "Czy przy usuwaniu [entity] dać undo, czy tylko potwierdzenie? (audit sugeruje: potwierdzenie)"

Do not ask about technical choices (which component holds the state, how validation is wired, where the error boundary lives) — those are yours. The designer cares about what they see and interact with, not how it's implemented.

## Apply in priority order

Work top-down through the priority list from `docs/modules/[module-name]-edgecases.md` (or your inline scan). Each step makes the next more obvious; the early steps carry the most user impact for the least risk. Keep the app running after each step.

1. **Blockers & data loss** — replace `alert()`/`window.alert()` with real error states; surface silent LocalStorage write failures (try/catch around saves → toast/banner); add empty states to entry screens so the user never lands on a blank page.
2. **Empty & error states on primary screens** — every list/detail/form handles "no data" and "something went wrong" with a recovery path.
3. **Validation on the main create/edit forms** — required-field and format checks, inline and accessible, blocking invalid submits.
4. **Confirmation on destructive actions** — `AlertDialog` before delete/archive/discard; undo where decided.
5. **Loading & in-flight states** — skeletons on initial load; disable + spinner on actions while they run; prevent double-submit.
6. **Flow dead-ends & navigation** — back buttons, unsaved-changes warnings, deep-links and mid-flow refresh surviving.
7. **Cross-module / lifecycle / storage edges** — referenced-item-deleted handling, orphaned data, offline behavior, storage quota.
8. **Polish** — skeletons on secondary loads, long-text overflow, long-list behavior.

## Implementing the states

Add states into the **existing** prototype components — don't rebuild screens:

- **Empty states** — a handling for the "no data" case with a CTA matching the screen's primary action
- **Error states** — replace every `alert()` with an inline error, shadcn toast (sonner), or a top banner as decided; always include a recovery action (retry / go back)
- **Loading states** — skeletons matching the real layout shape on initial load; in-flight indicator (disabled button + spinner) on every async action
- **Validation** — field-level errors with accessible messaging (`aria-invalid`, `aria-describedby`, visible message); block submit until valid
- **Confirmation & undo** — shadcn `AlertDialog` for destructive actions; toast-with-undo where the designer chose undo
- **Storage failure** — wrap LocalStorage writes (the `useLocalStorage` hook or its callers) so a throw or `QuotaExceededError` surfaces to the user instead of vanishing

Every state you implement gets a **Storybook story** showing it (empty, error, loading, validation-failed, confirm-open) — mirroring `proto-lofi`'s one-story-per-state pattern. The a11y panel must pass on each story.

## Verify

After each major step:
- Run the project — the app still builds and runs, all routes still work, data still saves
- Click through the happy paths — nothing broke, behavior unchanged
- Click through the edge paths you just hardened — empty (clear storage), invalid submit, cancel a destructive action, trigger a storage failure if you can
- Open each new state's Storybook story — it renders and the a11y panel is clean

The acceptance test: every flow now handles its broken paths as deliberately as its happy path, and the happy path still does exactly what it did before.

## What to produce

- **Code changes** in `src/modules/[module-name]/` — states added to existing screens/hooks, plus their Storybook stories. Small, reviewable changes per priority step. Keep everything within the existing stack.
- **Update `docs/modules/[module-name]-edgecases.md`** — mark each implemented row ✅ with the `file:line` where it now lives. Leave deferred rows (designer chose to skip) as ❌ with the reason noted — never silently drop a gap.
- **Sync `docs/modules/[module-name].md`** — update the Edge Cases section to match what's now real (the decided behaviors), and the Screens section if a new state changed a screen.
- **`docs/adr/`** — if hardening revealed a **new action, state, or entity** (not just a UI state), add it to `ACTIONS.md` / `ENTITY_MAP.md` and record an ADR (same format and lazy-create convention as `proto-detail`). Most hardening won't touch the model — only structural changes do.

```markdown
# [NNNN] - [Module] prototype hardened
**Date**: [today]
**Module**: [module-name]
**Status**: Accepted
## Context
The module's prototype handled happy paths but not edge cases (see docs/modules/[module]-edgecases.md).
## Decision
Implemented [n] edge-case states: empty/error/validation/confirmation/loading/[...]. Deferred: [list with reasons].
## Impact
The prototype now handles every flow path, not just the happy one. Visual polish is a separate future proto-design pass.
```

If the project has no ADR convention, skip it.

## After building

**Commit this skill's work first** — see the Git checkpoint section's "After your work" step (`proto-<skill>: <summary>`) — then do the handoff below.

Tell the user:
1. What changed — per priority step (empty/error states, validation, confirmations, loading, flow fixes, storage handling)
2. How many gaps closed vs deferred (with reasons)
3. The single biggest fragility you removed (usually a silent save failure or a blank entry screen)
4. How to see it: `npm run storybook` (each state has a story) and `npm run dev` to click through happy and edge paths

Suggest next steps:
- "Przetestuj prototyp z userami — teraz pokrywa też ścieżki błędne, nie tylko happy path"
- "Odpal ponownie proto-edgecases żeby zobaczyć nowy baseline po zahardowaniu"
- "Możesz odpalić proto-harden na kolejnym module"
