import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Home,
  Lightbulb,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { FunnelStepper } from '@/shared/components/FunnelStepper';
import { StorageStatusToast } from '@/modules/capture/components/StorageStatusToast';
import { useStressors } from '@/modules/capture/hooks/use-stressors';
import type { Stressor } from '@/modules/capture/types/stressor';
import { useNextActions } from '@/modules/decompose/hooks/use-next-actions';
import { useTasks } from '@/modules/decompose/hooks/use-tasks';
import type { Context, Energy, EstimatedTime, Task } from '@/modules/decompose/types/task';

import { OptionStepPanel, type Opt } from './OptionStepPanel';
import { ProcessingSidebar, type SidebarGroup, type SidebarTag } from './ProcessingSidebar';
import { TaskNameEditor } from './TaskNameEditor';

/** Kroki atrybutów w stałej kolejności (Context → Energy → Czas). */
type StepKind = 'context' | 'energy' | 'estimatedTime';
type Screen = 'summary' | 'processing' | 'done';

interface ProcStep {
  taskId: string;
  kind: StepKind;
}

const STEP_ORDER: StepKind[] = ['context', 'energy', 'estimatedTime'];
const STEP_LABELS: Record<StepKind, string> = {
  context: 'Context',
  energy: 'Energy',
  estimatedTime: 'Time',
};

const CONTEXT_OPTIONS: { value: Context; label: string; key: string; Icon: ComponentType<LucideProps> }[] = [
  { value: 'Phone', label: 'Phone', key: '1', Icon: Phone },
  { value: 'Message', label: 'Message', key: '2', Icon: MessageSquare },
  { value: 'Creative', label: 'Creative', key: '3', Icon: Lightbulb },
  { value: 'Errands', label: 'Errands', key: '4', Icon: ShoppingCart },
  { value: 'Home', label: 'Home', key: '5', Icon: Home },
  { value: 'City', label: 'City', key: '6', Icon: MapPin },
];

const ENERGY_OPTIONS: { value: Energy; label: string; key: string }[] = [
  { value: 1, label: 'Low', key: '1' },
  { value: 2, label: 'Medium', key: '2' },
  { value: 3, label: 'High', key: '3' },
];

const TIME_OPTIONS: { value: EstimatedTime; label: string; key: string; Icon: ComponentType<LucideProps> }[] = [
  { value: 5, label: '5 min', key: '1', Icon: Clock },
  { value: 15, label: '15 min', key: '2', Icon: Clock },
  { value: 30, label: '30 min', key: '3', Icon: Clock },
  { value: 45, label: '45 min', key: '4', Icon: Clock },
  { value: 60, label: '60 min', key: '5', Icon: Clock },
];

/** Atrybuty taska jeszcze do nadania (kroki sesji). */
function missingSteps(task: Task): StepKind[] {
  return STEP_ORDER.filter((k) => task[k] == null);
}

const stepId = (taskId: string, kind: StepKind) => `${taskId}:${kind}`;

/**
 * Ekran Procesowania (krok 4 lejka). Wzorzec 1:1 z `marekbrze/dopadone`
 * (`ProcessingView`): płotka kolejka mikrokroków — po jednym kroku na
 * brakujący atrybut (Context/Energy/Czas) — prowadzona klawiaturą.
 * Trzy ekrany: summary → processing → done. ADR 0012 / 0013.
 */
