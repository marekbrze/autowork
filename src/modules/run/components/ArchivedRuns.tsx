import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { StorageStatusToast } from '@/modules/capture/components/StorageStatusToast';

import { useRuns } from '../hooks/use-runs';
import { RunCard } from './RunCard';
import { RunReadError } from './RunStates';

/** Ekran archiwum (historia) — zarchiwizowane Runy z rozarchiwizowaniem / usuwaniem. */
export function ArchivedRuns() {
  const { runs, unarchiveRun, deleteRun, storage } = useRuns();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const archived = useMemo(
    () =>
      runs
        .filter((r) => r.state === 'archived')
        .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt)),
    [runs],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <Link to="/run" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          ← Moje Runy
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Archiwum</h1>
        <p className="text-sm text-muted-foreground">
          Zakończone przejazdy — statystyki i porównanie do motywacji. Możesz je rozarchiwizować.
        </p>
      </header>

      {storage.readError ? (
        <RunReadError onReload={() => window.location.reload()} />
      ) : archived.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Brak zarchiwizowanych runów.
        </div>
      ) : (
        <ul className="space-y-3">
          {archived.map((run) => (
            <li key={run.id}>
              <RunCard
                run={run}
                actions={
                  <>
                    <Button size="sm" variant="outline" onClick={() => unarchiveRun(run.id)}>
                      Rozarchiwizuj
                    </Button>
                    <Link
                      to={`/run/${run.id}`}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    >
                      Szczegóły
                    </Link>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmId(run.id)}>
                      Usuń
                    </Button>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <StorageStatusToast
        writeError={storage.writeError}
        readError={storage.readError}
        onRetry={storage.retry}
        onDismiss={storage.dismiss}
        entityLabel="runów"
      />

      <ConfirmDialog
        open={confirmId !== null}
        title="Usunąć ten Run?"
        description="Run zniknie na stałe — również ze statystyk i historii. Tej operacji nie da się cofnąć."
        confirmLabel="Usuń na stałe"
        onConfirm={() => {
          // AO-3: honest persistence — zamykaj dialog tylko po udanym usunięciu.
          // Przy awarii zapisu Run zostaje, toast retry zostaje widoczny.
          if (confirmId && deleteRun(confirmId)) setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
