# Capture

## Vision
The entry to the app. A low-friction **brain dump** — keyword-style, like a normal todo — to get out of your head everything that is stressing you right now, so you can then focus on solving, not on remembering. Next comes the **ranking** of stressors from most to least stressful. This is the user's first contact with the tool, so the module sets the tone for the whole promise of "lift the burden of deciding where to start": zero judgment, zero requirement for full sentences, just dumping.

The key difference from "yet another empty list editor", where the user gets stuck: the app itself surfaces **rotating prompts** and **leads onward** into ranking, instead of leaving the user alone with an empty list. Here the user only *adds* — they don't decide where to start.

## User Flows

### Brain dump
1. The user enters `capture` → sees a field with the question **"What's stressing you right now?"**, a rotating banner prompt, and (at the start) an empty list below.
2. The user types a stressor in keywords (e.g. "car", "termination of contract") → **Enter** adds it to the list; the field clears, ready for the next one.
3. **The banner rotates every few seconds**, surfacing categories / examples ("finances", "how about the loan installment?"); the user can click a prompt to help themselves (pre-fill the field).
4. The user repeats until they dump everything on their mind. **Keyboard navigation and deletion**: ↓↑ browses the list, Backspace/Delete removes the selected entry (with **undo** Ctrl+Z on accidental deletion). They can also edit the entered text.
5. When they have **≥1 stressor** → **"Next"** becomes available (also via keyboard).

### Ranking
1. After "Next" the user sees the list of stressors (by default in entry order).
2. **By default**: they arrange manually — **drag** or move with **↑↓ arrows**, from most to least stressful.
3. **Optionally**: launch **pairing** — a committed sequence of pairwise comparisons ("which is more stressful: A or B?"). The user works through all pairs; only after a **full pass** does a smart algorithm arrange the final order from the comparisons. You can't exit halfway.
4. **"Next"** → hand off the ordered stressors to `decompose`.

## Screens (rough)
- **Brain dump**: heading/prompt "What's stressing you right now?"; a large, prominent text field (Enter = add); a **rotating banner prompt** above/below the field; a list of entered stressors underneath (each with edit + delete); a **"Next"** button (disabled on an empty list).
- **Ranking**: a list of stressors to arrange (drag / ↑↓ / ↑↓ buttons on the row — also on touch); a **"Start pairing"** button leading into the sequence of pairs (one "A or B?" question at a time + selection, with a progress counter and abort confirmation); after completion — the list in final order; a **"Next"** button.

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| Add Stressor | Type a keyword, Enter adds another. | Stressor | Step 1. |
| Pick prompt suggestion | Click the rotating banner prompt to help yourself (pre-fill the field). | Stressor | `PromptBanner`; rotates every few seconds. |
| Edit Stressor | Change the text of an existing entry. | Stressor | |
| Delete Stressor | Remove from the list (keyboard: Backspace/Delete on the selected one). | Stressor | **Undo on by default** (Ctrl+Z). |
| Rank Stressor | Arrange from most to least stressful — manually (drag/↑↓). | Stressor | Step 2; sets `rank`. Default method. |
| Run Pairing | Launch and complete the sequence of pairwise comparisons; the algorithm arranges the final order. | Stressor | Optional ranking method; committed sequence (start → full pass); requires ≥2 stressors. |
| Proceed ("Next") | Move to the next stage. | Stressor | Brain dump → ranking: requires ≥1 stressor. Ranking → `decompose`. |

## Edge Cases
States handled in the prototype (after `proto-harden`; full status with `file:line` — `docs/modules/capture-edgecases.md`):

- **Empty list**: "Next" from brain dump disabled (need ≥1 stressor). A deep-link to ranking without stressors also shows an empty-state with a way back.
- **Single stressor**: ranking is trivial; pairing requires ≥2 stressors (unavailable below), the user proceeds without it.
- **Accidental deletion**: undo — `Ctrl/Cmd+Z` **or** an "Undo" toast (6 s). Undo stack: several quick deletions are all undoable (remaining counter). Ctrl+Z in the text field keeps the native typing undo.
- **Edit to empty**: **does not delete** — clearing the field and submitting cancels the edit (keeps the original). Deletion is a separate, explicit action (✕ / Backspace).
- **Duplicates**: the app does not block them (brain dump = no judgment); deduplication remains the user's decision.
- **Very long text**: truncate in the list (with `title`); full text on edit; `maxLength` 300 characters.
- **Banner ignored**: nothing happens — the banner is optional help and keeps rotating.
- **Ranking on touch/mobile**: explicit ↑/↓ buttons on each row (drag for mouse; ↑↓ arrows on button focus) — HTML5 drag doesn't work on touch, so the buttons are the mobile path.
- **Pairing = committed sequence**: aborting mid-sequence requires confirmation (progress would be lost); progress is visible ("Question N", "Stressor X of Y").
- **LocalStorage failure** (full / private mode / unavailable): toast with retry. The UI always reflects what is actually saved. Corrupted read (bad JSON) → informational toast, start from empty (instead of a silent reset).
- **Multi-tab**: changes from other tabs synchronized (`storage` event).

**Deferred (outside the `capture` harden)**: scoping stressors to the active Run + "new Run" (requires the `run` module); draft in the field on "Next" — the designer chose to discard it (in line with "Enter adds"). Details in `docs/modules/capture-edgecases.md`.

## Integration Points
- **`decompose`**: direct exit — `capture` hands off the ordered (ranked) stressors, and `decompose` breaks them into next-actions.
- **`run`**: starting `capture` creates a new `Run` implicitly (see `MODULES.md`, `ENTITY_MAP.md`); `capture` lives inside the active Run.
- **App shell (ADR 0001)**: the `capture` stages (brain dump → ranking) render in `AppShell` and are guided by the **Run progress stepper**; "Next" advances the stepper. No free navigation links — guidance, not a menu.