export function ProcessView() {
  const navigate = useNavigate();
  const { stressors, storage: stressorStorage } = useStressors();
  const { nextActions, storage: nextActionStorage } = useNextActions();
  const { tasks, updateTask, deleteTask, storage } = useTasks();

  // --- sesja (budowana na „Rozpocznij"; stepOrder mutowany tylko przy usuwaniu) ---
  const [screen, setScreen] = useState<Screen>('summary');
  const [sessionTaskIds, setSessionTaskIds] = useState<string[]>([]);
  const [stepOrder, setStepOrder] = useState<ProcStep[]>([]);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Mapa pozycji stresora = jego rank (najbardziej stresujący = 0). Tablica
  // stressorów jest kanonicznie uporządkowana po ranku (capture/types/stressor).
  const stressorRank = useMemo(() => new Map(stressors.map((s, i) => [s.id, i])), [stressors]);

  // Zadania nadające się do sesji: pending i z ≥1 brakującym atrybutem,
  // w kolejności ranku stresu (potem stabilnie po id taska).
  const sessionTasks = useMemo(() => {
    return tasks
      .filter((t) => t.state === 'pending' && missingSteps(t).length > 0)
      .sort((a, b) => {
        const ra = stressorRank.get(a.stressorId) ?? 99;
        const rb = stressorRank.get(b.stressorId) ?? 99;
        return ra !== rb ? ra - rb : a.createdAt.localeCompare(b.createdAt);
      });
  }, [tasks, stressorRank]);

  // Stat-cards podsumowania (na żywo).
  const pendingTasks = useMemo(() => tasks.filter((t) => t.state === 'pending'), [tasks]);
  const counts = useMemo(
    () => ({
      context: pendingTasks.filter((t) => t.context == null).length,
      energy: pendingTasks.filter((t) => t.energy == null).length,
      time: pendingTasks.filter((t) => t.estimatedTime == null).length,
    }),
    [pendingTasks],
  );
  const nothingToDo = counts.context === 0 && counts.energy === 0 && counts.time === 0;

  const currentStep = stepOrder[cursorIndex] ?? null;
  const currentTask = useMemo(
    () => (currentStep ? tasks.find((t) => t.id === currentStep.taskId) ?? null : null),
    [currentStep, tasks],
  );

  // --- pomocnicze: opcje / prefill dla bieżącego kroka ---
  const optionsFor = (kind: StepKind): Opt[] => {
    if (kind === 'context') return CONTEXT_OPTIONS.map(({ label, key, Icon }) => ({ key, label, Icon }));
    if (kind === 'energy') return ENERGY_OPTIONS.map(({ value, label, key }) => ({ key, label, battery: value }));
    return TIME_OPTIONS.map(({ label, key, Icon }) => ({ key, label, Icon }));
  };

  const prefillKey = (task: Task | null, kind: StepKind | null): string | null => {
    if (!task || !kind) return null;
    if (kind === 'context') return CONTEXT_OPTIONS.find((o) => o.value === task.context)?.key ?? null;
    if (kind === 'energy') return ENERGY_OPTIONS.find((o) => o.value === task.energy)?.key ?? null;
    return TIME_OPTIONS.find((o) => o.value === task.estimatedTime)?.key ?? null;
  };

  const gridFor = (kind: StepKind): string =>
    kind === 'context'
      ? 'grid-cols-2 sm:grid-cols-3'
      : kind === 'energy'
        ? 'grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-5';

  // --- nawigacja ---
  const landOn = (idx: number, steps: ProcStep[]) => {
    const clamped = Math.max(0, Math.min(idx, steps.length - 1));
    setCursorIndex(clamped);
    const step = steps[clamped];
    const task = step ? tasks.find((t) => t.id === step.taskId) ?? null : null;
    setPendingKey(prefillKey(task, step?.kind ?? null));
    setEditingTaskId(null);
  };

  const advance = () => {
    if (cursorIndex < stepOrder.length - 1) {
      landOn(cursorIndex + 1, stepOrder);
    } else {
      setScreen('done');
    }
  };

  const goBack = () => {
    if (cursorIndex > 0) landOn(cursorIndex - 1, stepOrder);
    else setScreen('summary'); // z pierwszego kroka — wyjście z sesji do podsumowania
  };

  const markCompleted = (taskId: string, kind: StepKind) => {
    setCompleted((prev) => new Set([...prev, stepId(taskId, kind)]));
  };

  const commit = (kind: StepKind, value: Context | Energy | EstimatedTime) => {
    if (!currentStep || !currentTask) return;
    // Rozgałęzione przypisanie — computed-key z wartością unijną nie przeszedłby
    // jako Partial<Task>; każda gałąź niesie właściwy typ atrybutu.
    let ok = false;
    if (kind === 'context') ok = updateTask(currentTask.id, { context: value as Context });
    else if (kind === 'energy') ok = updateTask(currentTask.id, { energy: value as Energy });
    else ok = updateTask(currentTask.id, { estimatedTime: value as EstimatedTime });
    // Honest persistence: zaznacz ✓ i advance'uj TYLKO po udanym zapisie. Przy
    // nieudanym (quota/disabled) stan NIE zmienia się (useLocalStorage), toast
    // writeError już pokazuje retry — zostajemy na kroku do czasu jego zapisu.
    if (!ok) return;
    markCompleted(currentTask.id, kind);
    advance();
  };

  const skip = () => {
    if (!currentStep) return;
    markCompleted(currentStep.taskId, currentStep.kind);
    advance();
  };

  const commitPending = () => {
    if (!currentStep || pendingKey == null) return;
    const opt = optionsFor(currentStep.kind).find((o) => o.key === pendingKey);
    if (!opt) return;
    if (currentStep.kind === 'context') commit('context', CONTEXT_OPTIONS.find((o) => o.key === opt.key)!.value);
    else if (currentStep.kind === 'energy') commit('energy', ENERGY_OPTIONS.find((o) => o.key === opt.key)!.value);
    else commit('estimatedTime', TIME_OPTIONS.find((o) => o.key === opt.key)!.value);
  };

  const cyclePending = (dir: 1 | -1) => {
    if (!currentStep) return;
    const opts = optionsFor(currentStep.kind);
    setPendingKey((prev) => {
      const i = prev ? opts.findIndex((o) => o.key === prev) : -1;
      const next = prev ? i + dir : 0;
      const clamped = Math.max(0, Math.min(next, opts.length - 1));
      return opts[clamped]?.key ?? null;
    });
  };

  const jumpToTask = (taskId: string) => {
    const idx = stepOrder.findIndex((s) => s.taskId === taskId);
    if (idx >= 0) landOn(idx, stepOrder);
  };

  const startSession = () => {
    const ids = sessionTasks.map((t) => t.id);
    const steps = sessionTasks.flatMap((t) => missingSteps(t).map((kind) => ({ taskId: t.id, kind })));
    if (steps.length === 0) return;
    setSessionTaskIds(ids);
    setStepOrder(steps);
    setCompleted(new Set());
    setCursorIndex(0);
    const firstTask = tasks.find((t) => t.id === steps[0].taskId) ?? null;
    setPendingKey(prefillKey(firstTask, steps[0].kind));
    setEditingTaskId(null);
    setScreen('processing');
  };

  // Usuwanie taska mid-session: czyści jego kroki z kolejki i skacze do pierwszego
  // kroku następnego taska (lub done, gdy ostatni). Wzorzec dopadone. Honest
  // persistence: lokalne mutacje sesji (stepOrder/completed/nav) TYLKO po udanym
  // zapisie usunięcia — inaczej UI pokazałoby usunięcie, którego nie ma na dysku.
  const handleDelete = (taskId: string) => {
    if (!deleteTask(taskId)) return;
    const firstDeletedIdx = stepOrder.findIndex((s) => s.taskId === taskId);
    const nextStep = stepOrder.slice(firstDeletedIdx >= 0 ? firstDeletedIdx : 0).find((s) => s.taskId !== taskId);
    const nextSteps = stepOrder.filter((s) => s.taskId !== taskId);
    const nextCompleted = new Set([...completed].filter((id) => !id.startsWith(`${taskId}:`)));
    setStepOrder(nextSteps);
    setCompleted(nextCompleted);
    setSessionTaskIds((prev) => prev.filter((id) => id !== taskId));
    setEditingTaskId(null);
    if (nextSteps.length === 0) {
      // Usunięto jedyny task sesji → brak czegoś do celebracji; summary na nowo
      // policzy stan (pokaże empty / „Wszystko gotowe"), zamiast ekranu „0 zadań".
      setScreen('summary');
      return;
    }
    if (nextStep) {
      const idx = nextSteps.findIndex((s) => s.taskId === nextStep.taskId && s.kind === nextStep.kind);
      landOn(idx >= 0 ? idx : 0, nextSteps);
    } else {
      setScreen('done');
    }
  };

  const saveEdit = (text: string) => {
    // Honest persistence: zamykaj edytor tylko po udanym zapisie tekstu. Przy
    // nieudanym zostajemy w edytorze (toast writeError + retry).
    if (currentTask && updateTask(currentTask.id, { text })) setEditingTaskId(null);
  };

  // --- klawiatura globalna (summary: Enter=start; processing: opcje/Enter/Esc/←/↑↓) ---
  // ref na najnowszy handler, listener podpinany raz na zmianę ekranu.
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandlerRef.current = (e: KeyboardEvent) => {
    if (editingTaskId) return; // nie przeszkadzaj w edycji nazwy
    // Nie przechwytuj klawiszy, gdy fokus jest na interaktywnym elemencie — niech
    // działa natywna aktywacja (Enter/Space na przycisku lub linku = klik). Bez
    // tego globalny Enter „double-fire'owałby" z natywnym klikiem: Enter na karcie
    // opcji commitowałoby dwa razy, Enter na Trash → commit + delete.
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A') return;
    if (screen === 'summary') {
      if (e.key === 'Enter' && !nothingToDo) {
        e.preventDefault();
        startSession();
      }
      return;
    }
    if (screen !== 'processing' || !currentStep) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goBack();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      skip();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (pendingKey) commitPending();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      cyclePending(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      cyclePending(-1);
    } else {
      const opt = optionsFor(currentStep.kind).find((o) => o.key === e.key);
      if (opt) {
        e.preventDefault();
        setPendingKey(opt.key);
      }
    }
  };
  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  // Honest persistence — dokończenie commitu po udanym retry: krok, którego
  // atrybut właśnie się utrwalił (np. klik „Spróbuj ponownie" po nieudanym
  // zapisie), zaznacz ✓ i advance'uj. self-heal: też zamyka kroki, które nabrały
  // atrybutu po skoku/edycji. W sesji każdy krok startuje z nullem, więc trigger
  // = „atrybut właśnie zapisany" (a nie prefill, bo missingSteps go wykluczył).
  useEffect(() => {
    if (screen !== 'processing' || !currentStep || !currentTask) return;
    const sid = stepId(currentTask.id, currentStep.kind);
    if (completed.has(sid)) return;
    if (currentTask[currentStep.kind] != null) {
      markCompleted(currentTask.id, currentStep.kind);
      advance();
    }
  }, [screen, currentStep, currentTask]);

  // --- dane dla sidebaru ---
  const sidebarGroups: SidebarGroup[] = useMemo(() => {
    const groups: SidebarGroup[] = [];
    for (const id of sessionTaskIds) {
      const task = tasks.find((t) => t.id === id);
      if (!task) continue;
      const steps = stepOrder.filter((s) => s.taskId === id);
      const tags: SidebarTag[] = STEP_ORDER.map((kind) => ({
        label: STEP_LABELS[kind],
        done: task[kind] != null || completed.has(stepId(id, kind)),
      }));
      const done = steps.length > 0 && steps.every((s) => completed.has(stepId(s.taskId, s.kind)));
      const stressor: Stressor | null = stressors.find((s) => s.id === task.stressorId) ?? null;
      let group = groups.find((g) => (g.stressor?.id ?? null) === (stressor?.id ?? null));
      if (!group) {
        group = { stressor, tasks: [] };
        groups.push(group);
      }
      group.tasks.push({ id, name: task.text, tags, done });
    }
    return groups;
  }, [sessionTaskIds, tasks, stepOrder, completed, stressors]);

  const sidebarDoneCount = useMemo(
    () =>
      sessionTaskIds.filter((id) => {
        const steps = stepOrder.filter((s) => s.taskId === id);
        return steps.length > 0 && steps.every((s) => completed.has(stepId(s.taskId, s.kind)));
      }).length,
    [sessionTaskIds, stepOrder, completed],
  );

  const numbering = (id: string) => sessionTaskIds.indexOf(id) + 1;

  const currentTaskSteps = useMemo(
    () => (currentTask ? stepOrder.filter((s) => s.taskId === currentTask.id) : []),
    [currentTask, stepOrder],
  );
  const currentStressor = currentTask ? stressors.find((s) => s.id === currentTask.stressorId) ?? null : null;
  const currentNextAction = currentTask ? nextActions.find((n) => n.id === currentTask.nextActionId) ?? null : null;

  // Status persystencji agregowany po trzech storach, od których ekran zależy.
  // W `process` zapisywane są tylko taski (writeError stamtąd); odczyt może
  // wybuchnąć w każdym z trzech — bez tego awaria stresorów/next-actions po
  // cichu degraduje grupowanie („Bez stresora") bez komunikatu.
  const storageView = {
    writeError: storage.writeError,
    readError: storage.readError || stressorStorage.readError || nextActionStorage.readError,
    retry: () => {
      storage.retry();
      stressorStorage.retry();
      nextActionStorage.retry();
    },
    dismiss: () => {
      storage.dismiss();
      stressorStorage.dismiss();
      nextActionStorage.dismiss();
    },
  };

  return (
    <div className="space-y-6">
      <FunnelStepper current="process" />

      {/* ── SUMMARY ─────────────────────────────────────────────────── */}
      {screen === 'summary' && (
        <div className="space-y-6">
          {nothingToDo ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <p className="text-sm text-muted-foreground">
                All set — no tasks left to process.
              </p>
              <Button type="button" className="mt-4" onClick={() => navigate('/focus')}>
                Continue to focus
                <ArrowRight />
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">To process</h2>
                <p className="text-sm text-muted-foreground">
                  Tag each task with context, energy, and time — this powers the session filter in{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">focus</code>.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard n={counts.context} label="Without context" />
                <StatCard n={counts.energy} label="Without energy" />
                <StatCard n={counts.time} label="Without time" />
              </div>
              <Button type="button" size="lg" onClick={startSession}>
                Start <kbd className="ml-1 rounded bg-primary-foreground/20 px-1.5 py-0.5 text-xs">↵</kbd>
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── PROCESSING ──────────────────────────────────────────────── */}
      {screen === 'processing' && currentStep && currentTask && (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <ProcessingSidebar
            groups={sidebarGroups}
            totalTasks={sessionTaskIds.length}
            doneCount={sidebarDoneCount}
            currentTaskId={currentTask.id}
            numbering={numbering}
            onJump={jumpToTask}
          />

          <div className="space-y-4">
            {/* Breadcrumb kroków + akcje taska */}
            <div className="flex items-start justify-between gap-3">
              <nav aria-label="Task steps" className="flex flex-wrap items-center gap-1.5">
                {currentTaskSteps.map((s, i) => {
                  const isActive = s.kind === currentStep.kind;
                  const isDone = completed.has(stepId(s.taskId, s.kind));
                  return (
                    <span key={s.kind} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-muted-foreground/40">·</span>}
                      <span
                        aria-current={isActive ? 'step' : undefined}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          isActive && 'bg-primary text-primary-foreground',
                          !isActive && isDone && 'text-foreground',
                          !isActive && !isDone && 'text-muted-foreground/60',
                        )}
                      >
                        {isDone && !isActive && <Check className="size-3" aria-hidden />}
                        {STEP_LABELS[s.kind]}
                      </span>
                    </span>
                  );
                })}
              </nav>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Edit task name"
                  onClick={() => setEditingTaskId(currentTask.id)}
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete task"
                  onClick={() => setConfirmDeleteId(currentTask.id)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </div>

            {/* Nazwa taska (lub edytor) */}
            {editingTaskId === currentTask.id ? (
              <TaskNameEditor initial={currentTask.text} onSave={saveEdit} onCancel={() => setEditingTaskId(null)} />
            ) : (
              <h2
                className="line-clamp-2 break-words text-2xl font-semibold tracking-tight"
                title={currentTask.text}
              >
                {currentTask.text}
              </h2>
            )}

            {/* Breadcrumb stresor › next-action */}
            {(currentStressor || currentNextAction) && (
              <p
                className="-mt-2 truncate text-xs text-muted-foreground"
                title={[currentStressor?.text, currentNextAction?.text].filter(Boolean).join(' › ')}
              >
                {currentStressor && <span>{currentStressor.text}</span>}
                {currentStressor && currentNextAction && <span> › </span>}
                {currentNextAction && <span>{currentNextAction.text}</span>}
              </p>
            )}

            <div className="border-t" />

            {/* Panel opcji bieżącego kroka */}
            <OptionStepPanel
              options={optionsFor(currentStep.kind)}
              pendingKey={pendingKey}
              gridClassName={gridFor(currentStep.kind)}
              hint="Pick with a key or click, confirm ↵ · skip Esc"
              onHover={setPendingKey}
              onConfirm={(opt) => {
                if (currentStep.kind === 'context') commit('context', CONTEXT_OPTIONS.find((o) => o.key === opt.key)!.value);
                else if (currentStep.kind === 'energy')
                  commit('energy', ENERGY_OPTIONS.find((o) => o.key === opt.key)!.value);
                else commit('estimatedTime', TIME_OPTIONS.find((o) => o.key === opt.key)!.value);
              }}
              onSkip={skip}
            />

            {/* Wstecz — o krok; z pierwszego kroka wraca do podsumowania (brak dead-endu) */}
            <div>
              <Button type="button" variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft />
                Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── DONE ────────────────────────────────────────────────────── */}
      {screen === 'done' && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            Processed {sessionTaskIds.length} {pluralTasks(sessionTaskIds.length)}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasks are tagged with attributes — ready for session filtering.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button type="button" onClick={() => navigate('/focus')}>
              Continue to focus
              <ArrowRight />
            </Button>
            <Button type="button" variant="ghost" onClick={() => setScreen('summary')}>
              Back to summary
            </Button>
          </div>
        </div>
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
        onDismiss={storageView.dismiss}
        entityLabel={storage.readError ? 'tasks' : 'data'}
      />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this task?"
        description="It'll be removed from the processing queue. This action can't be undone."
        confirmLabel="Delete task"
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}

/** English plural for "task": 1 task, otherwise tasks. */
function pluralTasks(n: number): string {
  return n === 1 ? 'task' : 'tasks';
}

function StatCard({ n, label }: { n: number; label: string }) {
  return (
    <div className={cn('rounded-lg border p-4', n === 0 && 'opacity-50')}>
      <div className="text-3xl font-semibold tabular-nums tracking-tight">{n}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
