import { captureStressorsFull } from './data/capture';
import { buildFocusSeed } from './data/focus';
import { runsFull } from './data/run';
import {
  doneVisionsKey,
  focusFilterKey,
  nextActionsKey,
  reasonsKey,
  stressorsKey,
  tasksKey,
} from '@/shared/funnel-storage';
import type { AppData } from './types';

/**
 * Full scenario — active work + history (archive). A rich funnel (stressors + WHY/HOW +
 * attributed tasks + remembered filter) is assigned to the dominant Run `run-finanse`, so that
 * Continue leads to a real focus screen (per-Run ownership, ADR 0044). The other Runs in the
 * list show 0% (without their own tasks) — a dev-only simplification of the scenario's richness.
 */
const RUN_ID = 'run-finanse';

export function fullScenario(): AppData {
  const stressors = captureStressorsFull(RUN_ID);
  const focus = buildFocusSeed(RUN_ID, {
    podatki: stressors[3], // 'overdue taxes'
    auto: stressors[0], // 'car needs fixing'
    podwyzka: stressors[2], // 'talk to the boss about a raise'
  });

  return {
    [stressorsKey(RUN_ID)]: stressors,
    [reasonsKey(RUN_ID)]: focus.reasons,
    [nextActionsKey(RUN_ID)]: focus.nextActions,
    [tasksKey(RUN_ID)]: focus.tasks,
    [doneVisionsKey(RUN_ID)]: Object.fromEntries(focus.doneVisions),
    // Remembered session filter — the starting point when continuing the Run.
    [focusFilterKey(RUN_ID)]: { contexts: ['Phone', 'Message'], energies: [1, 2] },
    'run:runs': runsFull,
    'run:active': RUN_ID,
  };
}
