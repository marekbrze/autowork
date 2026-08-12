import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatMinutes } from '@/shared/format';
import { BatteryIcon } from '@/modules/process/components/BatteryIcon';
import type { Context, Energy, Task } from '@/modules/decompose/types/task';

import { CONTEXT_LABELS, CONTEXT_ORDER, ENERGY_LABELS, ENERGY_ORDER, type FilterSelection } from '../types/focus';
import { SessionTaskList } from './SessionTaskList';

interface SessionFilterProps {
  selection: FilterSelection;
  onSelectionChange: (sel: FilterSelection) => void;
  /** How many attributed pending tasks match the current filter. */
  matchCount: number;
  /** Total estimate of matched tasks (min) — to gauge session length (ADR 0060). */
  matchedEstimateMin: number;
  /** All attributed pending tasks (for the "nothing to describe" message). */
  totalAttributed: number;
  /** Attributed tasks already resolved (done/skipped/dismissed) — to split the
   * empty-state (#4): "nothing described" vs "all done". */
  resolvedAttributed: number;
  /** Matched tasks in `TaskOrder` (the list to reorder). Optional: omitted = hidden. */
  matchedTasks?: Task[];
  /** New ID order after ↑↓/drag → parent persists `TaskOrder` (ADR 0036). */
  onReorder?: (ids: string[]) => void;
  /** Whether a manual order is active (shows "Reset to default"). */
  hasManualOrder?: boolean;
  onResetOrder?: () => void;
  onStart: () => void;
}

/**
 * Session selection screen (step 5). One screen: multi-select of contexts +
 * energies, a live matched counter, a big "Start" (disabled when nothing is
 * selected or 0 matches + info). Presentational — filter state held by the parent.
 */
export function SessionFilter({
  selection,
  onSelectionChange,
  matchCount,
  matchedEstimateMin,
  totalAttributed,
  resolvedAttributed,
  matchedTasks = [],
  onReorder,
  hasManualOrder = false,
  onResetOrder,
  onStart,
}: SessionFilterProps) {
  const isAllContexts = selection.contexts.length === CONTEXT_ORDER.length;
  const isAllEnergies = selection.energies.length === ENERGY_ORDER.length;

  const toggleAllContexts = () =>
    onSelectionChange({ contexts: isAllContexts ? [] : [...CONTEXT_ORDER], energies: selection.energies });

  const toggleAllEnergies = () =>
    onSelectionChange({ contexts: selection.contexts, energies: isAllEnergies ? [] : [...ENERGY_ORDER] });

  const toggleContext = (c: Context) => {
    // In "All" mode, clicking a specific option narrows to just that one.
    if (isAllContexts) {
      onSelectionChange({ contexts: [c], energies: selection.energies });
      return;
    }
    const has = selection.contexts.includes(c);
    onSelectionChange({
      contexts: has ? selection.contexts.filter((x) => x !== c) : [...selection.contexts, c],
      energies: selection.energies,
    });
  };

  const toggleEnergy = (e: Energy) => {
    if (isAllEnergies) {
      onSelectionChange({ contexts: selection.contexts, energies: [e] });
      return;
    }
    const has = selection.energies.includes(e);
    onSelectionChange({
      contexts: selection.contexts,
      energies: has ? selection.energies.filter((x) => x !== e) : [...selection.energies, e],
    });
  };

  const nothingSelected = selection.contexts.length === 0 || selection.energies.length === 0;
  const canStart = !nothingSelected && matchCount > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight">Focus session</h2>
        <p className="text-sm text-muted-foreground">
          Pick what to work on right now — context(s) and energy. The filter shows what you can actually do.
        </p>
      </div>

      {totalAttributed === 0 ? (
        resolvedAttributed > 0 ? (
          // #4: tasks are described but all resolved — this isn't missing data,
          // it's the end of the funnel. A misleading "no attributes" message was frustrating.
          <div className="rounded-lg border border-dashed p-10 text-center">
            <PartyPopper className="mx-auto size-6 text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm">
              <strong>All tasks done — well done.</strong>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing left to do in this filter. Add or tag more tasks in processing.
            </p>
            <Link to="/process" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4')}>
              Go to processing
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No tasks tagged with attributes yet. Assign context, energy, and time in{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">processing</code> first.
            </p>
          </div>
        )
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-foreground">Context</legend>
            <div className="flex flex-wrap items-center gap-2">
              <Chip selected={isAllContexts} onClick={toggleAllContexts}>
                All
              </Chip>
              <span aria-hidden className="h-4 w-px bg-border" />
              {CONTEXT_ORDER.map((c) => (
                <Chip key={c} selected={selection.contexts.includes(c)} onClick={() => toggleContext(c)}>
                  {CONTEXT_LABELS[c]}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-foreground">Energy</legend>
            <div className="flex flex-wrap items-center gap-2">
              <Chip selected={isAllEnergies} onClick={toggleAllEnergies}>
                All
              </Chip>
              <span aria-hidden className="h-4 w-px bg-border" />
              {ENERGY_ORDER.map((e) => (
                <Chip key={e} selected={selection.energies.includes(e)} onClick={() => toggleEnergy(e)}>
                  <BatteryIcon level={e} className="mr-1.5" />
                  {ENERGY_LABELS[e]}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            {nothingSelected ? (
              <span className="text-muted-foreground">Pick at least one context and one energy level.</span>
            ) : matchCount === 0 ? (
              <span className="text-muted-foreground">No tasks match the filter — change your selection.</span>
            ) : (
              <span>
                <span className="font-semibold tabular-nums">{matchCount}</span> {pluralTask(matchCount)} match the filter
                {matchedEstimateMin > 0 ? (
                  <>
                    {' '}· ~<span className="font-semibold tabular-nums">{formatMinutes(matchedEstimateMin)}</span>
                  </>
                ) : null}
                .
              </span>
            )}
          </div>

          {matchedTasks.length > 0 && onReorder && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Matched tasks</h3>
                {hasManualOrder && onResetOrder && (
                  <Button type="button" variant="ghost" size="sm" onClick={onResetOrder}>
                    Reset to default
                  </Button>
                )}
              </div>
              <SessionTaskList tasks={matchedTasks} onReorder={onReorder} />
              <p className="text-xs text-muted-foreground">
                Drag or use ↑↓ to set the order — it carries into the session and the run task list.
              </p>
            </div>
          )}

          <Button
            type="button"
            size="lg"
            disabled={!canStart}
            className="h-12 rounded-full px-8 text-base font-bold active:scale-[0.97] transition-transform"
            onClick={onStart}
          >
            Start
          </Button>
        </>
      )}
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

/** English plural for "task": 1 task, otherwise tasks. */
function pluralTask(n: number): string {
  return n === 1 ? 'task' : 'tasks';
}
