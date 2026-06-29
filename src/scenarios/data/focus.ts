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
export function buildFocusSeed(): FocusSeed {
  const stressors: Stressor[] = [
    mkStressor('zaległe podatki'),
    mkStressor('samochód do naprawy'),
    mkStressor('rozmowa z szefem o podwyżce'),
  ];
  const [sPodatki, sAuto, sPodwyzka] = stressors;

  const reasons: Reason[] = [];
  const nextActions: NextAction[] = [];
  const tasks: Task[] = [];
  const doneVisions: [string, DoneVision][] = [];

  // --- stresor 1: podatki (rank 0) — pełne WHY ---
  reasons.push(
    mkReason(sPodatki.id, 'spokój — urząd przestaje wisieć mi nad głową', 'positive'),
    mkReason(sPodatki.id, 'kary i odsetki rosną z każdym dniem zwłoki', 'negative'),
  );
  const naPit = mkNextAction(sPodatki.id, 'Złóż zeznanie PIT online');
  nextActions.push(naPit);
  tasks.push(
    attributedTask(naPit.id, sPodatki.id, 'Zbierz dokumenty dochodowe (PIT-11, faktury)', { context: 'Home', energy: 2, estimatedTime: 30 }),
    attributedTask(naPit.id, sPodatki.id, 'Wypełnij formularz PIT w e-Urzędzie', { context: 'Creative', energy: 3, estimatedTime: 45 }),
    attributedTask(naPit.id, sPodatki.id, 'Złóż zeznanie i zapisz potwierdzenie (PDF)', { context: 'Creative', energy: 2, estimatedTime: 15 }),
  );
  doneVisions.push([sPodatki.id, { text: 'podatki złożone, głowa wolna od terminów i urzędu', emoji: '😌' }]);

  // --- stresor 2: auto (rank 1) — pełne WHY ---
  reasons.push(
    mkReason(sAuto.id, 'wrócę bezpiecznie do domu każdej nocy', 'positive'),
    mkReason(sAuto.id, 'auto zepsuje się w trasie i zablokuje plany', 'negative'),
  );
  const naUmow = mkNextAction(sAuto.id, 'Umów naprawę w warsztacie');
  const naKoszt = mkNextAction(sAuto.id, 'Sprawdź orientacyjny koszt naprawy');
  nextActions.push(naUmow, naKoszt);
  tasks.push(
    attributedTask(naUmow.id, sAuto.id, 'Znajdź numer telefonu do warsztatu', { context: 'Phone', energy: 1, estimatedTime: 5 }),
    attributedTask(naUmow.id, sAuto.id, 'Zadzwoń i umów wizytę na ten tydzień', { context: 'Phone', energy: 2, estimatedTime: 15 }),
    attributedTask(naKoszt.id, sAuto.id, 'Wyślij zapytanie o koszt części mailowo', { context: 'Message', energy: 1, estimatedTime: 5 }),
  );
  doneVisions.push([sAuto.id, { text: 'samochód jedzie gładko i milczy, jazda bez napięcia', emoji: '😌' }]);

  // --- stresor 3: podwyżka (rank 2) — celowo BEZ WHY (edge: brak motywacji) ---
  const naPrzygotuj = mkNextAction(sPodwyzka.id, 'Przygotuj się do rozmowy o podwyżce');
  nextActions.push(naPrzygotuj);
  tasks.push(
    attributedTask(naPrzygotuj.id, sPodwyzka.id, 'Wypisz swoje osiągnięcia z ostatniego roku', { context: 'Creative', energy: 3, estimatedTime: 30 }),
    attributedTask(naPrzygotuj.id, sPodwyzka.id, 'Sprawdź stawki rynkowe dla swojego stanowiska', { context: 'Creative', energy: 2, estimatedTime: 15 }),
  );

  return { stressors, reasons, nextActions, tasks, doneVisions };
}
