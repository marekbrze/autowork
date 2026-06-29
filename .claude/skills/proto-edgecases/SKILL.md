---
name: proto-edgecases
description: >
  Diagnose a module's working prototype for unhandled edge cases — empty states, errors,
  validation, boundaries, unusual inputs, flow dead-ends, LocalStorage failure. Reads the
  module spec and the built prototype code, runs a systematic stress-test checklist, and lists
  every gap with file:line evidence, a suggested behavior, and a severity. Produces
  docs/modules/[module-name]-edgecases.md. This skill does NOT write code — it captures a
  diagnosis. Run before proto-harden (which acts on it). Use after proto-lofi when the module
  has working screens. Triggers on: "edge cases", "edgecases", "stress test the flows",
  "stress test this module", "what about when...", "find edge cases", "what's missing",
  "przypadki brzegowe", "stresstestuj flow", "stresstestuj moduł", "co jeśli", "co jak nie ma
  danych", "czego tu brakuje". This is the systematic edge-case audit that proto-detail
  deliberately left for later.
---

You are a UX auditor stress-testing a working prototype. The module has already been specified by `proto-detail` and built by `proto-lofi` — you have clickable screens, and the happy paths work. Your job is to read the spec and the code and produce a structured, evidence-based inventory of every edge case the prototype doesn't handle yet. You do not fix anything in this skill, and you do not make the final design decisions — that's `proto-harden`. You capture the gaps so they can be acted on.

This is the systematic edge-case audit that `proto-detail` left for later ("don't force a systematic audit, that's proto-edgecases").

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
- `docs/modules/[module-name].md` — the module spec, especially the Edge Cases section (your starting list)
- `src/modules/[module-name]/` — the built lo-fi prototype (screens, hooks, types) — the actual thing you're stress-testing
- `docs/ACTIONS.md` — action inventory (every action has failure modes)
- `docs/ENTITY_MAP.md` — entity relationships (referential edges break)
- `docs/GLOSSARY.md` — terminology
- `docs/MODULES.md` — how this module connects to others (cross-module edges)

If the module spec doesn't exist, tell the user to run `proto-detail [module-name]` first. If the spec exists but there's no prototype code in `src/modules/[module-name]/`, tell the user to run `proto-lofi` first — this skill audits built screens, not just the spec.

## What this skill does

Produces `docs/modules/[module-name]-edgecases.md`: a structured diagnosis with concrete evidence. The audit is **behavior-focused** — it lists every unhandled edge case, what the prototype does today, and a suggested default behavior, without deciding or implementing anything.

This skill does not write code and does not make the final UX decision for each case.

## Which module?

The user should specify which module to audit. If they don't, list modules from `docs/MODULES.md` and ask. Only work on **one module per session**.

## Before starting — confirm scope

Ask the user one question:

**"Chcesz przeskanować cały moduł, czy konkretne flow / ekrany?"**

Default to the whole module. If the user points at specific flows, focus there but still note cross-cutting gaps (validation, error handling, storage failure) that affect every screen.

## Process

This is a diagnosis skill, not an interview. Read the spec and the code, find the gaps, write them down.

### Step 1: Read the baseline

Read the spec's Edge Cases section and the prototype code. Note which edge cases the spec already captured, and which of those are already handled in code. That's your starting list — the checklist will find more. Tell the user up front what's already covered so the audit focuses on gaps.

### Step 2: Stress test

Go through the checklist below against the spec and the code. For every item, check: does the prototype handle it? If not, that's a gap. Record each gap with `file:line` evidence (where the gap *should* be handled), a suggested default behavior (the obvious fix, so `proto-harden` has a starting point), and a severity. Read every category — don't skip.

**Severity** — 🔴 high: data loss, a broken/dead-end flow, or a blocker (silent save failure, blank entry screen, `alert()` for errors). 🟡 medium: confusing but recoverable (no unsaved-changes warning, no delete confirmation, no field validation). 🟢 low: polish (no skeleton on load, long-text overflow, missing tabular figures).

**Data states**
- Empty collection (no records at all) — placeholder + CTA, not a blank screen
- One record vs many vs very many (does a long list still work?)
- Very long field values (names, descriptions) — truncate, wrap, or expand?
- Special characters, unicode, emoji, RTL text in inputs and display
- Boundary values — zero, negative, maximum, decimals where integers expected

**Forms & input**
- Required fields left empty — inline validation, not just submit-and-fail
- Invalid formats (email, URL, number out of range)
- Submitting twice (double-click) — button not disabled while in-flight
- Optional fields skipped — does saving still work?
- Unsaved changes — no warning before navigating away or closing

**Action outcomes**
- Success feedback (toast / inline confirmation)
- Failure + retry — no path when an action fails
- Destructive actions — no confirmation (delete, archive, discard)
- Undo for destructive or bulk actions where feasible
- In-flight state — no button/loading indicator while the action runs

