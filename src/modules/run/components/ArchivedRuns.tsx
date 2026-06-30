import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { StorageStatusToast } from '@/modules/capture/components/StorageStatusToast';

import { useLiveRuns } from '../hooks/use-live-runs';
import { RunCard } from './RunCard';
import { RunReadError } from './RunStates';

/** Ekran archiwum (historia) — zarchiwizowane Runy z rozarchiwizowaniem / usuwaniem. */
export function ArchivedRuns() {
  // Statystyki wyprowadzane na żywo z lejka (use-live-runs.ts); zarchiwizowane Runy
  // pokazują bieżący globalny progres (caveat prototypu — dane lejka nie są per-Run).
  const { runs, unarchiveRun, deleteRun, storage } = useLiveRuns();
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
        <Link to="/" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Archive</h1>
        <p className="text-sm text-muted-foreground">
          Finished runs — stats and comparison for motivation. You can unarchive them.
        </p>
      </header>

      {storage.readError ? (
        <RunReadError onReload={() => window.location.reload()} />
      ) : archived.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No archived runs.
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
                      Unarchive
                    </Button>
                    <Link
                      to={`/run/${run.id}`}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    >
                      Details
                    </Link>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmId(run.id)}>
                      Delete
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
        entityLabel="runs"
      />

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete this run?"
        description="The run will be permanently deleted — including from stats and history. This action can't be undone."
        confirmLabel="Delete permanently"
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
