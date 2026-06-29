import type { Run } from '@/modules/run/types/run';

/**
 * Mockowane Runy do scenariuszy. Statystyki są przechowywane (dane lejka są globalne
 * w prototypie — ADR 0020). realistyczne wartości, żeby testujący nie widział lorem ipsum.
 */

/** Minimalny zestaw — jeden aktywny Run na start lejka. */
export const runsMinimal: Run[] = [
  {
    id: 'run-min-1',
    name: 'Run · 28.06, 21:40',
    state: 'in_progress',
    lastReachedStep: 'brain-dump',
    stats: { timeSpentSec: 0, doneCount: 0, dismissedCount: 0, totalTasks: 0 },
    reviewItems: [],
    createdAt: '2026-06-28T21:40:00.000Z',
    updatedAt: '2026-06-28T21:40:00.000Z',
    lastActiveAt: '2026-06-28T21:40:00.000Z',
  },
];

/** Pełny zestaw — aktywna praca + historia (archiwum) do porównania. */
export const runsFull: Run[] = [
  {
    id: 'run-finanse',
    name: 'Finanse i rata kredytu',
    state: 'in_progress',
    lastReachedStep: 'focus',
    stats: { timeSpentSec: 2520, doneCount: 8, dismissedCount: 1, totalTasks: 12 },
    reviewItems: [
      { id: 'ri-1', kind: 'stressor', text: 'niezapłacone faktury', stale: false },
      { id: 'ri-2', kind: 'task', text: 'Zadzwoń do doradcy kredytowego', stale: true },
      { id: 'ri-3', kind: 'task', text: 'Złóż wniosek o urlop na żądanie', stale: false },
      { id: 'ri-4', kind: 'stressor', text: 'rozmowa z szefem o podwyżce', stale: false },
    ],
    createdAt: '2026-06-26T09:00:00.000Z',
    updatedAt: '2026-06-29T08:15:00.000Z',
    lastActiveAt: '2026-06-29T08:15:00.000Z',
  },
  {
    id: 'run-przeprowadzka',
    name: 'Przeprowadzka',
    state: 'in_progress',
    lastReachedStep: 'process',
    stats: { timeSpentSec: 900, doneCount: 2, dismissedCount: 0, totalTasks: 9 },
    reviewItems: [],
    createdAt: '2026-06-27T20:10:00.000Z',
    updatedAt: '2026-06-28T08:00:00.000Z',
    lastActiveAt: '2026-06-28T08:00:00.000Z',
  },
  {
    id: 'run-nowa-praca',
    name: 'Run · 28.06, 21:40',
    state: 'in_progress',
    lastReachedStep: 'decompose',
    stats: { timeSpentSec: 0, doneCount: 0, dismissedCount: 0, totalTasks: 6 },
    reviewItems: [],
    createdAt: '2026-06-28T21:40:00.000Z',
    updatedAt: '2026-06-28T21:40:00.000Z',
    lastActiveAt: '2026-06-28T21:40:00.000Z',
  },
  {
    id: 'run-archiwum-porzadki',
    name: 'Wiosenne porządki',
    state: 'archived',
    lastReachedStep: 'celebration',
    stats: { timeSpentSec: 7200, doneCount: 15, dismissedCount: 2, totalTasks: 15 },
    reviewItems: [],
    createdAt: '2026-04-02T10:00:00.000Z',
    updatedAt: '2026-04-05T16:00:00.000Z',
    lastActiveAt: '2026-04-05T16:00:00.000Z',
  },
  {
    id: 'run-archiwum-egzamin',
    name: 'Egzamin zawodowy',
    state: 'archived',
    lastReachedStep: 'celebration',
    stats: { timeSpentSec: 5400, doneCount: 20, dismissedCount: 1, totalTasks: 22 },
    reviewItems: [],
    createdAt: '2026-03-10T08:00:00.000Z',
    updatedAt: '2026-03-20T12:00:00.000Z',
    lastActiveAt: '2026-03-20T12:00:00.000Z',
  },
];
