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
  /** [stressorId, DoneVision] — do zapisu w `decompose:doneVisions`. */
  doneVision: [string, DoneVision];
}

function bareTask(nextActionId: string, stressorId: string, text: string): Task {
  return {
    id: generateId(),
    text,
    nextActionId,
    stressorId,
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
export function buildDecomposeSeedFull(stressorId: string): DecomposeSeed {
  const na1 = generateId();
  const na2 = generateId();

  const reasons: Reason[] = [
    { id: generateId(), stressorId, text: 'wrócę bezpiecznie do domu każdej nocy', valence: 'positive', createdAt: TS, updatedAt: TS },
    { id: generateId(), stressorId, text: 'spokój — nie będę nasłuchiwać każdego dźwięku spod maski', valence: 'positive', createdAt: TS, updatedAt: TS },
    { id: generateId(), stressorId, text: 'uniknę zepsucia się w trasie', valence: 'negative', createdAt: TS, updatedAt: TS },
    { id: generateId(), stressorId, text: 'uniknę droższej naprawy, gdy zignoruję objawy', valence: 'negative', createdAt: TS, updatedAt: TS },
  ];

  const nextActions: NextAction[] = [
    { id: na1, stressorId, text: 'Zadzwoń do warsztatu i umów termin', createdAt: TS, updatedAt: TS },
    { id: na2, stressorId, text: 'Sprawdź orientacyjny koszt naprawy', createdAt: TS, updatedAt: TS },
  ];

  const tasks: Task[] = [
    bareTask(na1, stressorId, 'Znajdź numer telefonu do warsztatu'),
    bareTask(na1, stressorId, 'Zadzwoń i umów wizytę na ten tydzień'),
    bareTask(na2, stressorId, 'Sprawdź orientacyjny koszt naprawy'), // skip = 1 konkretny task
  ];

  return {
    reasons,
    nextActions,
    tasks,
    doneVision: [stressorId, { text: 'samochód jedzie gładko i milczy, jazda bez napięcia', emoji: '😌' }],
  };
}
