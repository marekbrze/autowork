import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { StorageStatusToast } from '@/modules/capture/components/StorageStatusToast';

import { useRuns } from '../hooks/use-runs';
import { isRunCompleted, STEP_LABEL, STEP_ROUTE } from '../types/run';
import { RunStatTiles } from './RunStatTiles';

/**
 * Szczegóły Runa („widoczny obiekt ze statystykami"): kafelki statystyk +
 * Kontynuuj (routing wg kroku) + rename (inline) + Review + archive/unarchive + delete.
 */
export function RunDetails() {
  const { runId } = useParams<{ runId: string }>();
  const { getRun, renameRun, archiveRun, unarchiveRun, deleteRun, storage } = useRuns();
  const navigate = useNavigate();

  const run = runId ? getRun(runId) : undefined;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(run?.name ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset draft przy zmianie Runa (ten sam komponent, różne :runId).
  useEffect(() => {
    setDraft(run?.name ?? '');
    setEditing(false);
  }, [run?.id, run?.name]);

  // Fokus w polu nazwy przy wejściu w tryb edycji (bez `autoFocus` — a11y).
  useEffect(() => {
    if (!editing) return;
    const id = window.setTimeout(() => nameInputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [editing]);

  if (!run) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-lg border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">Nie znaleziono takiego Runa.</p>
        <Link to="/run" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          ← Moje Runy
        </Link>
      </div>
    );
  }

  const completed = isRunCompleted(run);
  const archived = run.state === 'archived';
  const staleCount = run.reviewItems.filter((it) => it.stale).length;

  const saveRename = () => {
    if (renameRun(run.id, draft)) setEditing(false);
  };

  const handleDelete = () => {
    if (deleteRun(run.id)) navigate('/run');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/run" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          ← Moje Runy
        </Link>
      </div>

      {/* Nagłówek: nazwa (edytowalna) + badge stanu */}
      <header className="space-y-2">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveRename();
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <label htmlFor="run-name" className="sr-only">
              Nazwa Runa
            </label>
            <input
              id="run-name"
              ref={nameInputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-lg font-semibold focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" size="sm">
              Zapisz
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(run.name);
                setEditing(false);
              }}
            >
              Anuluj
            </Button>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{run.name}</h1>
            <StateBadge archived={archived} completed={completed} />
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Zmień nazwę
            </Button>
          </div>
        )}
      </header>

      {/* Statystyki */}
      <section aria-label="Statystyki Runa">
        <RunStatTiles run={run} />
      </section>

      {/* Kontynuuj / resume */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="text-sm">
          {archived ? (
            <span className="text-muted-foreground">
              Run zarchiwizowany — rozarchiwizuj, by go kontynuować.
            </span>
          ) : (
            <>
              <span className="text-muted-foreground">Wznowisz w: </span>
              <span className="font-medium">{STEP_LABEL[run.lastReachedStep]}</span>
            </>
          )}
        </div>
        <Button
          disabled={archived}
          onClick={() => navigate(STEP_ROUTE[run.lastReachedStep])}
        >
          Kontynuuj
        </Button>
      </section>

      {/* Akcje zarządzania */}
      <section className="grid gap-2 sm:grid-cols-2">
        <Link
          to={`/run/${run.id}/review`}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Review{staleCount > 0 ? ` · ${staleCount} do usunięcia` : ''}
        </Link>
        {archived ? (
          <Button variant="outline" onClick={() => unarchiveRun(run.id)}>
            Rozarchiwizuj
          </Button>
        ) : (
          <Button variant="outline" onClick={() => archiveRun(run.id)}>
            Archiwizuj
          </Button>
        )}
        <Button variant="destructive" className="sm:col-span-2" onClick={() => setConfirmDelete(true)}>
          Usuń Run
        </Button>
      </section>

      <p className="text-xs text-muted-foreground">
        Utworzono {new Date(run.createdAt).toLocaleDateString('pl-PL')} · Ostatnia aktywność{' '}
        {new Date(run.lastActiveAt).toLocaleDateString('pl-PL')}
      </p>

      <StorageStatusToast
        writeError={storage.writeError}
        readError={storage.readError}
        onRetry={storage.retry}
        onDismiss={storage.dismiss}
        entityLabel="runa"
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Usunąć ten Run?"
        description="Run zniknie na stałe — również z archiwum i statystyk. Tej operacji nie da się cofnąć."
        confirmLabel="Usuń na stałe"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function StateBadge({ archived, completed }: { archived: boolean; completed: boolean }) {
  if (archived)
    return (
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Zarchiwizowany
      </span>
    );
  if (completed)
    return (
      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        Ukończony
      </span>
    );
  return (
    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      Aktywny
    </span>
  );
}
