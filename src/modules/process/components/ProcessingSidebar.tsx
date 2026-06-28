import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Stressor } from '@/modules/capture/types/stressor';

export interface SidebarTag {
  /** Etykieta atrybutu: Kontekst / Energia / Czas. */
  label: string;
  /** Nadany (przed sesją) LUB krok ukończony w sesji. */
  done: boolean;
}

export interface SidebarTask {
  id: string;
  name: string;
  tags: SidebarTag[];
  /** Wszystkie kroki taska ukończone. */
  done: boolean;
}

export interface SidebarGroup {
  stressor: Stressor | null;
  tasks: SidebarTask[];
}

interface ProcessingSidebarProps {
  groups: SidebarGroup[];
  totalTasks: number;
  doneCount: number;
  currentTaskId: string | null;
  /** Numer porządkowy taska w sesji (1-based). */
  numbering: (id: string) => number;
  onJump: (taskId: string) => void;
}

/**
 * Sidebar sesji procesowania (wzorzec `dopadone`): progres + lista tasków
 * pogrupowana po stresorze (kolejność rankingu), z tagami atrybutów i ✓.
 * Klik wiersza = skok do pierwszego kroku taska.
 */
export function ProcessingSidebar({
  groups,
  totalTasks,
  doneCount,
  currentTaskId,
  numbering,
  onJump,
}: ProcessingSidebarProps) {
  const pct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  const currentRef = useRef<HTMLButtonElement>(null);

  // Utrzymuj bieżący task w widoku w długich sesjach (scroll poza ekran w sidebarze).
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest' });
  }, [currentTaskId]);

  return (
    <aside className="rounded-lg border bg-card p-3" aria-label="Zadania w sesji">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Zadania w sesji
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          <strong className="text-foreground">{doneCount}</strong> / {totalTasks}
        </span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {groups.map((group, gi) => (
          <div key={group.stressor?.id ?? `__g${gi}`} className="space-y-1">
            <div className="truncate px-1 text-xs font-medium text-muted-foreground" title={group.stressor?.text}>
              {group.stressor ? group.stressor.text : 'Bez stresora'}
            </div>
            <ul className="space-y-1">
              {group.tasks.map((task) => {
                const isCurrent = task.id === currentTaskId;
                return (
                  <li key={task.id}>
                    <button
                      ref={isCurrent ? currentRef : undefined}
                      type="button"
                      aria-current={isCurrent ? 'true' : undefined}
                      onClick={() => onJump(task.id)}
                      className={cn(
                        'flex w-full items-start gap-2 rounded-md border border-transparent px-2 py-1.5 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                        isCurrent ? 'border-border bg-muted' : 'hover:bg-muted/50',
                      )}
                    >
                      <span className="mt-0.5 w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                        {String(numbering(task.id)).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            'truncate text-sm',
                            task.done ? 'text-muted-foreground line-through' : 'text-foreground',
                          )}
                          title={task.name}
                        >
                          {task.name}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {task.tags.map((tag) => (
                            <span
                              key={tag.label}
                              className={cn(
                                'inline-flex items-center gap-0.5 rounded border px-1 py-px text-[0.65rem] font-medium',
                                tag.done
                                  ? 'border-border bg-muted text-foreground'
                                  : 'border-dashed border-muted-foreground/30 text-muted-foreground/70',
                              )}
                            >
                              {tag.done && <Check className="size-2.5" aria-hidden />}
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      {task.done && <Check className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
