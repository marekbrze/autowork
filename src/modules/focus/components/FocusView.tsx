import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { FunnelStepper } from '@/shared/components/FunnelStepper';
import { StorageStatusToast } from '@/modules/capture/components/StorageStatusToast';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import { useStressors } from '@/modules/capture/hooks/use-stressors';
import { useDoneVisions } from '@/modules/decompose/hooks/use-done-visions';
import { useNextActions } from '@/modules/decompose/hooks/use-next-actions';
import { useReasons } from '@/modules/decompose/hooks/use-reasons';
import { useTasks } from '@/modules/decompose/hooks/use-tasks';
import type { Task } from '@/modules/decompose/types/task';

import { useFocusTimer } from '../hooks/use-focus-timer';
import {
  CONTEXT_ORDER,
  EMPTY_FILTER,
  ENERGY_ORDER,
  type FilterSelection,
  type FocusScreen,
  type SessionSnapshot,
} from '../types/focus';
import { DismissUndoToast, ReadErrorState, SessionResumeBanner } from './FocusStates';
import { FocusTaskScreen } from './FocusTaskScreen';
import { SessionFilter } from './SessionFilter';
import { SessionSummary } from './SessionSummary';

/**
 * Ekran Focus (krok 5–7 lejka) — payoff całego narzędzia. Maszyna stanów:
 * `filter` (SessionFilter) → `session` (FocusTaskScreen, jedno zadanie pod
 * timerem) → `summary` (SessionSummary, celebracja). Kolejka sesji uszeregowana
 * po randku stresora (najbardziej stresujący → pierwsze). Timer liczy w górę
 * (model B, ADR 0016); stany taska Done/Skip/Dismiss (+undo)/Back.
 *
 * Kontener — pobiera dane hookami i przekazuje do ekranów prezentacyjnych.
 *
 * HARDEN:
 * - **Honest persistence** — każdy handler sprawdza wynik `updateTask`/`deleteTask`
 *   i przy awarii zapisu NIE advance'uje / nie zmienia ekranu (wzorzec z ProcessView).
 *   `StorageStatusToast` z retry zostaje widoczny, user zostaje na tasku.
 * - **Resume sesji** — snapshot (kolejka+pozycja) persystowany w `focus:session`;
 *   wejście w `/focus` z przerwaną sesją pokazuje banner „Wznów" (Exit/refresh/back).
 * - **Persystencja filtra** — wybór kontekstów/energii trzymany w `focus:filter`;
 *   kontynuacja Runu z dashboardu pokazuje zapamiętany filtr (punkt startowy), a nie
 *   pusty ekran „żadne filtry".
 * - **Rekonsyliacja mid-session** — task rozwiązany w innej karcie nie wyskakuje jako
 *   bieżący: przewijamy do następnego pending w kolejce.
 */
