import { useMemo, type ReactNode } from 'react';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BatteryIcon } from '@/modules/process/components/BatteryIcon';
import type { Task } from '@/modules/decompose/types/task';
import type { Stressor } from '@/modules/capture/types/stressor';
import { CONTEXT_LABELS, ENERGY_LABELS } from '@/modules/focus/types/focus';

interface RunTaskListProps {
  /** Wszystkie taski lejka (globalne — ADR 0020). */
  tasks: Task[];
  /** Współdzielony ręczny porządek z focus (`focus:taskOrder`); default = rank stresora (ADR 0036). */
  taskOrder: string[];
  stressors: Stressor[];
  /** Read-only (np. zarchiwizowany Run) — ukrywa akcje Done / Not relevant (R2-3). */
  readOnly?: boolean;
  onDone: (id: string) => void;
  onNotRelevant: (id: string) => void;
}

type Group = 'todo' | 'done' | 'notRelevant';

const GROUP_LABEL: Record<Group, string> = {
  todo: 'To do',
  done: 'Done',
  notRelevant: 'Not relevant',
};

function groupOf(state: Task['state']): Group {
  if (state === 'completed') return 'done';
  if (state === 'dismissed') return 'notRelevant';
  return 'todo';
}

/**
 * Sekcja „Tasks" na Szczegółach Runa (ADR 0035/0037). Lista wszystkich tasków z prawdziwym
 * stanem — pogrupowana (To do / Done / Not relevant), sortowana wewnątrz grupy po tym samym
 * `TaskOrder` co kolejka focus (ADR 0036). Akcje z listy: Done / Not relevant (moduł `run`
 * mutuje stany tasków cross-module przez `updateTask` z `decompose`). Lo-fi — rytm/plakietki
 * do dopracowania w `proto-design`/`proto-polish`.
 */
export function RunTaskList({ tasks, taskOrder, stressors, readOnly = false, onDone, onNotRelevant }: RunTaskListProps) {
  const stressorRank = useMemo(() => new Map(stressors.map((s, i) => [s.id, i])), [stressors]);

  const grouped = useMemo(() => {
    const orderIndex = (id: string) => {
      const i = taskOrder.indexOf(id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    const byOrder = (a: Task, b: Task) => {
      const oa = orderIndex(a.id);
      const ob = orderIndex(b.id);
      if (oa !== ob) return oa - ob;
      const ra = stressorRank.get(a.stressorId) ?? 99;
      const rb = stressorRank.get(b.stressorId) ?? 99;
      return ra !== rb ? ra - rb : a.createdAt.localeCompare(b.createdAt);
    };
    const lists: Record<Group, Task[]> = { todo: [], done: [], notRelevant: [] };
    [...tasks].sort(byOrder).forEach((t) => lists[groupOf(t.state)].push(t));
    return lists;
  }, [tasks, taskOrder, stressorRank]);

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No tasks yet — start with a brain dump.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(Object.keys(grouped) as Group[]).map((g) =>
        grouped[g].length === 0 ? null : (
          <section key={g} aria-label={GROUP_LABEL[g]} className="space-y-1.5">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {GROUP_LABEL[g]} · {grouped[g].length}
            </h4>
            <ul className="space-y-1.5">
              {grouped[g].map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2 text-sm"
                >
                  <span className="flex-1 truncate">{t.text}</span>
                  <TaskBadges task={t} />
                  {g === 'todo' && !readOnly ? (
                    <span className="flex shrink-0 items-center gap-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => onDone(t.id)}>
                        <Check className="size-3.5" /> Done
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onNotRelevant(t.id)}
                      >
                        Not relevant
                      </Button>
                    </span>
                  ) : (
                    <StateBadge state={t.state} />
                  )}
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}

function TaskBadges({ task }: { task: Task }) {
  const untagged = !task.context || !task.energy || !task.estimatedTime;
  return (
    <span className="flex shrink-0 items-center gap-1">
      {task.context && <Badge>{CONTEXT_LABELS[task.context]}</Badge>}
      {task.energy && (
        <Badge>
          <BatteryIcon level={task.energy} className="size-3" /> {ENERGY_LABELS[task.energy]}
        </Badge>
      )}
      {task.estimatedTime && <Badge>{task.estimatedTime} min</Badge>}
      {untagged && <Badge className="border-dashed text-muted-foreground/80">untagged</Badge>}
    </span>
  );
}

function StateBadge({ state }: { state: Task['state'] }) {
  if (state === 'skipped')
    return <Badge className={cn('bg-muted/60')}>Skipped</Badge>;
  if (state === 'active') return <Badge className={cn('bg-primary/10 text-primary')}>In progress</Badge>;
  return null;
}

function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}
