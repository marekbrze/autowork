import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FunnelStepper } from '@/shared/components/FunnelStepper';

import { useStressors } from '@/modules/capture/hooks/use-stressors';
import { StorageStatusToast } from '@/modules/capture/components/StorageStatusToast';
import { useReasons } from '../hooks/use-reasons';
import { useNextActions } from '../hooks/use-next-actions';
import { useTasks } from '../hooks/use-tasks';
import { useDoneVisions } from '../hooks/use-done-visions';

import { WhyBlock } from './WhyBlock';
import { HowBlock } from './HowBlock';

type SubStep = 'A' | 'B';

/**
 * Ekran pojedynczego stresora w `decompose` (krok 3 lejka). Po jednym
 * stresorze naraz (od najbardziej stresującego), w dwóch pod-krokach:
 * A — DLACZEGO (motywacja) ‖ B — JAK (next-actiony → taski). Prowadzenie
 * licznikiem + wstecz/dalej; „Dalej" gating ≥1 next-action.
 */
export function DecomposeView() {
  const navigate = useNavigate();
  const { stressors } = useStressors();
  const { reasons, addReason, deleteReason, storage: reasonStorage } = useReasons();
  const { nextActions, addNextAction, updateNextAction, deleteNextAction, storage: nextActionStorage } =
    useNextActions();
  const {
    tasks,
    deleteTasksByNextAction,
    replaceTasksForNextAction,
    materializeBareNextActions,
    storage: taskStorage,
  } = useTasks();
  const { getDoneVision, setDoneVision, storage: visionStorage } = useDoneVisions();

  // Cztery niezależne store'y decompose → jeden łączny status persystencji dla toastu
  // (błąd dowolnego z nich = komunikat z retry; retry/dismiss woła wszystkie — no-op bez pending).
  const storageWriteError =
    reasonStorage.writeError ||
    nextActionStorage.writeError ||
    taskStorage.writeError ||
    visionStorage.writeError;
  const storageReadError =
    reasonStorage.readError ||
    nextActionStorage.readError ||
    taskStorage.readError ||
    visionStorage.readError;
  const retryStorage = () => {
    reasonStorage.retry();
    nextActionStorage.retry();
    taskStorage.retry();
    visionStorage.retry();
  };
  const dismissStorage = () => {
    reasonStorage.dismiss();
    nextActionStorage.dismiss();
    taskStorage.dismiss();
    visionStorage.dismiss();
  };

  const [index, setIndex] = useState(0);
  const [subStep, setSubStep] = useState<SubStep>('A');

  if (stressors.length === 0) {
    return (
      <div className="space-y-6">
        <FunnelStepper current="decompose" />
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Brak stresorów do rozbicia. `decompose` bierze uporządkowane stresory z `capture`.
          </p>
          <Button type="button" className="mt-4" onClick={() => navigate('/capture')}>
            Idź do brain dump
          </Button>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(index, stressors.length - 1);
  const stressor = stressors[safeIndex];
  const isLast = safeIndex === stressors.length - 1;

  const reasonsForStressor = reasons.filter((r) => r.stressorId === stressor.id);
  const nextActionsForStressor = nextActions.filter((n) => n.stressorId === stressor.id);
  const tasksForStressor = tasks.filter((t) => t.stressorId === stressor.id);

  const canProceed = nextActionsForStressor.length >= 1;

  const handleDeleteNextAction = (id: string) => {
    deleteNextAction(id);
    deleteTasksByNextAction(id);
  };

  // Zmiana stresora zawsze zaczyna od pod-kroku A (DLACZEGO) — inaczej `subStep`
  // przeciekałby do następnego stresora i pomijał blok WHY.
  const goToStressor = (nextIndex: number) => {
    setIndex(nextIndex);
    setSubStep('A');
  };

  const proceed = () => {
    if (!canProceed) return;
    // safety-net: każdy „goły" next-action → 1 konkretny task (ADR 0006)
    materializeBareNextActions(nextActionsForStressor);
    if (isLast) {
      navigate('/process');
    } else {
      goToStressor(safeIndex + 1);
    }
  };

  return (
    <div className="space-y-6">
      <FunnelStepper current="decompose" />

      {/* Stressor + licznik + wstecz */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Stresor {safeIndex + 1} z {stressors.length}
          </p>
          <h2 className="max-w-prose text-2xl font-semibold tracking-tight">{stressor.text}</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={safeIndex === 0}
          onClick={() => goToStressor(safeIndex - 1)}
        >
          <ArrowLeft />
          Wstecz
        </Button>
      </div>

      {/* Przełącznik pod-kroków A / B */}
      <div role="group" aria-label="Krok dekompozycji" className="inline-flex rounded-lg border p-0.5">
        {(['A', 'B'] as const).map((step) => {
          const active = subStep === step;
          const label = step === 'A' ? 'A · DLACZEGO' : 'B · JAK';
          return (
            <button
              key={step}
              type="button"
              aria-pressed={active}
              onClick={() => setSubStep(step)}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Blok aktywnego pod-kroku (key resetuje lokalny stan draftów per stresor) */}
      {subStep === 'A' ? (
        <WhyBlock
          key={stressor.id}
          stressorId={stressor.id}
          reasons={reasonsForStressor}
          onAddReason={addReason}
          onDeleteReason={deleteReason}
          doneVision={getDoneVision(stressor.id)}
          onSetDoneVision={setDoneVision}
        />
      ) : (
        <HowBlock
          key={stressor.id}
          stressorId={stressor.id}
          nextActions={nextActionsForStressor}
          tasks={tasksForStressor}
          onAddNextAction={addNextAction}
          onUpdateNextAction={updateNextAction}
          onDeleteNextAction={handleDeleteNextAction}
          onReplaceTasks={replaceTasksForNextAction}
        />
      )}

      {/* Footer zależny od pod-kroku */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {subStep === 'A' ? (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSubStep('B')}>
              Pomiń blok
            </Button>
            <Button type="button" size="lg" onClick={() => setSubStep('B')}>
              Do HOW
              <ArrowRight />
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSubStep('A')}>
              <ArrowLeft />
              DLACZEGO
            </Button>
            <div className="flex items-center gap-3">
              {!canProceed && (
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  Dodaj ≥1 next-action, żeby iść dalej
                </span>
              )}
              <Button type="button" size="lg" disabled={!canProceed} onClick={proceed}>
                {isLast ? 'Do procesowania' : 'Dalej'}
                <ArrowRight />
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-start pt-2">
        <Link to="/" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          ← Dashboard
        </Link>
      </div>

      <StorageStatusToast
        writeError={storageWriteError}
        readError={storageReadError}
        onRetry={retryStorage}
        onDismiss={dismissStorage}
        entityLabel="danych"
      />
    </div>
  );
}
