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
 * Pełny scenariusz — aktywna praca + historia (archiwum). Bogaty lejek (stressors + WHY/HOW +
 * atrybuowane taski + zapamiętany filtr) przypisany do dominującego Runa `run-finanse`, żeby
 * Kontynuuj prowadziło do realnego focusa (per-Run własność, ADR 0044). Pozostałe Runy na
 * liście pokazują 0% (bez własnych tasków) — dev-only uproszczenie bogactwa scenariusza.
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
    // Zapamiętany filtr sesji — punkt startowy przy kontynuacji Runu.
    [focusFilterKey(RUN_ID)]: { contexts: ['Phone', 'Message'], energies: [1, 2] },
    'run:runs': runsFull,
    'run:active': RUN_ID,
  };
}
