import { useCallback } from 'react';

import { useLocalStorage, type LocalStorageStatus } from '@/shared/hooks/use-local-storage';
import { useActiveRunId } from '@/shared/active-run';
import { tasksKey } from '@/shared/funnel-storage';
import { generateId } from '@/shared/types';

import type { Task } from '../types/task';
import type { NextAction } from '../types/next-action';

function bareTask(nextActionId: string, stressorId: string, runId: string, text: string): Task {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    text,
    nextActionId,
    stressorId,
    runId,
    state: 'pending',
    timerElapsed: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/** Tasks of the active Run (or `runId`, if provided — e.g. RunDetails scopes by the URL `:runId`). */
export function useTasks(runId?: string) {
  const activeRunId = useActiveRunId(runId);
  const rid = activeRunId ?? '__none__';
  const key = tasksKey(rid);
  const [tasks, setTasks, , storage] = useLocalStorage<Task[]>(key, []);

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>): boolean =>
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)),
      ),
    [setTasks],
  );

  const deleteTask = useCallback(
    (id: string): boolean => setTasks((prev) => prev.filter((t) => t.id !== id)),
    [setTasks],
  );

  const deleteTasksByNextAction = useCallback(
    (nextActionId: string) => {
      setTasks((prev) => prev.filter((t) => t.nextActionId !== nextActionId));
    },
    [setTasks],
  );

  /**
   * Replaces the set of tasks under a next-action (the breakdown in `decompose`).
   * HARDEN: diff by text instead of a full replace — tasks whose text is unchanged
   * keep their identity (id + any future `context`/`energy`/… attributes from
   * `process`/`focus`); first-free matching. Missing texts → new tasks,
   * absent ones → deleted. Today (process = placeholder) tasks have no attributes, so
   * the change is observationally neutral; it guards against scrambling attributes on
   * re-breakdown once `process`/`focus` exist (decompose-edgecases #7).
   */
  const replaceTasksForNextAction = useCallback(
    (nextAction: NextAction, texts: string[]) => {
      const cleaned = texts.map((t) => t.trim()).filter(Boolean);
      setTasks((prev) => {
        const kept = prev.filter((t) => t.nextActionId !== nextAction.id);
        const existing = prev.filter((t) => t.nextActionId === nextAction.id);
        const usedIds = new Set<string>();
        const resolved = cleaned.map((text) => {
          const match = existing.find((t) => t.text === text && !usedIds.has(t.id));
          if (match) {
            usedIds.add(match.id);
            return match;
          }
          return bareTask(nextAction.id, nextAction.stressorId, rid, text);
        });
        return [...kept, ...resolved];
      });
    },
    [setTasks, rid],
  );

  /**
   * Safety-net on "Next": every next-action without tasks materializes
   * as 1 concrete task (consistent with ADR 0006 — a concrete next-action = 1 task).
   */
  const materializeBareNextActions = useCallback(
    (nextActions: NextAction[]) => {
      setTasks((prev) => {
        const withTasks = new Set(prev.map((t) => t.nextActionId));
        const toCreate = nextActions.filter((n) => !withTasks.has(n.id));
        if (toCreate.length === 0) return prev;
        return [...prev, ...toCreate.map((n) => bareTask(n.id, n.stressorId, rid, n.text))];
      });
    },
    [setTasks, rid],
  );

  return {
    tasks,
    updateTask,
    deleteTask,
    deleteTasksByNextAction,
    replaceTasksForNextAction,
    materializeBareNextActions,
    /** Persistence status (read/write errors + retry). */
    storage: storage as LocalStorageStatus,
  };
}
