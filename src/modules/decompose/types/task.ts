import type { BaseEntity } from '@/shared/types';

/**
 * Kontekst wykonania taska — przypinany w `process` (dokładnie jeden).
 * Kategorie GTD; wielokrotny wybór dopiero przy filtrze sesji (`focus`).
 */
export type Context = 'Phone' | 'Message' | 'Creative' | 'Errands' | 'Home' | 'City';

/**
 * Energia potrzebna do taska — skala 1..3 (Low / Medium / High),
 * renderowana jako bateryjki. Przypinana w `process`.
 */
export type Energy = 1 | 2 | 3;

/** Szacowany czas (min) — preset; źródło wartości timera w `focus`. */
export type EstimatedTime = 5 | 15 | 30 | 45 | 60;

/** Cykl życia taska: pending → active → completed | skipped | dismissed. */
export type TaskState = 'pending' | 'active' | 'completed' | 'skipped' | 'dismissed';

/**
 * Atomiczna, wykonywalna jednostka — element listy focus. Powstaje z
 * `NextAction` w `decompose` (rozbicie 1..N; konkretny next-action = 1 task).
 *
 * Tworzona TU jako „goły" task (tylko tekst + przynależność); atrybuty
 * `context` / `energy` / `estimatedTime` przypinane są dopiero w `process`,
 * a `timerElapsed` zużywany w `focus`.
 */
export interface Task extends BaseEntity {
  text: string;
  nextActionId: string;
  /** Denormalizowane dla wygody (motywacja / grupowanie po stresorze). */
  stressorId: string;
  /** Run, do którego należy ten task (ADR 0044 — per-Run własność lejka). */
  runId: string;
  state: TaskState;
  /** Przypinane w `process`. */
  context?: Context;
  energy?: Energy;
  estimatedTime?: EstimatedTime;
  /** Persystowany licznik timera — do wznowienia w `focus`. */
  timerElapsed: number;
}