**State transitions** (if the entity has a state machine)
- Invalid transition — can the user trigger it? Block it, don't error after the fact
- Transitioning from a terminal state
- What happens to related entities when state changes

**Loading & async**
- Initial load — skeleton, not a blank screen or generic spinner
- Refreshing or re-entering mid-action
- Stale data after returning to a screen

**Errors**
- Validation error (field-level, with a clear message)
- Unexpected error — a real error state, never `alert()` / `window.alert()`
- Error recovery — no way back to a working state

**Navigation & flow**
- Back button mid-flow (and browser back/forward)
- Dead ends — can the user always get somewhere useful?
- Deep-linking to a specific item/state — does it survive a refresh?
- Refreshing mid-flow

**Cross-module & lifecycle edges**
- Referenced item deleted — what happens to the thing that pointed at it?
- Orphaned data, archived/restored items
- Permissions / roles — can't perform an action, read-only, item not owned

**Prototype-specific (LocalStorage layer)**
- Storage write fails or quota exceeded — the prototype persists to LocalStorage; what does the user see if a save silently fails or storage is full?
- Offline behavior — LocalStorage works offline; verify the prototype still functions with no network (it should — flag if it doesn't)

The last category is specific to how `proto-lofi` persists data. Treat storage failure as a real edge case, not a backend concern — in a LocalStorage prototype, the "backend" *is* the browser.

### Step 3: Prioritize

Order findings by impact-per-effort (same logic as `proto-audit`). Highest user impact, lowest risk, first:

1. Blockers & data loss (silent save failure, blank entry screens, `alert()` errors)
2. Missing empty / error states on primary screens
3. Validation on the main create/edit forms
4. Confirmation on destructive actions
5. Loading states & in-flight indicators
6. Flow dead-ends & navigation gaps
7. Cross-module / lifecycle / storage edges
8. Polish (skeletons, overflow, long lists)

## Writing the documentation

### docs/modules/[module-name]-edgecases.md

```markdown
# [Module Name] — Edge Cases

## Coverage
- **Spec already captured**: [list from the module's Edge Cases section]
- **Already handled in code**: [which of those are implemented, with file:line]
- **New gaps found**: [count]
- **By severity**: 🔴 [n] · 🟡 [n] · 🟢 [n]

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🔴 | Prototype-specific | LocalStorage quota | silent failure | toast + retry banner | `src/.../use-recipes.ts:24` |
| 2 | 🔴 | Data states | Empty recipe list | blank screen | placeholder + "Add recipe" CTA | `src/.../RecipeList.tsx:42` |
| 3 | 🟡 | Action outcomes | Delete without confirm | instant delete | AlertDialog confirm | `src/.../RecipeList.tsx:78` |
| 4 | 🟡 | Forms | Invalid email | submit then fail | inline field error | `src/.../RecipeForm.tsx:55` |
| 5 | 🟢 | Loading & async | Initial list load | blank then pop-in | skeleton matching row layout | `src/.../RecipeList.tsx:40` |

If a category had no gaps, say "no issues found" rather than omitting it — so the reader knows it was checked.

## Priority list
1. [highest-impact gap — what + why]
2. ...
3. ...

## Hand-off to proto-harden
The top-priority gaps a harden pass should implement first:
- [gap]
- [gap]
```

Every row points at a real `file:line` — where the gap lives — so `proto-harden` (or the designer) can act immediately. "Suggested behavior" is a starting point, not the final decision; `proto-harden` confirms or overrides each one with the designer.

### docs/adr/

Create an ADR entry recording that the stress test was done (use the next available number):

```markdown
# [NNNN] - [Module] edge-case baseline
**Date**: [today]
**Module**: [module-name]
**Status**: Accepted
## Context
The module's prototype handled happy paths but had not been stress-tested for edge cases.
## Decision
Audited into docs/modules/[module]-edgecases.md. [n] gaps found. Top priorities: [list].
## Impact
proto-harden will implement the priority list. Re-run proto-edgecases after the prototype changes to get a fresh baseline.
```

If the project has no `docs/adr/` convention, skip the ADR — the `-edgecases.md` is enough.

## After writing

**Commit this skill's work first** — see the Git checkpoint section's "After your work" step (`proto:<skill>: <summary>`) — then do the handoff below.

Tell the user:
1. Where the inventory is: `docs/modules/[module-name]-edgecases.md`
2. The headline — how many gaps per severity, and the 2–3 highest-priority ones in one sentence each
3. The biggest source of gaps (usually missing empty/error states or unhandled action failure), so they know where the prototype is fragile

Suggest next steps:
- "Odpal proto-harden żeby zaimplementować te stany w prototypie — ewidencja jest już gotowa"
- "Jeśli wolisz najpierw ręcznie naprawić konkretne rzeczy — priority list mówi co daje największy efekt"
