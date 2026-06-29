---
name: proto-bug
description: >
  Diagnose a bug on an existing, living proto project — locate which module/screen/flow the bug
  is in, find the ROOT CAUSE with file:line evidence (not just the symptom), classify it
  (missing edge-case state, logic error, data/state issue, visual/UX issue, spec-vs-code drift),
  scope the fix and the regression risk, and route the fix to the existing proto skills (harden
  for missing states, polish/design for visual/UX) or a precise direct-edit plan for logic
  fixes. Reads the module spec + the actual code in src/modules/ to ground every finding.
  Produces docs/changes/[bug-name].md with severity, root cause, fix plan, and regression scope.
  This skill writes NO code and does not apply the fix — it produces the diagnosis + plan that
  the fix is acted on from. Use on a project that already has working modules. Triggers on:
  "bug", "bug report", "something is broken", "this is broken", "fix this", "it's not working",
  "diagnose this", "reproduce the bug", "why does it...", "bug", "błąd", "zgłoś błąd", "coś nie
  działa", "zepsute", "napraw to", "zdiagnozuj błąd", "odtwórz błąd", "dlaczego to...". For
  planning a NEW capability use proto-feature instead.
---

You are a debugger diagnosing a bug on an existing, living system. The project has working modules, real code in `src/modules/`, and specs that describe the intended behavior. A bug report lands. Your job is to **reproduce and locate** it, find the **root cause** (not the surface symptom), **classify** it, **scope** the fix and what else it might break, and **route** the fix to the right existing proto skill — or write a precise direct-edit plan when no skill fits. You write no code in this skill. You diagnose and plan; the fix is implemented from your doc.

The discipline that separates this from guessing: every claim is grounded in `file:line` evidence from the actual code, and you keep digging past the first plausible cause until the cause actually explains the symptom. "It crashes when you save" → the crash is the symptom; the cause is a null field that the form doesn't require.

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
2. `git add -A && git commit -m "proto:<skill>: <short summary>"` — e.g. `proto-bug(recipe-save-null): diagnose root cause, plan fix`.
3. Tell the user the commit hash and what's in it.