export function FocusView() {
  const { stressors, storage: stressorStorage } = useStressors();
  const { nextActions, storage: nextActionStorage } = useNextActions();
  const { reasons, storage: reasonStorage } = useReasons();
  const { visions, storage: visionStorage } = useDoneVisions();
  const { tasks, updateTask, deleteTask, storage: taskStorage } = useTasks();

  const [screen, setScreen] = useState<FocusScreen>('filter');
  // Persystencja wyboru filtra (`focus:filter`) — kontynuacja Runa z dashboardu
  // nie może resetować kontekstów/energii do pustego ekranu („żadne filtry…").
  // Zapamiętany filtr = punkt startowy przy powrocie do pracy; user może go zmienić.
  const [persistedSelection, setSelection] = useLocalStorage<FilterSelection>('focus:filter', EMPTY_FILTER);
  const [queue, setQueue] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [running, setRunning] = useState(true);
  const [dismissUndo, setDismissUndo] = useState<{ taskId: string; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Snapshot przerwanej sesji — best-effort (utrata = brak wznowienia, nie utrata danych).
  const [snapshot, setSnapshot, removeSnapshot] = useLocalStorage<SessionSnapshot | null>('focus:session', null);

  // Pozycja stresora w tablicy = jego rank (najbardziej stresujący = 0).
  const stressorRank = useMemo(() => new Map(stressors.map((s, i) => [s.id, i])), [stressors]);

  // Pending taski z pełnymi atrybutami — kandydaci do sesji; sortowanie po ranku.
  const attributed = useMemo(
    () =>
      tasks
        .filter((t) => t.state === 'pending' && t.context && t.energy && t.estimatedTime)
        .sort((a, b) => {
          const ra = stressorRank.get(a.stressorId) ?? 99;
          const rb = stressorRank.get(b.stressorId) ?? 99;
          return ra !== rb ? ra - rb : a.createdAt.localeCompare(b.createdAt);
        }),
    [tasks, stressorRank],
  );

  // Atrybuowane taski już rozwiązane (done/skipped/dismissed) — do rozdzielenia
  // empty-state (#4): „nic nie opisano" vs „wszystko zrobione".
  const resolvedAttributed = useMemo(
    () => tasks.filter((t) => t.context && t.energy && t.estimatedTime && t.state !== 'pending').length,
    [tasks],
  );

  // Sanitize odtworzony filtr — odrzuć konteksty/energie spoza słownika (stary/uszkodzony
  // storage nie tworzy fantomowych chipów ani martwego filtra 0-dopasowań).
  const selection = useMemo<FilterSelection>(
    () => ({
      contexts: persistedSelection.contexts.filter((c) => CONTEXT_ORDER.includes(c)),
      energies: persistedSelection.energies.filter((e) => ENERGY_ORDER.includes(e)),
    }),
    [persistedSelection],
  );

  const matchCount = useMemo(
    () =>
      attributed.filter(
        (t) => selection.contexts.includes(t.context!) && selection.energies.includes(t.energy!),
      ).length,
    [attributed, selection],
  );

  /**
   * Rekonsyliacja (#5): pierwszy indeks ≥ `start`, pod którym task istnieje i jest
   * `pending`. -1 = w kolejce nie ma już pending (sesja wyczerpana / task usunięty).
   * Uwzględnia zmiany stanu z innych kart (storage event) — task rozwiązany „za
   * plecami" nie zostanie pokazany jako bieżący.
   */
  const firstPendingFrom = (q: string[], start: number): number => {
    for (let i = start; i < q.length; i++) {
      const t = tasks.find((x) => x.id === q[i]);
      if (t && t.state === 'pending') return i;
    }
    return -1;
  };

  // Bieżąca pozycja w sesji po rekonsyliacji; -1 gdy brak pending.
  const activeCursor = screen === 'session' ? firstPendingFrom(queue, cursor) : -1;
  const currentTask = activeCursor >= 0 ? tasks.find((t) => t.id === queue[activeCursor]) ?? null : null;
  const currentStressor = currentTask ? (stressors.find((s) => s.id === currentTask.stressorId) ?? null) : null;
  const currentNextAction = currentTask ? (nextActions.find((n) => n.id === currentTask.nextActionId) ?? null) : null;
  const currentReasons = useMemo(
    () => (currentTask ? reasons.filter((r) => r.stressorId === currentTask.stressorId) : []),
    [reasons, currentTask],
  );
  const currentVision = currentTask ? visions[currentTask.stressorId] : undefined;

  // Reaguj na zmiany stanu mid-session (inna karta): przewiń do następnego pending
  // albo zakończ sesję, gdy wyczerpana.
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

  // Snapshot wciąż możliwy do wznowienia? (taski istnieją, jest pending od kursora).
  // `firstPendingFrom` domyka się nad `tasks` — w depach, więc memo przelicza się poprawnie.
  const resumableSnapshot = useMemo<SessionSnapshot | null>(() => {
    if (!snapshot || snapshot.queue.length === 0) return null;
    const idx = firstPendingFrom(snapshot.queue, snapshot.cursor);
    return idx >= 0 ? { queue: snapshot.queue, cursor: idx } : null;
  }, [snapshot, tasks]);

  // Porzuć nieaktualny snapshot (wszystkie taski rozwiązane/usunięte).
  useEffect(() => {
    if (snapshot && screen === 'filter' && !resumableSnapshot) removeSnapshot();
  }, [snapshot, screen, resumableSnapshot, removeSnapshot]);

  // Timer (model B): liczy w górę od zapamiętanego `timerElapsed` bieżącego taska.
  const persistElapsed = (sec: number) => {
    if (currentTask) updateTask(currentTask.id, { timerElapsed: sec });
  };
  const { elapsed, flush } = useFocusTimer({
    initialElapsed: currentTask?.timerElapsed ?? 0,
    running: screen === 'session' && running,
    onPersist: persistElapsed,
  });

  // --- nawigacja / akcje ---

  const start = () => {
    const matched = attributed
      .filter((t) => selection.contexts.includes(t.context!) && selection.energies.includes(t.energy!))
      .map((t) => t.id);
    if (matched.length === 0) return;
    setQueue(matched);
    setCursor(0);
    setRunning(true);
    setDismissUndo(null);
    setScreen('session');
  };

  /** Wznów przerwaną sesję z persystowanego snapshotu (#2). */
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
      removeSnapshot(); // sesja wyczerpana — nie ma czego wznawiać
    }
  };

  const done = () => {
    if (!currentTask) return;
    flush();
    // Honest persistence: przy nieudanym zapisie NIE advance'uj — toast retry już widać.
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
    advance(true); // zachowaj undo (#3 — toast żyje teraz na poziomie FocusView)
  };

  const undoDismiss = () => {
    if (!dismissUndo) return;
    if (!updateTask(dismissUndo.taskId, { state: 'pending' })) return; // honest persistence
    const idx = queue.indexOf(dismissUndo.taskId);
    setDismissUndo(null);
    if (idx >= 0) {
      setCursor(idx);
      setRunning(true);
      setScreen('session'); // #3: undo działa też z ekranu podsumowania
    }
  };

  const back = () => {
    if (activeCursor <= 0) return;
    flush();
    const prevId = queue[activeCursor - 1];
    const prev = tasks.find((t) => t.id === prevId);
    // #9: Back otwiera na nowo TYLKO completed/skipped; dismissed pozostawia
    // (od-cofnięcie Dismiss to osobna ścieżka undo, nie Back).
    if (prev && (prev.state === 'completed' || prev.state === 'skipped')) {
      if (!updateTask(prevId, { state: 'pending' })) return; // honest persistence
    }
    setDismissUndo(null);
    setCursor(activeCursor - 1);
    setRunning(true);
  };

  const togglePause = () => setRunning((r) => !r);

  // Skip = tymczasowe: ominięte zadania wracają do puli przy następnej sesji
  // (Skip → skipped → pending next session). Resetujemy je, gdy wracamy do
  // wyboru sesji (wyjście / nowa sesja / czyszczenie skończonych).
  const returnSkippedToPool = () => {
    tasks.filter((t) => t.state === 'skipped').forEach((t) => updateTask(t.id, { state: 'pending' }));
  };

  const exit = () => {
    flush();
    setRunning(false);
    returnSkippedToPool();
    // Snapshot sesji utrzymywany przez sync-effect — zostaje do wznowienia (#2).
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
    // Każdy deleteTask to osobny zapis; przy awarii przerywamy (toast retry widać),
    // NIE czyścimy lokalnego stanu sesji — dane pozostają nienaruszone.
    for (const t of targets) {
      if (!deleteTask(t.id)) {
        setConfirmClear(false);
        return;
      }
    }
    setConfirmClear(false);
    setDismissUndo(null); // usunięto dismissed — undo bezcelowe
    returnSkippedToPool();
    removeSnapshot();
    setQueue([]);
    setCursor(0);
    setScreen('filter');
  };

  // Status persystencji agregowany po pięciu storach, od których ekran zależy.
  // (Snapshot `focus:session` celowo POMIĘTY — jego awaria ≠ awaria danych Task.)
  const storageView = {
    writeError: taskStorage.writeError,
    readError:
      taskStorage.readError ||
      stressorStorage.readError ||
      nextActionStorage.readError ||
      reasonStorage.readError ||
      visionStorage.readError,
    retry: () => {
      taskStorage.retry();
      stressorStorage.retry();
      nextActionStorage.retry();
      reasonStorage.retry();
      visionStorage.retry();
    },
    dismissErr: () => {
      taskStorage.dismiss();
      stressorStorage.dismiss();
      nextActionStorage.dismiss();
      reasonStorage.dismiss();
      visionStorage.dismiss();
    },
  };

  return (
    <div className="space-y-6">
      <FunnelStepper current="focus" />

      {/* #10: awaria odczytu storage → stan błędu (nie mylny empty-state listy). */}
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
            totalAttributed={attributed.length}
            resolvedAttributed={resolvedAttributed}
            onStart={start}
          />
        </>
      ) : null}

      {screen === 'session' && currentTask && (
        <FocusTaskScreen
          task={currentTask}
          stressor={currentStressor ?? undefined}
          nextAction={currentNextAction ?? undefined}
          reasons={currentReasons}
          doneVision={currentVision}
          elapsedSeconds={elapsed}
          running={running}
          position={{ index: activeCursor, total: queue.length }}
          canGoBack={activeCursor > 0}
          onDone={done}
          onSkip={skip}
          onDismiss={dismiss}
          onBack={back}
          onTogglePause={togglePause}
          onExit={exit}
        />
      )}

      {/* Safeguard: wejście w sesję, ale task zniknął (np. usunięty z innej karty). */}
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

      {/* #3: undo Dismiss na poziomie FocusView — przeżywa skok do podsumowania. */}
      {dismissUndo && <DismissUndoToast text={dismissUndo.text} onUndo={undoDismiss} />}

      <ConfirmDialog
        open={confirmClear}
        title="Delete finished tasks?"
        description="Completed and no-longer-relevant tasks will be removed. This action can't be undone."
        confirmLabel="Delete finished"
        onConfirm={clearCompleted}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
