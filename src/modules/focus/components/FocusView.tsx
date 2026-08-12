import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { FunnelStepper } from '@/shared/components/FunnelStepper';
import { StorageStatusToast } from '@/modules/capture/components/StorageStatusToast';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import { useActiveRunId } from '@/shared/active-run';
import { focusFilterKey, focusSessionKey, focusTaskOrderKey } from '@/shared/funnel-storage';
import { useStressors } from '@/modules/capture/hooks/use-stressors';
import { useDoneVisions } from '@/modules/decompose/hooks/use-done-visions';
import { useNextActions } from '@/modules/decompose/hooks/use-next-actions';
import { useReasons } from '@/modules/decompose/hooks/use-reasons';
import { useTasks } from '@/modules/decompose/hooks/use-tasks';
import type { Task } from '@/modules/decompose/types/task';

import { useFocusTimer } from '../hooks/use-focus-timer';
import { useFocusTabTitle } from '../hooks/use-focus-tab-title';
import {
  CONTEXT_ORDER,
  EMPTY_FILTER,
  ENERGY_ORDER,
  formatClock,
  type FilterSelection,
  type FocusScreen,
  type SessionSnapshot,
} from '../types/focus';
import { DismissUndoToast, ReadErrorState, SessionResumeBanner } from './FocusStates';
import { FocusTaskScreen } from './FocusTaskScreen';
import { SessionFilter } from './SessionFilter';
import { SessionSummary } from './SessionSummary';

/**
 * The Focus screen (funnel steps 5–7) — the payoff of the whole tool. State machine:
 * `filter` (SessionFilter) → `session` (FocusTaskScreen, jedno zadanie pod
 * timerem) → `summary` (SessionSummary, celebracja). Kolejka sesji uszeregowana
 * by stressor rank (most stressful → first). The timer counts up
 * (model B, ADR 0016); stany taska Done/Skip/Dismiss (+undo)/Back.
 *
 * Container — fetches data with hooks and passes it to the presentational screens.
 *
 * HARDEN:
 * - **Honest persistence** — every handler checks the result of `updateTask`/`deleteTask`
 *   i przy awarii zapisu NIE advance'uje / nie zmienia ekranu (wzorzec z ProcessView).
 *   `StorageStatusToast` z retry zostaje widoczny, user zostaje na tasku.
 * - **Resume sesji** — snapshot (kolejka+pozycja) persystowany w `focus:session`;
 *   entering `/focus` with an interrupted session shows a "Resume" banner (Exit/refresh/back).
 * - **Filter persistence** — the context/energy selection is held in `focus:filter`;
 *   continuing a Run from the dashboard shows the remembered filter (the starting point), not
 *   an empty "no filters" screen.
 * - **Mid-session reconciliation** — a task resolved in another tab doesn't pop up as
 *   current: we advance to the next pending in the queue.
 */
