---
name: proto-strategize
description: >
  Analyze project documentation from proto-init and proto-deepen to identify design modules,
  their relationships, and prototyping priorities. Use this skill when the user wants to split
  their app into manageable design areas, plan which parts to prototype first, or understand
  the module structure of their application. Triggers on: "strategize", "split into modules",
  "plan the prototype", "what to design first", "module breakdown", "design areas",
  "prioritize features". Use after proto-init and proto-deepen.
---

You are a UX strategist. The project has already been explored through `proto-init` and `proto-deepen`. Your job is to synthesize everything into a clear module breakdown with priorities.

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

Read all files in `docs/`:
- `docs/PROJECT.md` — core idea, user problems, key actions
- `docs/GLOSSARY.md` — shared terminology
- `docs/ENTITY_MAP.md` — entities and their relationships
- `docs/ACTIONS.md` — complete action inventory

If PROJECT.md or ENTITY_MAP.md don't exist, tell the user to run `proto-init` and `proto-deepen` first.

## What this skill does

Identify design modules — self-contained areas of the application that can be prototyped independently. For each module, determine what it contains, how it connects to other modules, and how important it is relative to the rest.

This skill does **not** write any code. It synthesizes understanding into a plan.

## Before writing — check existing files

Check if `docs/MODULES.md` already exists. If it does, tell the user what's there and ask whether to update or skip.

## Process

This is a synthesis skill, not an interview. The data already exists — you're analyzing it and proposing a structure.

### Step 1: Analyze

Read all docs/ files and identify natural clusters:

- Which entities and actions are tightly coupled? (they reference each other, share state, the user does them in sequence)
- Which are relatively independent? (user can do them without touching the others)
- Which actions directly serve the core problem described in PROJECT.md?

Use the entity relationships in ENTITY_MAP.md as the primary signal for clustering. Entities that reference each other strongly tend to belong together. Entities connected only by one weak link are natural boundaries.

### Step 2: Propose modules

**Module names must be in English** — they will become folder names and code namespaces. Even if the user speaks another language during the interview, use English identifiers (e.g., "meal-planning", "recipe-management", not "planowanie-posilkow").

Present your proposed module breakdown to the user. For each module, explain:
- What entities and actions it covers
- Why you grouped them together (what's the shared purpose)
- What type it is:
  - **Core** — directly solves the main user problem from PROJECT.md
  - **Supporting** — needed for core to work, but not the reason users come
  - **Generic** — infrastructure (auth, settings, notifications) that any app needs

For connections between modules, list the integration points — where one module needs something from another. Keep it concrete: "Recipes → Meal Planning: add recipe to meal plan day".

For prototyping order, suggest which module to design first. Core modules first, then supporting, then generic. Within the same type, prioritize modules that other modules depend on.

Also flag priorities — which areas deserve the most design attention because they're the most complex, the most risky, or the most impactful for the user.

### Step 3: Validate

Ask the user if the breakdown makes sense. Common adjustments:
- Merging two modules that the user sees as one area
- Splitting a module that's too big to prototype in one go
- Reprioritizing based on user's gut feeling or business context

Don't argue if the user wants a different split. They know their domain. Adjust and move on.

### Step 4: Write

## Writing the documentation

### docs/MODULES.md

```markdown
# Module Breakdown

## Overview
[Brief summary of how the app breaks down into design modules]

## Modules

### [Module Name]
**Type**: Core / Supporting / Generic
**Description**: [What this area of the app does, in 2-3 sentences]
**Entities**: [List of entities from ENTITY_MAP.md that belong here]
**Key Actions**: [Most important actions from ACTIONS.md that belong here]
**Connects to**: [Other modules and the specific integration points]
**Design priority**: High / Medium / Low — [why]

---

## Integration Map

```mermaid
graph LR
    A[Module A] -->|integration point| B[Module B]
    B -->|integration point| C[Module C]
```

## Prototyping Order

1. **[Module]** — [reason it goes first]
2. **[Module]** — [reason]
3. ...

## Priority Areas

- **[Area/Module]**: [Why this deserves the most design attention — complexity, user impact, risk]
```

The Mermaid graph should show modules as nodes and integration points as edges. Keep it at module level, not entity level — ENTITY_MAP.md already has the entity diagram.

### docs/GLOSSARY.md update

If new terms emerge during the module discussion (module names, integration concepts), append them to the glossary. Usually this is minimal.

## After writing

**Commit this skill's work first** — see the Git checkpoint section's "After your work" step (`proto:<skill>: <summary>`) — then do the handoff below.

Tell the user where the file is and summarize: how many modules, which are core, what to prototype first, and what the highest-priority design areas are. Ask if they want to adjust anything.
