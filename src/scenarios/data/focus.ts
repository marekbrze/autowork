import { generateId } from '@/shared/types';
import type { DoneVision } from '@/shared/types';

import type { Stressor } from '@/modules/capture/types/stressor';
import type { Reason } from '@/modules/decompose/types/reason';
import type { NextAction } from '@/modules/decompose/types/next-action';
import type { Context, Energy, EstimatedTime, Task } from '@/modules/decompose/types/task';

/** Stabilny timestamp dla seedu scenariusza. */
const TS = '2026-06-28T00:00:00.000Z';

export interface FocusSeed {
  stressors: Stressor[];
  reasons: Reason[];
  nextActions: NextAction[];
  /** Taski z przypiętymi atrybutami (Context/Energy/EstimatedTime) — gotowe do filtra sesji. */
  tasks: Task[];
  /** [stressorId, DoneVision] — do zapisu w `decompose:doneVisions`. */
  doneVisions: [string, DoneVision][];
}

function mkStressor(text: string): Stressor {
  return { id: generateId(), text, createdAt: TS, updatedAt: TS };
}

function mkReason(stressorId: string, text: string, valence: Reason['valence']): Reason {
  return { id: generateId(), stressorId, text, valence, createdAt: TS, updatedAt: TS };
}

function mkNextAction(stressorId: string, text: string): NextAction {
  return { id: generateId(), stressorId, text, createdAt: TS, updatedAt: TS };
}

function attributedTask(
  nextActionId: string,
  stressorId: string,
  text: string,
  attrs: { context: Context; energy: Energy; estimatedTime: EstimatedTime },
): Task {
  return {
    id: generateId(),
    text,
    nextActionId,
    stressorId,
    state: 'pending',
    timerElapsed: 0,
    createdAt: TS,
    updatedAt: TS,
    ...attrs,
  };
}

/**
 * Seed celowy dla `focus` — przeprowadza tester przez pełny payoff lejka:
 * 3 stresory (kolejność tablicy = rank: najbardziej stresujący pierwszy),
 * każdy z atrybuowanymi taskami o zróżnicowanych kontekstach/energiach/czasach,
 * materiał motywacyjny (WHY) dla dwóch z nich (trzeci celowo bez — edge case
 * „brak motywacji"). Wystarcza do przetestowania filtra, kolejki po ranku,
 * pętli Done/Skip/Dismiss/Back oraz podsumowania z sekcją „Nieaktualne".
 */
/**
 * Opcjonalne referencje stresorów. Scenariusz `full` ma już te 3 tematy w brain
 * dumpie, więc przekazuje istniejące stresory (bez duplikatów); pominięcie = buduje
 * własne (dla samodzielnego scenariusza `focus`).
 */
export interface FocusStressorRefs {
  podatki: Stressor;
  auto: Stressor;
  podwyzka: Stressor;
}

export function buildFocusSeed(refs?: FocusStressorRefs): FocusSeed {
  const r: FocusStressorRefs = refs ?? {
    podatki: mkStressor('overdue taxes'),
    auto: mkStressor('car needs fixing'),
    podwyzka: mkStressor('talk to the boss about a raise'),
  };
  const stressors: Stressor[] = [r.podatki, r.auto, r.podwyzka];
  const [sPodatki, sAuto, sPodwyzka] = stressors;

  const reasons: Reason[] = [];
  const nextActions: NextAction[] = [];
  const tasks: Task[] = [];
  const doneVisions: [string, DoneVision][] = [];

  // --- stresor 1: podatki (rank 0) — pełne WHY ---
  reasons.push(
    mkReason(sPodatki.id, 'peace — the tax office stops hanging over me', 'positive'),
    mkReason(sPodatki.id, 'penalties and interest grow every day I delay', 'negative'),
  );
  const naPit = mkNextAction(sPodatki.id, 'File the tax return online');
  nextActions.push(naPit);
  tasks.push(
    attributedTask(naPit.id, sPodatki.id, 'Gather income documents (PIT-11, invoices)', { context: 'Home', energy: 2, estimatedTime: 30 }),
    attributedTask(naPit.id, sPodatki.id, 'Fill in the tax form in the e-Office', { context: 'Creative', energy: 3, estimatedTime: 45 }),
    attributedTask(naPit.id, sPodatki.id, 'Submit the return and save the confirmation (PDF)', { context: 'Creative', energy: 2, estimatedTime: 15 }),
  );
  doneVisions.push([sPodatki.id, { text: 'taxes filed, head clear of deadlines and the office', emoji: '😌' }]);

  // --- stresor 2: auto (rank 1) — pełne WHY ---
  reasons.push(
    mkReason(sAuto.id, 'I get home safe every night', 'positive'),
    mkReason(sAuto.id, 'the car breaks down on the road and derails my plans', 'negative'),
  );
  const naUmow = mkNextAction(sAuto.id, 'Book the repair at the shop');
  const naKoszt = mkNextAction(sAuto.id, 'Check the rough repair cost');
  nextActions.push(naUmow, naKoszt);
  tasks.push(
    attributedTask(naUmow.id, sAuto.id, 'Find the shop\'s phone number', { context: 'Phone', energy: 1, estimatedTime: 5 }),
    attributedTask(naUmow.id, sAuto.id, 'Call and book a visit this week', { context: 'Phone', energy: 2, estimatedTime: 15 }),
    attributedTask(naKoszt.id, sAuto.id, 'Email a quote request for parts', { context: 'Message', energy: 1, estimatedTime: 5 }),
  );
  doneVisions.push([sAuto.id, { text: 'the car runs smooth and quiet, driving without stress', emoji: '😌' }]);

  // --- stresor 3: podwyżka (rank 2) — celowo BEZ WHY (edge: brak motywacji) ---
  const naPrzygotuj = mkNextAction(sPodwyzka.id, 'Prepare for the raise conversation');
  nextActions.push(naPrzygotuj);
  tasks.push(
    attributedTask(naPrzygotuj.id, sPodwyzka.id, 'List your wins from the past year', { context: 'Creative', energy: 3, estimatedTime: 30 }),
    attributedTask(naPrzygotuj.id, sPodwyzka.id, 'Check market rates for your role', { context: 'Creative', energy: 2, estimatedTime: 15 }),
  );

  return { stressors, reasons, nextActions, tasks, doneVisions };
}
