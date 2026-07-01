import { generateId } from '@/shared/types';
import type { DoneVision } from '@/shared/types';

import type { Reason } from '@/modules/decompose/types/reason';
import type { NextAction } from '@/modules/decompose/types/next-action';
import type { Task } from '@/modules/decompose/types/task';

/** Stabilny timestamp dla seedu scenariusza. */
const TS = '2026-06-28T00:00:00.000Z';

export interface DecomposeSeed {
  reasons: Reason[];
  nextActions: NextAction[];
  tasks: Task[];
  /** [stressorId, DoneVision] — do zapisu w `decompose:doneVisions:<runId>`. */
  doneVision: [string, DoneVision];
}

function bareTask(nextActionId: string, stressorId: string, runId: string, text: string): Task {
  return {
    id: generateId(),
    text,
    nextActionId,
    stressorId,
    runId,
    state: 'pending',
    timerElapsed: 0,
    createdAt: TS,
    updatedAt: TS,
  };
}

/**
 * Seed dekompozycji dla pierwszego stresora (pełny scenariusz) — pokazuje
 * wypełniony stan WHY + HOW, żeby tester widział „zrobiony" stresor #1
 * i mógł przejść świeżo do #2. Realistyczny materiał (aktywny język, ADR 0006).
 */
export function buildDecomposeSeedFull(stressorId: string, runId: string): DecomposeSeed {
  const na1 = generateId();
  const na2 = generateId();

  const reasons: Reason[] = [
    { id: generateId(), runId, stressorId, text: 'I get home safe every night', valence: 'positive', createdAt: TS, updatedAt: TS },
    { id: generateId(), runId, stressorId, text: 'peace — no more listening for every sound from under the hood', valence: 'positive', createdAt: TS, updatedAt: TS },
    { id: generateId(), runId, stressorId, text: 'the car breaks down on the road', valence: 'negative', createdAt: TS, updatedAt: TS },
    { id: generateId(), runId, stressorId, text: 'a pricier repair if I ignore the symptoms', valence: 'negative', createdAt: TS, updatedAt: TS },
  ];

  const nextActions: NextAction[] = [
    { id: na1, runId, stressorId, text: 'Call the shop and book a date', createdAt: TS, updatedAt: TS },
    { id: na2, runId, stressorId, text: 'Check the rough repair cost', createdAt: TS, updatedAt: TS },
  ];

  const tasks: Task[] = [
    bareTask(na1, stressorId, runId, 'Find the shop\'s phone number'),
    bareTask(na1, stressorId, runId, 'Call and book a visit this week'),
    bareTask(na2, stressorId, runId, 'Check the rough repair cost'), // skip = 1 concrete task
  ];

  return {
    reasons,
    nextActions,
    tasks,
    doneVision: [stressorId, { text: 'the car runs smooth and quiet, driving without stress', emoji: '😌' }],
  };
}
