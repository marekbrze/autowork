import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StorageStatusToast } from '@/modules/capture/components/StorageStatusToast';

import { useRuns } from '../hooks/use-runs';
import { STEP_ROUTE } from '../types/run';
import { RunCard } from './RunCard';
import { RunReadError } from './RunStates';

/**
 * Lista aktywnych Runów (entry `/run`). Każda karta = Kontynuuj + Szczegóły
 * (wzorzec z `run.md`: dashboard card). CTA „Nowy Run" tworzy Run i prowadzi
 * do jego Szczegółów (stamtąd Kontynuuj → brain dump).
 */
export function RunsList() {
  const { runs, createRun, storage } = useRuns();
  const navigate = useNavigate();

  const active = useMemo(
    () =>
      runs
        .filter((r) => r.state === 'in_progress')
        .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt)),
    [runs],
  );
  const archivedCount = useMemo(() => runs.filter((r) => r.state === 'archived').length, [runs]);

  const handleNew = () => {
    const run = createRun();
    if (run) navigate(`/run/${run.id}`);
  };

  // Kontynuuj → nawigacja do kroku lejka wg `lastReachedStep` (ADR 0022).
  // Dane lejka są globalne w prototypie, więc to symulacja kierunku resume.
  const continueRun = (step: keyof typeof STEP_ROUTE) => {
    navigate(STEP_ROUTE[step]);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Moje Runy</h1>
          <p className="text-sm text-muted-foreground">
            Każdy Run to jeden przejazd lejka. Wznawiaj tam, gdzie skończyłeś.
          </p>
        </div>
        <Button onClick={handleNew}>Nowy Run</Button>
      </header>

      {storage.readError ? (
        <RunReadError onReload={() => window.location.reload()} />
      ) : active.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nie masz jeszcze żadnego aktywnego Runa.
          </p>
          <div className="mt-4">
            <Button onClick={handleNew}>Zacznij nowy Run</Button>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {active.map((run) => (
            <li key={run.id}>
              <RunCard
                run={run}
                actions={
                  <>
                    <Button size="sm" onClick={() => continueRun(run.lastReachedStep)}>
                      Kontynuuj
                    </Button>
                    <Link
                      to={`/run/${run.id}`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      Szczegóły
                    </Link>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between pt-2">
        <Link to="/" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          ← Dashboard
        </Link>
        <Link to="/run/archived" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          Archiwum ({archivedCount})
        </Link>
      </div>

      <StorageStatusToast
        writeError={storage.writeError}
        readError={storage.readError}
        onRetry={storage.retry}
        onDismiss={storage.dismiss}
        entityLabel="runów"
      />
    </div>
  );
}
