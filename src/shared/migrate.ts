import { generateId } from '@/shared/types';
import type { Run } from '@/modules/run/types/run';
import {
  doneVisionsKey,
  focusFilterKey,
  focusSessionKey,
  focusTaskOrderKey,
  nextActionsKey,
  reasonsKey,
  stressorsKey,
  tasksKey,
} from '@/shared/funnel-storage';

const MIGRATED_FLAG = 'run:migrated-v1';

/** Old global funnel keys (before per-Run, ADR 0044). */
const OLD_KEYS = {
  stressors: 'capture:stressors',
  nextActions: 'decompose:nextActions',
  tasks: 'decompose:tasks',
  reasons: 'decompose:reasons',
  doneVisions: 'decompose:doneVisions',
  filter: 'focus:filter',
  session: 'focus:session',
  taskOrder: 'focus:taskOrder',
} as const;

type OldKey = keyof typeof OLD_KEYS;

function perRunKey(name: OldKey, runId: string): string {
  switch (name) {
    case 'stressors':
      return stressorsKey(runId);
    case 'nextActions':
      return nextActionsKey(runId);
    case 'tasks':
      return tasksKey(runId);
    case 'reasons':
      return reasonsKey(runId);
    case 'doneVisions':
      return doneVisionsKey(runId);
    case 'filter':
      return focusFilterKey(runId);
    case 'session':
      return focusSessionKey(runId);
    case 'taskOrder':
      return focusTaskOrderKey(runId);
  }
}

const ENTITY_ARRAYS: ReadonlySet<OldKey> = new Set<OldKey>(['stressors', 'nextActions', 'tasks', 'reasons']);

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

/**
 * One-time migration of old global funnel keys (pre-ADR-0044) to the per-Run model.
 * Idempotent (flag `run:migrated-v1`). Called once before the app renders (main.tsx) so that
 * hooks read the namespaced keys of the migrated data.
 *
 * User decision (PR-7): all old global data lands in a SINGLE Run (the most recent active one
 * from `run:runs`, or a newly created "Imported run") — it cannot be split across runs.
 */
export function migrateGlobalFunnelData(): void {
  try {
    if (window.localStorage.getItem(MIGRATED_FLAG)) return;

    const oldStressors = readJson<unknown[]>(OLD_KEYS.stressors);
    const hasOldData = Array.isArray(oldStressors) && oldStressors.length > 0;
    if (!hasOldData) {
      window.localStorage.setItem(MIGRATED_FLAG, '1');
      return;
    }

    // Target: the most recent active Run from `run:runs`, or a new "Imported run".
    const runs = readJson<Run[]>('run:runs') ?? [];
    const target = runs.find((r) => r.state === 'in_progress');
    let targetId: string;
    if (target) {
      targetId = target.id;
    } else {
      const now = new Date().toISOString();
      const imported: Run = {
        id: generateId(),
        name: 'Imported run',
        state: 'in_progress',
        lastReachedStep: 'brain-dump',
        stats: { timeSpentSec: 0, doneCount: 0, dismissedCount: 0, totalTasks: 0, estimatedTotalMin: 0, estimatedRemainingMin: 0 },
        reviewItems: [],
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
      };
      targetId = imported.id;
      window.localStorage.setItem('run:runs', JSON.stringify([imported, ...runs]));
    }

    // Move each old key to its per-run key (entities get a runId).
    (Object.keys(OLD_KEYS) as OldKey[]).forEach((name) => {
      const raw = window.localStorage.getItem(OLD_KEYS[name]);
      if (raw == null) return;
      let value: unknown;
      try {
        value = JSON.parse(raw);
      } catch {
        return; // corrupted — leave it (hooks will ignore)
      }
      if (ENTITY_ARRAYS.has(name) && Array.isArray(value)) {
        value = (value as Array<Record<string, unknown>>).map((e) => ({ ...e, runId: targetId }));
      }
      window.localStorage.setItem(perRunKey(name, targetId), JSON.stringify(value));
      window.localStorage.removeItem(OLD_KEYS[name]);
    });

    window.localStorage.setItem('run:active', JSON.stringify(targetId));
    window.localStorage.setItem(MIGRATED_FLAG, '1');
  } catch {
    // migration is best-effort — do not block app startup
  }
}
