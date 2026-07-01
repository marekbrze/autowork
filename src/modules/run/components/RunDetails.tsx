import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { StorageStatusToast } from '@/modules/capture/components/StorageStatusToast';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import { useStressors } from '@/modules/capture/hooks/use-stressors';
import { DismissUndoToast } from '@/modules/focus/components/FocusStates';

import { useLiveRuns } from '../hooks/use-live-runs';
import { isRunCompleted, STEP_LABEL, STEP_ROUTE } from '../types/run';
import { RunStatTiles } from './RunStatTiles';
import { RunTaskList } from './RunTaskList';
import { RunCompleted } from './RunStates';

/**
 * Szczegóły Runa („widoczny obiekt ze statystykami"): kafelki statystyk +
 * Kontynuuj (routing wg kroku) + rename (inline) + Review + archive/unarchive + delete.
 */
export function RunDetails() {
  const { runId } = useParams<{ runId: string }>();
  // Statystyki / krok resume / mutatory tasków — wszystko z jednej instancji `useTasks`
  // wewnątrz `useLiveRuns`, żeby kafelki i Continue przeliczały się na żywo po akcjach z listy
  // (ADR 0035, R2-1: dwie osobne instancje nie synchronizują się w tej samej karcie).
  // Współdzielony `TaskOrder` z focus sortuje listę (ADR 0036).
  const {
    getRun,
    renameRun,
    archiveRun,
    unarchiveRun,
    deleteRun,
    storage,
    tasks,
    updateTask,
    taskStorage,
  } = useLiveRuns();
  const { stressors } = useStressors();
  const [taskOrder] = useLocalStorage<string[]>('focus:taskOrder', []);
  // R2-2: undo dla Dismiss z listy (ADR 0017). Done = implicit feedback (migracja do grupy Done).
  const [dismissUndo, setDismissUndo] = useState<{ id: string; text: string } | null>(null);
  const markDone = (id: string) => updateTask(id, { state: 'completed' });
  const markNotRelevant = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!updateTask(id, { state: 'dismissed' })) return; // honest persistence — przy awarii nie pokazuj undo
    setDismissUndo({ id, text: t?.text ?? '' });
  };
  const undoDismiss = () => {
    if (!dismissUndo) return;
    updateTask(dismissUndo.id, { state: 'pending' });
    setDismissUndo(null);
  };
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
        <p className="text-sm text-muted-foreground">Run not found.</p>
        <Link to="/" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          ← Dashboard
        </Link>
      </div>
    );
  }

  const completed = isRunCompleted(run);
  const archived = run.state === 'archived';
  const staleCount = run.reviewItems.filter((it) => it.stale).length;
  // FI-1: walidacja rename — nazwa nie może być pusta (same spacje = nieważna).
  const nameValid = draft.trim().length > 0;

  const saveRename = () => {
    if (renameRun(run.id, draft)) setEditing(false);
  };

  const handleDelete = () => {
    if (deleteRun(run.id)) navigate('/');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          ← Dashboard
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
            className="space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="run-name" className="sr-only">
                Run name
              </label>
              <input
                id="run-name"
                ref={nameInputRef}
                value={draft}
                maxLength={60}
                aria-invalid={!nameValid}
                aria-describedby={!nameValid ? 'run-name-help' : undefined}
                onChange={(e) => setDraft(e.target.value)}
                className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-lg font-semibold focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button type="submit" size="sm" disabled={!nameValid}>
                Save
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
                Cancel
              </Button>
            </div>
            {!nameValid && (
              <p id="run-name-help" className="text-xs text-destructive">
                Name can't be empty.
              </p>
            )}
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{run.name}</h1>
            <StateBadge archived={archived} completed={completed} />
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Rename
            </Button>
          </div>
        )}
      </header>

      {/* Statystyki */}
      <section aria-label="Run stats">
        <RunStatTiles run={run} />
      </section>

      {/* Tasks — lista zadań z prawdziwym stanem + akcje z listy (ADR 0035/0037). */}
      {/* R2-3: zarchiwizowany Run = lista read-only (mutacje w „ukończonym" Runie niepożądane). */}
      <section aria-label="Run tasks" className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Tasks</h3>
          {archived && (
            <span className="text-xs text-muted-foreground">Read-only — unarchive to edit</span>
          )}
        </div>
        <RunTaskList
          tasks={tasks}
          taskOrder={taskOrder}
          stressors={stressors}
          readOnly={archived}
          onDone={markDone}
          onNotRelevant={markNotRelevant}
        />
      </section>

      {/* Kontynuuj / resume — lub stan ukończony (ST-1), lub zarchiwizowany */}
      {completed && !archived ? (
        <RunCompleted onArchive={() => archiveRun(run.id)} />
      ) : (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
          <div className="text-sm">
            {archived ? (
              <span className="text-muted-foreground">
                This run is archived — unarchive it to continue.
              </span>
            ) : (
              <>
                <span className="text-muted-foreground">Resumes at: </span>
                <span className="font-medium">{STEP_LABEL[run.lastReachedStep]}</span>
              </>
            )}
          </div>
          <Button
            disabled={archived}
            onClick={() => navigate(STEP_ROUTE[run.lastReachedStep])}
          >
            Continue
          </Button>
        </section>
      )}

      {/* Akcje zarządzania */}
      <section className="grid gap-2 sm:grid-cols-2">
        <Link
          to={`/run/${run.id}/review`}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Review{staleCount > 0 ? ` · ${staleCount} to remove` : ''}
        </Link>
        {archived ? (
          <Button variant="outline" onClick={() => unarchiveRun(run.id)}>
            Unarchive
          </Button>
        ) : (
          <Button variant="outline" onClick={() => archiveRun(run.id)}>
            Archive
          </Button>
        )}
        <Button variant="destructive" className="sm:col-span-2" onClick={() => setConfirmDelete(true)}>
          Delete run
        </Button>
      </section>

      <p className="text-xs text-muted-foreground">
        Created {new Date(run.createdAt).toLocaleDateString('en-US')} · Last active{' '}
        {new Date(run.lastActiveAt).toLocaleDateString('en-US')}
      </p>

      <StorageStatusToast
        writeError={storage.writeError || taskStorage.writeError}
        readError={storage.readError || taskStorage.readError}
        onRetry={() => {
          storage.retry();
          taskStorage.retry();
        }}
        onDismiss={() => {
          storage.dismiss();
          taskStorage.dismiss();
        }}
        entityLabel={taskStorage.readError || taskStorage.writeError ? 'tasks' : 'runs'}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this run?"
        description="The run will be permanently deleted — including from the archive and stats. This action can't be undone."
        confirmLabel="Delete permanently"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* R2-2: undo Dismiss z listy (ADR 0017; ten sam komponent co w focus). */}
      {dismissUndo && <DismissUndoToast text={dismissUndo.text} onUndo={undoDismiss} />}
    </div>
  );
}

function StateBadge({ archived, completed }: { archived: boolean; completed: boolean }) {
  if (archived)
    return (
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Archived
      </span>
    );
  if (completed)
    return (
      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        Completed
      </span>
    );
  return (
    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      Active
    </span>
  );
}
