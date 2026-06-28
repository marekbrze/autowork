import { useCallback } from 'react';

import { useLocalStorage, type LocalStorageStatus } from '@/shared/hooks/use-local-storage';
import { generateId } from '@/shared/types';

import type { Task } from '../types/task';
import type { NextAction } from '../types/next-action';

const STORAGE_KEY = 'decompose:tasks';

function bareTask(nextActionId: string, stressorId: string, text: string): Task {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    text,
    nextActionId,
    stressorId,
    state: 'pending',
    timerElapsed: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function useTasks() {
  const [tasks, setTasks, , storage] = useLocalStorage<Task[]>(STORAGE_KEY, []);

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
   * Zastępuje zestaw tasków pod next-actionem (rozbicie w `decompose`).
   * HARDEN: diff po tekście zamiast pełnego replace'u — taski o niezmiennym tekście
   * zachowują identyczność (id + ew. przyszłe atrybuty `context`/`energy`/… z
   * `process`/`focus`); dopasowanie pierwsze-wolne. Brakujące teksty → nowe taski,
   * nieobecne → usuwane. Dziś (process = placeholder) taski nie mają atrybutów, więc
   * zmiana jest obserwacyjnie neutralna; chroni przed zmatywaniem atrybutów przy
   * ponownym rozbiciu, gdy `process`/`focus` powstaną (decompose-edgecases #7).
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
          return bareTask(nextAction.id, nextAction.stressorId, text);
        });
        return [...kept, ...resolved];
      });
    },
    [setTasks],
  );

  /**
   * Safety-net przy „Dalej": każdy next-action bez tasków materializuje się
   * jako 1 konkretny task (spójnie z ADR 0006 — konkretny next-action = 1 task).
   */
  const materializeBareNextActions = useCallback(
    (nextActions: NextAction[]) => {
      setTasks((prev) => {
        const withTasks = new Set(prev.map((t) => t.nextActionId));
        const toCreate = nextActions.filter((n) => !withTasks.has(n.id));
        if (toCreate.length === 0) return prev;
        return [...prev, ...toCreate.map((n) => bareTask(n.id, n.stressorId, n.text))];
      });
    },
    [setTasks],
  );

  return {
    tasks,
    updateTask,
    deleteTask,
    deleteTasksByNextAction,
    replaceTasksForNextAction,
    materializeBareNextActions,
    /** Status persystencji (błędy zapisu/odczytu + retry). */
    storage: storage as LocalStorageStatus,
  };
}
