# Untitled (working name)

## Core Idea
An app that pulls the user out of planning paralysis by guiding them through an imposed, one-way funnel — from the raw "what's stressing me right now", through ranking, breaking things down into micro-steps and GTD-style processing, all the way to a focus session where one task chases the next under a timer, ending with a moment of celebration that totals up the time spent. The essence: take the burden of deciding "where to start" off the person.

## User Problems
- **Paralysis at the planning stage**: the user gets stuck building to-do lists, abandons them halfway, and can't move to action. It shows up when a lot of things pile up and it's not clear where to start. It feels like helplessness / overwhelm / freezing. Today they cope by making lists — which itself fails, because they break off midway through.
- **No prioritization**: with a long list, they can't pick the first step.
- **The gap between "I have a lot on my mind" and "I'm doing one specific thing right now"**: there's no imposed path that would lead them through it instead of leaving them alone with an empty list.

## Target Users
For now, the project's author — **a personal tool, single-user, local**. Someone who, overwhelmed by tasks, needs to be led by the hand through a ready-made funnel rather than given yet another empty list editor to manage on their own.

**Primary design persona**: a person with **ADHD** (and more broadly, the **overwhelmed**). We tune product decisions around them: a large task paralyzes → we break it into small pieces; we guide with prompts (nudge), we don't force; we treat motivation as fuel that returns at the hard moment (ADR 0007).

## Deployment & Technical Constraints
- **Hosting**: GitHub Pages — static Vite build (SPA).
- **Persistence**: the browser's `localStorage`, **no backend**. Data lives locally, per-browser; no sync between devices. State between sessions is built on a durable, resumable `Run`.
- **Architecture**: single-user, fully client-side.
- **Stack**: React + Vite + TypeScript + Tailwind v4 + shadcn/ui (base-nova). See `package.json`.

## Key Actions
In priority order — the funnel steps themselves are the key actions:

1. **Brain dump** — empty your head of everything that's stressing you right now.
2. **Stress ranking** — order the stressors from most to least stressful.
3. **Next-actions** — for each stressor, list what will move it forward (there can be several).
4. **Processing (GTD-style)** — assign each task a context, energy, and time.
5. **Session selection** — pick context(s) (several allowed), then energy → filter down to the set to do now.
6. **Focus session** — start, timer, done / skip / back to previous.
7. **Celebration** — see the summary (what's done, total time) and clear the finished ones.

## Happy Path
1. You open the app → the question **"What's stressing you right now?"** appears → you type stressor after stressor with Enter (text field, Enter to add).
2. **Ranking** — order the stressors from most to least stressful.
3. The app shows the stressors **one at a time, in order**; under each you write next-action(s) — what can be done to move it forward (there can be many).
4. **Processing** (GTD inbox style, like the *dopadone* app): for each item you specify the **context** (phone, message, creative, errands, home, city), the **energy** needed, and the **time** needed for the task.
5. **Session selection**: first you pick **context(s)** (several allowed), then **energy** → this filters the long list down to the set of tasks you can realistically do right now.
6. You click **Start** → the focus screen of the first task appears (order: most stressful stressor → first) and a **timer counting up from 0** starts; the estimated time (step 4) is the threshold beyond which the timer turns red. The motivation (the WHY from step 3) is **always visible** on the screen.
   - **Done** → the next task starts automatically.
   - **Skip** → the task stays on the list for later; you come back to it later.
   - You can **go back to the previous** task.
7. After the set is exhausted → **session summary**: which tasks got done + **total time** spent on tasks + **stale** tasks (in a separate section) + the **"Clear completed"** button (clears Done + stale; the moment of celebration).

## Decisions (resolved)
Open questions from `proto-init` were resolved in `proto-deepen` and `proto-strategize`. Details in `docs/ENTITY_MAP.md`, `docs/ACTIONS.md`, `docs/GLOSSARY.md`.

- ✅ **App name**: working name **"Autowork"** (set in the scaffold; to change in 3 files).
- ✅ **Persistence between sessions**: yes — `localStorage`; `Run` is durable and resumable (see *Deployment* and `docs/ENTITY_MAP.md`).
- ✅ **Energy scale**: 1–3 (batteries).
- ✅ **Energy selection**: multiple levels at once.
- ✅ **Skipped tasks**: come back at the **next session**.
- ✅ **Timer and return**: the timer **resumes** (remembers its position).
- ✅ **Editing during a session**: focus = execution mode (Done/Skip/Back); editing happens in Processing and during review-on-resume.
- ✅ **Focus list unit**: `Task` (a NextAction breaks down into 1..N tasks).
- ✅ **Single-user / local**: confirmed.
- ✅ **Primary persona**: ADHD / overwhelmed — shapes task breakdown, nudge-not-gate, motivation as fuel (ADR 0007).
- ✅ **`decompose` = WHY + HOW**: WHY (motivational material: reasons + done vision) and HOW (next-actions → tasks, active/concrete language); WHY consumed in `focus` (ADR 0005, 0006).
- ✅ **Timer model**: counts **up from 0**; the estimate = red threshold (model B, ADR 0016; a change from counting down).
- ✅ **Stale tasks**: a new `dismissed` status + a `Dismiss` action — undo, they count toward progress, a separate section in the summary, they don't come back (ADR 0017).
