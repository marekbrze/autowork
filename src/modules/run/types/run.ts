import type { BaseEntity } from '@/shared/types';

/**
 * Krok lejka osiągnięty w Runie — steruje routingiem „Kontynuuj" (ADR 0022).
 * Kolejność od wejścia do payoffu.
 */
export type FunnelStep =
  | 'brain-dump'
  | 'ranking'
  | 'decompose'
  | 'process'
  | 'focus'
  | 'celebration';

/** Stan Runa (ADR 0021). `in_progress` = aktywny/wznawialny; `archived` = w historii, odwracalny. */
export type RunState = 'in_progress' | 'archived';

/**
 * Statystyki Runa. Wartość w `run:runs` to ziarno (zera przy tworzeniu); warstwa widoku
 * scalia tu statystyki **wyprowadzane na żywo** z tasków lejka (`run/stats.ts` → `useLiveRuns`).
 * Dane lejka są globalne (ADR 0020), więc w prototypie wszystkie Runy dzielą ten sam progres.
 */
export interface RunStats {
  /** Łączny czas w focus (suma `timerElapsed`), w sekundach. */
  timeSpentSec: number;
  /** Taski rozwiązane: `completed + dismissed` (rzeczy, którymi user już się nie zajmuje). */
  doneCount: number;
  /** Taski nieaktualne (`dismissed`) — podzbiór `doneCount`, do rozbicia w statystykach. */
  dismissedCount: number;
  /** Łączna liczba tasków w Runie. */
  totalTasks: number;
}

/** Pozycja w ręcznym przeglądzie Runa (ADR 0023). */
export interface ReviewItem {
  id: string;
  kind: 'stressor' | 'task';
  text: string;
  /** `true` = przeterminowane / do usunięcia (stale). `false` = nadal aktualne (relevant). */
  stale: boolean;
}

/**
 * Run — pojemnik najwyższego poziomu lejka, **widoczny obiekt ze statystykami** (ADR 0020).
 * Trwały, wznawialny (Kontynuuj), archiwizowany ręcznie i odwracalnie (ADR 0021),
 * usuwany trwale (jedyna operacja terminalna).
 */
export interface Run extends BaseEntity {
  name: string;
  state: RunState;
  lastReachedStep: FunnelStep;
  stats: RunStats;
  /** Pozycje do ręcznego przeglądu (relevant vs stale). */
  reviewItems: ReviewItem[];
  /** Ostatnia aktywność — steruje sortowaniem na listach („ostatnio"). */
  lastActiveAt: string;
}

/** Etykiety kroków lejka do wyświetlania (np. „wznowisz w: Sesja focus"). */
export const STEP_LABEL: Record<FunnelStep, string> = {
  'brain-dump': 'Brain dump',
  ranking: 'Stress ranking',
  decompose: 'Breakdown (WHY + HOW)',
  process: 'Processing',
  focus: 'Focus session',
  celebration: 'Celebration',
};

/** Mapa kroku → trasa lejka, po której „Kontynuuj" nawiguje (ADR 0022). */
export const STEP_ROUTE: Record<FunnelStep, string> = {
  'brain-dump': '/capture',
  ranking: '/capture/ranking',
  decompose: '/decompose',
  process: '/process',
  focus: '/focus',
  celebration: '/focus',
};

/** Progres Runa w procentach: `(doneCount) / totalTasks` (ADR 0020). 0 gdy brak tasków. */
export function runProgress(run: Run): number {
  if (run.stats.totalTasks === 0) return 0;
  return Math.round((run.stats.doneCount / run.stats.totalTasks) * 100);
}

/** Ile tasków jeszcze zostało (remaining). */
export function runRemaining(run: Run): number {
  return Math.max(0, run.stats.totalTasks - run.stats.doneCount);
}

/** Czy Run ukończony (wszystkie taski rozwiązane) — stan wyliczany, nie formalny. */
export function isRunCompleted(run: Run): boolean {
  return run.stats.totalTasks > 0 && run.stats.doneCount >= run.stats.totalTasks;
}

/**
 * Format sekund → zwarty czas ludzki: `42m`, `1h 5m`, `2h`, `45s`.
 * (Inny niż focusowy `formatClock` `M:SS` — tu liczy się szybki skan statystyk.)
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}
