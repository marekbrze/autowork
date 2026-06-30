import type { Task } from '@/modules/decompose/types/task';

import type { FunnelStep, RunStats } from './types/run';

/**
 * Wyprowadzanie statystyk i kroku resume Runa **na żywo** z globalnych danych lejka
 * (ADR 0020 — faza integracji cross-module). Do tej pory `run.stats` / `lastReachedStep`
 * były wpisane raz przy tworzeniu i nigdy nie synchronizowane (zob. docs/changes/
 * dashboard-run-stats-disconnected.md). Lejek trzyma dane w osobnych storach
 * (`capture:stressors`, `decompose:tasks`, …); te funkcje agregują je do postaci,
 * jakiej oczekuje warstwa widoku Runa.
 *
 * Uwaga (prototype): dane lejka są globalne (bez `runId`), więc w prototypie wszystkie
 * Runy dzielą ten sam zestaw statystyk. Prawdziwe spięcie per-Run odłożone (ADR 0020).
 */

/**
 * Liczy statystyki Runa z tasków. Mianownik = wszystkie taski; licznik (done) =
 * `completed` + `dismissed` (ADR 0017); `skipped` NIE liczy się (wraca w kolejnej sesji).
 * Czas = suma `timerElapsed` po zrobionych taskach.
 */
export function deriveRunStats(tasks: Task[]): RunStats {
  const totalTasks = tasks.length;
  let doneCount = 0;
  let dismissedCount = 0;
  let timeSpentSec = 0;
  for (const t of tasks) {
    if (t.state === 'completed') {
      doneCount += 1;
      timeSpentSec += t.timerElapsed;
    } else if (t.state === 'dismissed') {
      doneCount += 1;
      dismissedCount += 1;
    }
  }
  return {
    timeSpentSec: Math.round(timeSpentSec),
    doneCount,
    dismissedCount,
    totalTasks,
  };
}

/** Sygnały lejka, z których wyprowadzamy krok resume (Kontynuuj, ADR 0022). */
export interface FunnelSignals {
  stressorCount: number;
  nextActionCount: number;
  taskCount: number;
  /** `completed + dismissed`. */
  doneCount: number;
  /** Zapauzowana sesja focus możliwa do wznowienia (snapshot z niepustą kolejką). */
  hasResumableSession: boolean;
}

/**
 * Wyprowadza najdalszy osiągnięty krok lejka z obecności danych (run.md §Continue).
 * Reguły od najbardziej konkretnych:
 *   wszystko rozwiązane → celebration · zapauzowana sesja → focus · ≥1 task → focus ·
 *   next-actiony (bez tasków) → process · stresory (bez rozbicia) → ranking · pusto → brain-dump.
 *
 * Ograniczenie: nie rozróżniamy „zrankowane vs nierankingowane" stresory (kolejność jest
 * implikowana pozycją w tablicy, bez flagi), więc stresory-bez-rozbicia kierują do rankingu
 * (najbezpieczniejszy „następny krok"). Zgłoszony przypadek (stresory + taski) → focus.
 */
export function deriveLastReachedStep(s: FunnelSignals): FunnelStep {
  if (s.taskCount > 0 && s.doneCount >= s.taskCount) return 'celebration';
  if (s.hasResumableSession) return 'focus';
  if (s.taskCount > 0) return 'focus';
  if (s.nextActionCount > 0) return 'process';
  if (s.stressorCount > 0) return 'ranking';
  return 'brain-dump';
}