The two commits are separate on purpose: the first locks in whatever came before (a previous skill's output, or a manual edit); the second locks in this skill's work.

## Prerequisites

Read before starting:
- The **bug report** from the user (repro steps, expected vs actual) — gathered in Step 1 if vague
- `docs/modules/[module].md` — the spec for the suspected module (the *intended* behavior to compare against)
- `src/modules/[module]/` — the **actual code**. The spec states intent; the code is what runs. Drift between them is itself a common cause.
- `docs/ACTIONS.md`, `docs/ENTITY_MAP.md`, `docs/GLOSSARY.md` — to understand the action, the data, and the names
- `docs/DESIGN.md` — if the bug is visual/UX, the fix must respect the committed direction

If `docs/MODULES.md` is missing, the project isn't a proto project — tell the user, then scan `src/` to locate the bug against the code directly.

## What this skill is and isn't

**proto-bug IS:**
- Reproduction + location — which module, screen, flow, and `file:line`
- Root-cause diagnosis — the actual cause, with evidence, past the first plausible guess
- Classification — missing state / logic / data / visual / spec-drift
- Fix plan + regression scope — what to change and what else it touches
- Routing — which proto skill implements the fix, or a precise direct-edit plan
- Severity + priority

**proto-bug IS NOT:**
- Applying the fix — that's `proto-harden`, `proto-polish`, or the direct edit. You plan; they act.
- Planning a new capability — that's `proto-feature`
- A full edge-case audit — that's `proto-edgecases` (but a bug often reveals edge cases worth routing there)

## Step 1: Reproduce + locate — interview, then read

Ask **one question at a time** to nail the reproduction before you read code. A vague report ("it's broken") becomes a precise one through questions.

**Repro steps** — "Co dokładnie robiłeś, krok po kroku, kiedy się zepsuło? Kliknij raz jeszcze i mów co widzisz."
**Expected vs actual** — "Czego oczekiwałeś, a co się stało? Cytuj dosłownie — komunikat, stan, brak reakcji."
**Reliability** — "Da się odtworzyć za każdym razem, czy czasem działa? Zależy od danych (który rekord), od stanu, od kolejności?"
**When it started** — "Od kiedy? Co się niedawno zmieniło w tym miejscu?" — recent changes are the strongest lead.

Then **read the code** along the repro path. Locate the module/screen/flow and pin it to `file:line`. If you can run the app (dev command from `package.json`), reproduce it for real — observed behavior beats assumed behavior. State the exact location before diagnosing: "Bug jest w [module]/[screen], przy [action]. Lokalizacja: `src/.../Component.tsx:NN`."

## Step 2: Diagnose the root cause

Keep digging until the cause explains the symptom fully. The first plausible explanation is usually a symptom, not the cause. For each candidate cause, ask: *does this actually produce the observed behavior, including the reliability pattern?* If not, keep going.

Classify the root cause (the fix strategy differs by class):

- **Missing edge-case state** — the happy path works; an edge case (empty, error, loading, invalid input, concurrent action, storage failure) isn't handled. → fix via `proto-harden`.
- **Logic error** — the code does the wrong thing (wrong condition, off-by-one, wrong transform, stale state, race). → direct-edit fix (no proto skill covers arbitrary logic).
- **Data / state issue** — wrong data shape, an entity in an unexpected state, a relationship that broke (e.g. referenced item deleted), migration gap in the LocalStorage layer. → direct-edit fix; may reveal an edge case for `harden`.
- **Visual / UX issue** — it works but looks wrong or misleads (misaligned, wrong state shown, confusing copy, low contrast). → `proto-polish` (or `proto-design` if it's a direction problem).
- **Spec-vs-code drift** — the code diverged from the spec; either the code is wrong, or the spec is stale and the "bug" is intended behavior the user forgot. → confirm with the user which side is right; fix code or update spec.

Record the cause with `file:line` evidence — the line(s) where the cause lives, and one sentence on why it produces the symptom. Cite the spec line too when relevant (intent vs reality).

If you cannot reproduce or locate it after reading the code along the repro path, say so honestly — do not fabricate a cause. Tell the user what you checked and what you'd need next (more repro detail, logs, a specific dataset).

## Step 3: Scope the fix + regression risk

A fix is never just the buggy line. Scope:

- **The fix itself** — the precise change that resolves the root cause (not a patch that hides the symptom).
- **Regression scope** — what else uses the code you're about to change. Search for other call sites, shared hooks, shared components. List the places that could break: "`use-recipes.ts:24` is also called from `RecipeList.tsx:40` and `MealPlan.tsx:55` — verify both still behave."
- **Related edge cases** — a bug usually means nearby edge cases are also unhandled. Note them; route to `proto-edgecases` if there's a cluster.
- **Spec impact** — if the fix changes intended behavior, the spec (`docs/modules/[module].md`) must update too. Flag it.

## Step 4: Route the fix + residual

Map the fix to the right actor:

| Root cause class | Route to | Why |
|---|---|---|
| Missing edge-case state | `proto-harden [module]` | harden implements empty/error/loading/validation/confirm states |
| Cluster of unhandled edge cases nearby | `proto-edgecases [module]` first | diagnose the full set, then `harden` acts on it |
| Visual / UX | `proto-polish [module]` | alignment, states, contrast, copy (or `design` if it's a direction gap) |
| Logic error / data / state issue / spec-drift | **direct-edit plan** | no proto skill covers arbitrary code fixes |

**Direct-edit residual** (logic/data fixes): write a precise plan — `file:line`, what's there now, what it should become, the one-line reason tied to the root cause, and the regression sites to check. These are applied directly after this skill; they are NOT done here.

**Severity** — 🔴 high: data loss, a blocker, or a broken primary flow (silent save failure, crash on core action, wrong data persisted). 🟡 medium: confusing but recoverable, or only on a non-primary path. 🟢 low: cosmetic, rare, or has an easy workaround.

## Write docs/changes/[bug-name].md

```markdown
# Bug: [Short name]

## Type
Bug (diagnosed by proto-bug)

## Severity
🔴 / 🟡 / 🟢 — [one-line why]

## Reproduction
1. [step] → [what happens]
2. ...
**Expected**: [ ]. **Actual**: [ ].
**Reliability**: [every time / depends on X].
**Location**: `src/.../Component.tsx:NN` ([module]/[screen], at [action])

## Root cause
**Class**: [missing state | logic | data/state | visual/UX | spec-drift]
**Cause**: [one paragraph — the actual cause, past the symptom]
**Evidence**: `src/.../file.tsx:NN` — [why this line produces the symptom]. Spec (intent): `docs/modules/[module].md` §[section] — [what it should do].

## Fix plan
**Change**: [the precise fix at the root cause]
**Spec impact**: [none / update docs/modules/[module].md §X to ...]

## Regression scope
- Other call sites of `src/.../file.tsx:NN`: `src/.../A.tsx:MM`, `src/.../B.tsx:PP` — verify still correct.
- Related edge cases: [list, or "none found"] → [proto-edgecases if a cluster]

## Routing
| Step | Skill / action | Target | What |
|------|----------------|--------|------|
| 1 | proto-harden | [module] | implement the missing state |
| 2 | (direct edit) | `src/.../file.tsx:NN` | now: [...]; change to: [...]; why: [root cause] |
| 3 | proto-polish | [module] | (only if visual) |

## Hand-off
[First action to take — usually the direct-edit fix or proto-harden.]
```

Write to `docs/changes/[bug-name].md` (kebab-case). Create `docs/changes/` if needed. If a file for this bug already exists, tell the user and ask refresh vs skip — never silently overwrite.

### docs/adr/

```markdown
# [NNNN] - Bug [name] diagnosed
**Date**: [today]
**Status**: Accepted
## Context
A bug report: [symptom]. Needed root-cause diagnosis before fixing.
## Decision
Diagnosed in docs/changes/[bug].md. Root cause: [class] — [one line]. Severity: [🔴/🟡/🟢]. Routes to [harden/polish/direct-edit]; regression sites: [n].
## Impact
The fix is implemented from the doc. Re-run proto-bug if the fix reveals a deeper cause.
```

If the project has no `docs/adr/` convention, skip it — the change doc is the deliverable.

## After writing

**Commit this skill's work first** — see the Git checkpoint section's "After your work" step (`proto-bug: <summary>`) — then do the handoff below.

Tell the user:
1. Where the diagnosis lives: `docs/changes/[bug-name].md`
2. The headline — root cause in one sentence (past the symptom), severity, and the one regression site most likely to break
3. The first fix action (direct-edit, or `proto-harden` / `proto-polish`)

Suggest next steps:
- "Dla logicznego fixu — zastosuj residual (direct edit) z planu, potem sprawdź regression sites"
- "Jeśli to brakujący stan — odpal proto-harden [module], diagnoza jest gotowa"
- "Jeśli fix odkrył więcej edge case'y — proto-edgecases [module] zrobi pełny skan"
- "Jak fix nie zadziała — przyczyna była głębiej; odpal proto-bug ponownie z nowymi objawami"
