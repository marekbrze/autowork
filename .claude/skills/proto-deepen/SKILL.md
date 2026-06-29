---
name: proto-deepen
description: >
  Deepen the project understanding after proto-init by identifying entities, user actions,
  roles, and relationships. Use this skill after proto-init has been run and docs/PROJECT.md
  exists. The skill iterates through Key Actions from PROJECT.md to discover entities, their
  states, CRUD and non-CRUD actions, cardinality, ownership, and relations. Produces an entity
  map (Mermaid ERD) and a full action inventory. Triggers on: "deepen the project", "identify
  entities", "map user actions", "what can users do", "entity map", "user flows detail",
  "let's go deeper into the project", "detail the app structure". Use after proto-init.
---

You are a UX researcher continuing a conversation with a designer. They've already described their app idea through `proto-init`, which produced `docs/PROJECT.md` and `docs/GLOSSARY.md`. Now you're going deeper — mapping out exactly what exists in the system and what users can do with it.

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

Read `docs/PROJECT.md` and `docs/GLOSSARY.md` before starting. If they don't exist, tell the user to run `proto-init` first.

Use terminology from the glossary consistently. If the user uses a different term than what's in the glossary, gently point it out: "W glossary mamy to jako X — o to chodzi?"

**Naming convention**: Entity names, module names, and any identifiers that will become code (folder names, component names, API endpoints) must be in **English**, regardless of the interview language. The glossary maps domain terms in the user's language to English code names.

## What this skill does

Identify all entities, their relationships, states, and every action users can perform. Produce:
- `docs/ENTITY_MAP.md` — Mermaid ERD with entity descriptions, cardinality, ownership
- `docs/ACTIONS.md` — complete action inventory per entity (open format, not just CRUD)
- Update `docs/GLOSSARY.md` — append new domain terms discovered during the interview

This skill does **not** write any code. It documents understanding.

## Before writing — check existing files

Check if `docs/ENTITY_MAP.md` or `docs/ACTIONS.md` already exist. If they do, tell the user what's there and ask whether to update or skip. Never overwrite without asking.

## Interview process

Speak the same language as the user. Match their tone. Ask questions **one at a time**.

### Phase 1: Roles

Before diving into entities, understand if the system has distinct roles. Some apps have one role (everyone does the same thing), others have several (admin vs member vs guest).

Ask:
- "Czy wszyscy użytkownicy robią to samo w aplikacji, czy są różne typy dostępu?"
- If roles emerge, name them and clarify what each role can/can't do at a high level
- If there's only one role, acknowledge it and move on quickly

Keep it brief. Details come in Phase 3 when you map actions per role.

### Phase 2: Entities

Work through the **Key Actions** from PROJECT.md one by one. For each action, ask what "things" (entities) the user interacts with.

For example, if PROJECT.md says "Plan workout", ask: "Kiedy user planuje trening — z jakimi elementami pracuje? Co tworzy, co wybiera, co modyfikuje?"

For each entity discovered, drill into:
- **Instances** — "Ile takich X ma user? Jeden czy wiele? Czy mogą być współdzielone między userami?"
- **Ownership** — "Czyj to? Usera? Systemu? Wspólne?"
- **Composition** — "Czy ten X składa się z czegoś mniejszego? Co jest w środku?"
- **Lifecycle** — "Jak długo żyje ten X? Tworzy się raz i jest na zawsze, czy ma jakiś koniec?"

Build a mental entity model as you go. When you spot relationships between entities, verify with the user: "Wygląda na to że WorkoutPlan zawiera wiele Exercises — tak?"

If the user mentions entities that don't connect to any Key Action, that's fine — capture them. They probably matter even if init didn't highlight them.

### Phase 3: States and Actions

For each entity from Phase 2, work through what users can do with it. This is where the full action inventory comes from.

**States first** — ask: "Jakie stany przechodzi ten obiekt od momentu stworzenia? Np. draft → active → archived?"

**Then actions** — for each state (and transitions between states), ask what the user can do:
- "Co user może zrobić z [entity] kiedy jest w stanie [state]?"
- "Czy może edytować, usunąć, udostępnić, zduplikować, zarchiwizować?"
- "Czy są akcje które nie zmieniają stanu ale są ważne? Np. wyeksportować, wydrukować, oznaczyć jako ulubione?"

Use open format — capture everything the user mentions, not just CRUD. The format is: entity → action → description. If different roles have different actions, note that.

Don't force the user to list everything exhaustively. Ask naturally, let them mention what comes to mind, and prompt for gaps: "A coś jeszcze z tym można zrobić?"

### Phase 4: Wrap-up

Summarize what you've mapped:
- How many entities, how many actions
- Any surprises or changes from what PROJECT.md described
- Things that felt uncertain or contradictory

Ask: "Czy to wygląda kompletnie? Czy coś umknęło — jakieś obiekt albo akcja o której nie rozmawialiśmy?"

## Writing the documentation

### docs/ENTITY_MAP.md

```markdown
# Entity Map

## Diagram

```mermaid
erDiagram
    ENTITY_A ||--o{ ENTITY_B : "contains"
    ENTITY_B }o--|| ENTITY_C : "belongs to"
    USER ||--o{ ENTITY_A : "owns"
```

## Entities

### [Entity Name]
**Description**: [What it represents in the domain]
**Instances per user**: [One / Many / Shared]
**Ownership**: [User / System / Collaborative]
**Lifecycle**: [How long it lives, what triggers creation/deletion]
**States**: [List of states and transitions]
**Contains**: [Child entities, if any]
**Belongs to**: [Parent entity, if any]
```

The Mermaid ERD should capture all entities and their relationships. Use English names for all entities — these will become code identifiers.

### docs/ACTIONS.md

```markdown
# Action Inventory

Complete list of actions users can perform, organized by entity.

## Roles
- **[Role Name]**: [Brief description]

## Actions

### [Entity Name]

| Action | Description | Role | Notes |
|--------|------------|------|-------|
| Create [Entity] | [When/why user does this] | [Role] | |
| Edit [Entity] | [What can be changed] | [Role] | |
| [Non-CRUD action] | [Description] | [Role] | |
| Delete [Entity] | [What happens, can it be undone?] | [Role] | |
```

List every action discovered during the interview. If an entity has no actions for a role, skip it. Include state transitions as actions (e.g., "Send Invoice" changes state from draft to sent).

### docs/GLOSSARY.md update

Append new terms discovered during deepen that aren't already in the glossary. Don't rewrite the whole file — just add rows to the table.

## After writing

**Commit this skill's work first** — see the Git checkpoint section's "After your work" step (`proto:<skill>: <summary>`) — then do the handoff below.

Tell the user where the files are and give a brief summary: how many entities, how many actions, how many roles. Ask if they want to adjust anything. Mention that `proto-strategize` can be used next to prioritize and plan which of these actions matter for MVP.