export function FocusView() {
  const activeRunId = useActiveRunId();
  const rid = activeRunId ?? '__none__';
  const { stressors, storage: stressorStorage } = useStressors();
  const { nextActions, storage: nextActionStorage } = useNextActions();
  const { reasons, storage: reasonStorage } = useReasons();
  const { visions, storage: visionStorage } = useDoneVisions();
  const { tasks, updateTask, deleteTask, storage: taskStorage } = useTasks();

  const [screen, setScreen] = useState<FocusScreen>('filter');
  // Persystencja wyboru filtra — per-Run (ADR 0044). Kontynuacja Runa z dashboardu
  // must not reset contexts/energy to an empty screen ("no filters…").
  // The remembered filter = the starting point on returning to work; the user can change it.
  const [persistedSelection, setSelection] = useLocalStorage<FilterSelection>(focusFilterKey(rid), EMPTY_FILTER);
  const [queue, setQueue] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [running, setRunning] = useState(true);
  const [dismissUndo, setDismissUndo] = useState<{ taskId: string; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  // F2-1: a "Reset to default" confirmation (destructive — permanently clears the manual TaskOrder).
  const [confirmReset, setConfirmReset] = useState(false);
  // ADR 0048: guard against leaving an active focus session via the clickable stepper.
  const navigate = useNavigate();
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);

  // Snapshot przerwanej sesji — per-Run (ADR 0044); best-effort (utrata = brak wznowienia).
  const [snapshot, setSnapshot, removeSnapshot] = useLocalStorage<SessionSnapshot | null>(focusSessionKey(rid), null);

  // Manual queue order — per-Run (ADR 0044/0036): default (empty) = stressor rank;
  // reordering in the filter overrides. The same order sorts the list here, the session queue, and the run list.
  const [taskOrder, setTaskOrder, removeTaskOrder, taskOrderStorage] = useLocalStorage<string[]>(focusTaskOrderKey(rid), []);
  const hasManualOrder = taskOrder.length > 0;

  // A stressor's position in the array = its rank (most stressful = 0).
  const stressorRank = useMemo(() => new Map(stressors.map((s, i) => [s.id, i])), [stressors]);

  // Pending and skipped tasks with full attributes — session candidates. Skipped = deferred
  // ("not now"), but still available in the pool; restored to `pending` at the start of a new
  // session (see `start`). Sorted by stressor rank (most stressful → first).
  const attributed = useMemo(
    () =>
      tasks
        .filter(
          (t) => (t.state === 'pending' || t.state === 'skipped') && t.context && t.energy && t.estimatedTime,
        )
        .sort((a, b) => {
          const ra = stressorRank.get(a.stressorId) ?? 99;
          const rb = stressorRank.get(b.stressorId) ?? 99;
          return ra !== rb ? ra - rb : a.createdAt.localeCompare(b.createdAt);
        }),
    [tasks, stressorRank],
  );

  // Attributed tasks already resolved (completed/dismissed) — for splitting the empty-state
  // (#4): "nothing described yet" vs "everything done". Skipped does NOT count as resolved
  // (it's deferred, still in the pool — see `attributed`); different from terminal dismissed.
  const resolvedAttributed = useMemo(
    () =>
      tasks.filter(
        (t) => t.context && t.energy && t.estimatedTime && (t.state === 'completed' || t.state === 'dismissed'),
      ).length,
    [tasks],
  );

  // Sanitize the restored filter — reject contexts/energy outside the dictionary (old/corrupt
  // storage doesn't create phantom chips or a dead 0-match filter).
  const selection = useMemo<FilterSelection>(
    () => ({
      contexts: persistedSelection.contexts.filter((c) => CONTEXT_ORDER.includes(c)),
      energies: persistedSelection.energies.filter((e) => ENERGY_ORDER.includes(e)),
    }),
    [persistedSelection],
  );

  // Matched tasks in `TaskOrder` order (default = stressor rank). The same order goes
  // to the filter list, the session queue (Start), and the run list (ADR 0036).
  const matchedTasks = useMemo(() => {
    const orderIndex = (id: string) => {
      const i = taskOrder.indexOf(id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return attributed
      .filter((t) => selection.contexts.includes(t.context!) && selection.energies.includes(t.energy!))
      .sort((a, b) => {
        const oa = orderIndex(a.id);
        const ob = orderIndex(b.id);
        if (oa !== ob) return oa - ob;
        const ra = stressorRank.get(a.stressorId) ?? 99;
        const rb = stressorRank.get(b.stressorId) ?? 99;
        return ra !== rb ? ra - rb : a.createdAt.localeCompare(b.createdAt);
      });
  }, [attributed, selection, taskOrder, stressorRank]);
  const matchCount = matchedTasks.length;
  // Total estimate of matched tasks (min) — shown in the filter (ADR 0060). Matched always
  // have `estimatedTime` (the `attributed` filter requires it), so >0 when matchCount>0.
  const matchedEstimateMin = useMemo(
    () => matchedTasks.reduce((sum, t) => sum + (t.estimatedTime ?? 0), 0),
    [matchedTasks],
  );

  /**
   * Reconciliation (#5): the first index ≥ `start` at which a task exists and is
   * `pending`. -1 = no more pending in the queue (session exhausted / task deleted).
   * Accounts for state changes from other tabs (storage event) — a task resolved "behind
   * your back" won't be shown as current.
   */
  const firstPendingFrom = (q: string[], start: number): number => {
    for (let i = start; i < q.length; i++) {
      const t = tasks.find((x) => x.id === q[i]);
      if (t && t.state === 'pending') return i;
    }
    return -1;
  };

  // Current position in the session after reconciliation; -1 when no pending.
  const activeCursor = screen === 'session' ? firstPendingFrom(queue, cursor) : -1;
  // Deferred (skip) before the current cursor — the position indicator must distinguish them from handled,
  // otherwise "X / Y" misleads, counting skip as done (ADR 0038).
  const deferredEarlier =
    activeCursor > 0
      ? queue.slice(0, activeCursor).filter((id) => tasks.find((t) => t.id === id)?.state === 'skipped').length
      : 0;
  const currentTask = activeCursor >= 0 ? tasks.find((t) => t.id === queue[activeCursor]) ?? null : null;
  const currentStressor = currentTask ? (stressors.find((s) => s.id === currentTask.stressorId) ?? null) : null;
  const currentNextAction = currentTask ? (nextActions.find((n) => n.id === currentTask.nextActionId) ?? null) : null;
  const currentReasons = useMemo(
    () => (currentTask ? reasons.filter((r) => r.stressorId === currentTask.stressorId) : []),
    [reasons, currentTask],
  );
  const currentVision = currentTask ? visions[currentTask.stressorId] : undefined;

  // React to mid-session state changes (another tab): advance to the next pending
  // or end the session when exhausted.
  useEffect(() => {
    if (screen !== 'session') return;
    if (activeCursor === -1) {
      setRunning(false);
      setScreen('summary');
      removeSnapshot();
      return;
    }
    if (activeCursor !== cursor) setCursor(activeCursor);
  }, [screen, activeCursor, cursor, removeSnapshot]);

  // Trzymaj snapshot sesji w sync podczas sesji (do wznowienia po Exit/refresh).
  // Best-effort: wynik zapisu ignorujemy (utrata bookmarka ≠ utrata danych).
  useEffect(() => {
    if (screen === 'session' && queue.length > 0) setSnapshot({ queue, cursor });
  }, [screen, queue, cursor, setSnapshot]);

  // Is the snapshot still resumable? (tasks exist, there's a pending from the cursor).
  // `firstPendingFrom` closes over `tasks` — it's in deps, so the memo recomputes correctly.
  const resumableSnapshot = useMemo<SessionSnapshot | null>(() => {
    if (!snapshot || snapshot.queue.length === 0) return null;
    const idx = firstPendingFrom(snapshot.queue, snapshot.cursor);
    return idx >= 0 ? { queue: snapshot.queue, cursor: idx } : null;
  }, [snapshot, tasks]);

  // Discard the stale snapshot (all tasks resolved/deleted).
  useEffect(() => {
    if (snapshot && screen === 'filter' && !resumableSnapshot) removeSnapshot();
  }, [snapshot, screen, resumableSnapshot, removeSnapshot]);

  // Timer (model B): counts up from the current task's remembered `timerElapsed`.
  const persistElapsed = (sec: number) => {
    if (currentTask) updateTask(currentTask.id, { timerElapsed: sec });
  };
  const { elapsed, flush } = useFocusTimer({
    initialElapsed: currentTask?.timerElapsed ?? 0,
    taskKey: currentTask?.id ?? null,
    running: screen === 'session' && running,
    onPersist: persistElapsed,
  });

  // ADR 0053: czas timera w title karty (live elapsed + `· paused` / `· over`).
  useFocusTabTitle({
    active: screen === 'session' && !!currentTask,
    clock: formatClock(elapsed),
    paused: screen === 'session' && !running,
    over: currentTask?.estimatedTime != null && elapsed > currentTask.estimatedTime * 60,
  });

  // --- nawigacja / akcje ---

  const start = () => {
    // Skip = temporary: at the start of a NEW session the skipped tasks return to the pool as
    // `pending` (spec focus.md §Skip: "returns as pending at the next session"). Here, not
    // on exit/navigation — so skip doesn't depend on which way you return.
    returnSkippedToPool();
    const matched = matchedTasks.map((t) => t.id); // `TaskOrder` order (ADR 0036)
    if (matched.length === 0) return;
    setQueue(matched);
    setCursor(0);
    setRunning(true);
    setDismissUndo(null);
    setScreen('session');
  };

  /** Save a new order of matched tasks to `TaskOrder` (out-of-filter positions preserved). */
  const reorderMatched = (newMatchedIds: string[]) => {
    const matchedSet = new Set(newMatchedIds);
    const rest = taskOrder.filter((id) => !matchedSet.has(id));
    setTaskOrder([...newMatchedIds, ...rest]); // honest persistence: on failure the state doesn't break
  };
  const resetOrder = () => setConfirmReset(true); // F2-1: potwierdzenie przed wyczyszczeniem
  const doResetOrder = () => {
    removeTaskOrder();
    setConfirmReset(false);
  };

  /** Resume an interrupted session from the persisted snapshot (#2). */
  const resumeSession = () => {
    if (!resumableSnapshot) return;
    setQueue(resumableSnapshot.queue);
    setCursor(resumableSnapshot.cursor);
    setRunning(true);
    setScreen('session');
  };

  const advance = (keepUndo = false) => {
    if (!keepUndo) setDismissUndo(null);
    if (cursor < queue.length - 1) {
      setCursor((c) => c + 1);
      setRunning(true);
    } else {
      setRunning(false);
      setScreen('summary');
      removeSnapshot(); // session exhausted — nothing to resume
    }
  };

  const done = () => {
    if (!currentTask) return;
    flush();
    // Honest persistence: on a failed write DON'T advance — the retry toast is already visible.
    if (!updateTask(currentTask.id, { state: 'completed' })) return;
    advance();
  };

  const skip = () => {
    if (!currentTask) return;
    flush();
    if (!updateTask(currentTask.id, { state: 'skipped' })) return;
    advance();
  };

  const dismiss = () => {
    if (!currentTask) return;
    flush();
    if (!updateTask(currentTask.id, { state: 'dismissed' })) return;
    setDismissUndo({ taskId: currentTask.id, text: currentTask.text });
    advance(true); // keep undo (#3 — the toast now lives at the FocusView level)
  };

  const undoDismiss = () => {
    if (!dismissUndo) return;
    if (!updateTask(dismissUndo.taskId, { state: 'pending' })) return; // honest persistence
    const idx = queue.indexOf(dismissUndo.taskId);
    setDismissUndo(null);
    if (idx >= 0) {
      setCursor(idx);
      setRunning(true);
      setScreen('session'); // #3: undo also works from the summary screen
    }
  };

  const back = () => {
    if (activeCursor <= 0) return;
    flush();
    const prevId = queue[activeCursor - 1];
    const prev = tasks.find((t) => t.id === prevId);
    // #9: Back otwiera na nowo TYLKO completed/skipped; dismissed pozostawia
    // (un-dismissing is a separate undo path, not Back).
    if (prev && (prev.state === 'completed' || prev.state === 'skipped')) {
      if (!updateTask(prevId, { state: 'pending' })) return; // honest persistence
    }
    setDismissUndo(null);
    setCursor(activeCursor - 1);
    setRunning(true);
  };

  const togglePause = () => setRunning((r) => !r);

  // Skip = temporary: skipped tasks return to the pool as `pending`. The main moment
  // to restore is the start of a new session (`start`) — independent of how the user left
  // the session (Exit / Dashboard / refresh / snapshot abandon). `clearCompleted` and `onNewSession`
  // call it too (idempotent end-of-session safety). `exit()` does NOT — skips stay
  // deferred until Start (ADR 0038); the pool is still visible as `skipped` in `attributed`.
  const returnSkippedToPool = () => {
    tasks.filter((t) => t.state === 'skipped').forEach((t) => updateTask(t.id, { state: 'pending' }));
  };

  const exit = () => {
    flush();
    setRunning(false);
    // Snapshot sesji utrzymywany przez sync-effect — zostaje do wznowienia (#2).
    // We deliberately DON'T restore skipped → pending: skips stay deferred until a fresh Start,
    // otherwise Resume (cursor past the skips) wouldn't reach them (ADR 0038).
    setScreen('filter');
  };

  // --- dane podsumowania ---

  const completedItems = useMemo(
    () =>
      queue
        .map((id) => tasks.find((t) => t.id === id))
        .filter((t): t is Task => t !== undefined && t.state === 'completed')
        .map((t) => ({ id: t.id, text: t.text, seconds: t.timerElapsed })),
    [queue, tasks],
  );
  const dismissedItems = useMemo(
    () =>
      queue
        .map((id) => tasks.find((t) => t.id === id))
        .filter((t): t is Task => t !== undefined && t.state === 'dismissed')
        .map((t) => ({ id: t.id, text: t.text })),
    [queue, tasks],
  );
  const totalSeconds = useMemo(() => completedItems.reduce((s, t) => s + t.seconds, 0), [completedItems]);

  const clearCompleted = () => {
    const targets = tasks.filter((t) => t.state === 'completed' || t.state === 'dismissed');
    // Each deleteTask is a separate write; on failure we abort (the retry toast is visible),
    // we DON'T clear the local session state — the data stays intact.
    for (const t of targets) {
      if (!deleteTask(t.id)) {
        setConfirmClear(false);
        return;
      }
    }
    setConfirmClear(false);
    setDismissUndo(null); // dismissed removed — undo is pointless
    returnSkippedToPool();
    removeSnapshot();
    setQueue([]);
    setCursor(0);
    setScreen('filter');
  };

  // Persistence status aggregated across the five stores the screen depends on.
  // (The `focus:session` snapshot is deliberately OMITTED — its failure ≠ a Task data failure.)
  const storageView = {
    writeError: taskStorage.writeError || taskOrderStorage.writeError,
    readError:
      taskStorage.readError ||
      stressorStorage.readError ||
      nextActionStorage.readError ||
      reasonStorage.readError ||
      visionStorage.readError ||
      taskOrderStorage.readError,
    retry: () => {
      taskStorage.retry();
      stressorStorage.retry();
      nextActionStorage.retry();
      reasonStorage.retry();
      visionStorage.retry();
      taskOrderStorage.retry();
    },
    dismissErr: () => {
      taskStorage.dismiss();
      stressorStorage.dismiss();
      nextActionStorage.dismiss();
      reasonStorage.dismiss();
      visionStorage.dismiss();
      taskOrderStorage.dismiss();
    },
  };

  return (
    <div className="space-y-6">
      <FunnelStepper
        current="focus"
        onBeforeNavigate={(_stage, route) => {
          // Active session (task under the timer, timer running) → ask before leaving (ADR 0048).
          // `currentTask` gates out the rare safeguard state (session, but the task disappeared) — CS-3.
          if (screen === 'session' && currentTask && running) {
            setLeaveTarget(route);
            return false;
          }
          return true;
        }}
      />

      {/* #10: storage read failure → error state (not a misleading list empty-state). */}
      {screen === 'filter' && storageView.readError ? (
        <ReadErrorState onReload={() => window.location.reload()} />
      ) : screen === 'filter' ? (
        <>
          {/* #2: przerwana sesja — banner wznawiania (opt-in, nad filtrem). */}
          {resumableSnapshot && (
            <SessionResumeBanner
              position={resumableSnapshot.cursor + 1}
              total={resumableSnapshot.queue.length}
              onResume={resumeSession}
              onAbandon={removeSnapshot}
            />
          )}

          <SessionFilter
            selection={selection}
            onSelectionChange={setSelection}
            matchCount={matchCount}
            matchedEstimateMin={matchedEstimateMin}
            totalAttributed={attributed.length}
            resolvedAttributed={resolvedAttributed}
            matchedTasks={matchedTasks}
            onReorder={reorderMatched}
            hasManualOrder={hasManualOrder}
            onResetOrder={resetOrder}
            onStart={start}
          />
        </>
      ) : null}

      {screen === 'session' && currentTask && (
        <FocusTaskScreen
          key={currentTask.id}
          task={currentTask}
          stressor={currentStressor ?? undefined}
          nextAction={currentNextAction ?? undefined}
          reasons={currentReasons}
          doneVision={currentVision}
          elapsedSeconds={elapsed}
          running={running}
          position={{ index: activeCursor, total: queue.length, deferred: deferredEarlier }}
          canGoBack={activeCursor > 0}
          onDone={done}
          onSkip={skip}
          onDismiss={dismiss}
          onBack={back}
          onTogglePause={togglePause}
          onExit={exit}
        />
      )}

      {/* Safeguard: entered a session, but the task disappeared (e.g. deleted from another tab). */}
      {screen === 'session' && !currentTask && (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No current task in the session.
          <div className="mt-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setScreen('filter')}>
              ← Back to session picker
            </Button>
          </div>
        </div>
      )}

      {screen === 'summary' && (
        <SessionSummary
          completed={completedItems}
          dismissed={dismissedItems}
          totalSeconds={totalSeconds}
          onClearCompleted={() => setConfirmClear(true)}
          onNewSession={() => {
            returnSkippedToPool();
            removeSnapshot();
            setDismissUndo(null);
            setQueue([]);
            setCursor(0);
            setScreen('filter');
          }}
        />
      )}

      <div className="flex justify-start pt-2">
        <Link to="/" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          ← Dashboard
        </Link>
      </div>

      <StorageStatusToast
        writeError={storageView.writeError}
        readError={storageView.readError}
        onRetry={storageView.retry}
        onDismiss={storageView.dismissErr}
        entityLabel={taskStorage.readError ? 'tasks' : 'data'}
      />

      {/* #3: Dismiss undo at the FocusView level — survives the jump to the summary. */}
      {dismissUndo && <DismissUndoToast text={dismissUndo.text} onUndo={undoDismiss} />}

      <ConfirmDialog
        open={confirmClear}
        title="Delete finished tasks?"
        description="Completed and no-longer-relevant tasks will be removed. This action can't be undone."
        confirmLabel="Delete finished"
        onConfirm={clearCompleted}
        onCancel={() => setConfirmClear(false)}
      />

      {/* F2-1: queue-reset confirmation (destructive — loss of the manual order). */}
      <ConfirmDialog
        open={confirmReset}
        title="Reset task order?"
        description="Your custom order will be cleared — tasks return to the default (most stressful first). This can't be undone."
        confirmLabel="Reset to default"
        onConfirm={doResetOrder}
        onCancel={() => setConfirmReset(false)}
      />

      {/* ADR 0048: confirmation before leaving an active focus session via the clickable stepper. */}
      <ConfirmDialog
        open={leaveTarget !== null}
        title="Leave the active session?"
        description="Your focus session is running. It'll pause — resume it when you come back to Focus."
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={() => {
          const target = leaveTarget;
          setLeaveTarget(null);
          if (target) navigate(target);
        }}
        onCancel={() => setLeaveTarget(null)}
      />
    </div>
  );
}
