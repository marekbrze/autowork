import { buildFocusSeed } from './data/focus';
import {
  doneVisionsKey,
  nextActionsKey,
  reasonsKey,
  stressorsKey,
  tasksKey,
} from '@/shared/funnel-storage';
import type { Run } from '@/modules/run/types/run';
import type { AppData } from './types';

/**
 * Scenariusz `focus` — pełny payoff lejka: 3 stresory z atrybuowanymi taskami
 * (Context/Energy/EstimatedTime) i materiałem motywacyjnym, gotowe do filtrowania
 * sesji. Wybierany z DevToolbar (na dole ekranu). Per-Run (ADR 0044).
 */
const RUN_ID = 'run-focus-1';
const TS = '2026-06-28T00:00:00.000Z';

export function focusScenario(): AppData {
  const seed = buildFocusSeed(RUN_ID);
  const run: Run = {
    id: RUN_ID,
    name: 'Run · Focus seed',
    state: 'in_progress',
    lastReachedStep: 'focus',
    stats: { timeSpentSec: 0, doneCount: 0, dismissedCount: 0, totalTasks: 0 },
    reviewItems: [],
    createdAt: TS,
    updatedAt: TS,
    lastActiveAt: TS,
  };
  return {
    [stressorsKey(RUN_ID)]: seed.stressors,
    [reasonsKey(RUN_ID)]: seed.reasons,
    [nextActionsKey(RUN_ID)]: seed.nextActions,
    [tasksKey(RUN_ID)]: seed.tasks,
    [doneVisionsKey(RUN_ID)]: Object.fromEntries(seed.doneVisions),
    'run:runs': [run],
    'run:active': RUN_ID,
  };
}
