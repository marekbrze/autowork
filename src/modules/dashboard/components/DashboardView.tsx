import { useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StorageStatusToast } from '@/modules/capture/components/StorageStatusToast';
import { RunCard } from '@/modules/run/components/RunCard';
import { RunReadError } from '@/modules/run/components/RunStates';
import { useRuns } from '@/modules/run/hooks/use-runs';
import { STEP_ROUTE } from '@/modules/run/types/run';

import { DominantRunCard } from './DominantRunCard';

/**
 * Dashboard — pas startowy apki (ADR 0026). W jednym kliku wrzuca usera z powrotem
 * do roboty: dominująca karta ostatnio-pracowanego Runa (progres na pierwszym planie,
 * Kontynuuj primary) + obok „nowy przejazd"; poniżej mniejsze aktywne runy; na końcu
 * listy wejście do archiwum/historii. Porównanie runów wyrzucone z MVP (ADR 0027).
 * Aktywne runy sortowane po `lastActiveAt` desc (ADR 0028).
 */
export function DashboardView() {
  const { runs, createRun, archiveRun, storage } = useRuns();
  const navigate = useNavigate();

  const active = useMemo(
    () =>
      runs
        .filter((r) => r.state === 'in_progress')
        // harden #6: wtórny klucz (createdAt desc) — deterministyczny wybór dominantu przy remisie.
        .sort(
          (a, b) =>
            b.lastActiveAt.localeCompare(a.lastActiveAt) || b.createdAt.localeCompare(a.createdAt),
        ),
    [runs],
  );
  const archivedCount = useMemo(() => runs.filter((r) => r.state === 'archived').length, [runs]);

  const dominant = active[0];
  const rest = active.slice(1);

  // Start new → tworzy Run i prowadzi do brain dumpa (krok 1 lejka). Dane lejka są
  // globalne w prototypie, więc capture nie tworzy duplikatu (ADR 0020).
  // harden #2: strażnik double-submit — createRun jest sync, ale dwa szybkie kliknięcia
  // mogłyby stworzyć osierocony run. Ref jest synchroniczny, blokuje drugie wołanie.
  const creatingRef = useRef(false);
  const handleStartNew = () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    const run = createRun();
    if (run) navigate('/capture');
    else creatingRef.current = false; // awaria zapisu — pozwól retry (toast zostaje widoczny)
  };

  const continueRun = (step: keyof typeof STEP_ROUTE) => navigate(STEP_ROUTE[step]);

  if (storage.readError) {
    return (
      <div className="mx-auto max-w-2xl">
        <RunReadError onReload={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Pick up where you left off — or start a new run.
        </p>
      </header>

      {dominant ? (
        <>
          <DominantRunCard
            run={dominant}
            onContinue={() => continueRun(dominant.lastReachedStep)}
            onStartNew={handleStartNew}
            onArchive={() => archiveRun(dominant.id)}
          />

          {rest.length > 0 && (
            <section className="space-y-3" aria-label="Other active runs">
              <h2 className="text-sm font-medium text-muted-foreground">Other active</h2>
              <ul className="space-y-3">
                {rest.map((run) => (
                  <li key={run.id}>
                    <RunCard
                      run={run}
                      actions={
                        <>
                          <Button size="sm" onClick={() => continueRun(run.lastReachedStep)}>
                            Continue
                          </Button>
                          <Link
                            to={`/run/${run.id}`}
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                          >
                            Details
                          </Link>
                        </>
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : archivedCount > 0 ? (
        // Brak aktywnych, ale jest archiwum — zaproś do nowego + wejście do historii poniżej.
        <section className="space-y-4 rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">You don't have an active run right now.</p>
          <Button size="lg" onClick={handleStartNew}>
            <Plus /> Start a new run
          </Button>
        </section>
      ) : (
        // Pierwsze otwarcie — zero runów. Wielki, zachęcający do pracy button (ADR 0026).
        <section className="space-y-5 rounded-xl border bg-card p-10 text-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">Where to start?</h2>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Brain-dump everything that's stressing you right now. The app will guide you forward —
              step by step, no deciding where to start.
            </p>
          </div>
          <Button size="lg" className="w-full sm:w-auto" onClick={handleStartNew}>
            <Plus /> Start your first run
          </Button>
        </section>
      )}

      {/* Wejście do archiwum — na końcu listy aktywnych runów (ADR 0026). */}
      {archivedCount > 0 && (
        <Link
          to="/run/archived"
          className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span>Archive · {archivedCount} finished runs</span>
          <ArrowRight className="size-4" />
        </Link>
      )}

      <StorageStatusToast
        writeError={storage.writeError}
        readError={storage.readError}
        onRetry={storage.retry}
        onDismiss={storage.dismiss}
        entityLabel="runs"
      />
    </div>
  );
}
