import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BatteryIcon } from '@/modules/process/components/BatteryIcon';
import type { Task } from '@/modules/decompose/types/task';

import { CONTEXT_LABELS, ENERGY_LABELS } from '../types/focus';

interface SessionTaskListProps {
  /** Dopasowane taski w bieżącym porządku (`TaskOrder`, potem rank stresora). */
  tasks: Task[];
  /** Nowa pełna kolejność ID (po ↑↓ lub drag). Rodzic persystuje `TaskOrder`. */
  onReorder: (ids: string[]) => void;
}

/**
 * Lista dopasowanych zadań na ekranie filtra (ADR 0035/0036). User przekłada kolejność
 * ręcznie — **drag-and-drop** (mysz; źródło = uchwyt GripVertical) oraz **↑↓** (klawiatura
 * / precyzja). Oba produkują nową kolejność ID → `onReorder` → rodzic zapisuje `TaskOrder`
 * (jeden współdzielony model kolejności, ADR 0036).
 *
 * Lo-fi: drag = HTML5 DnD; ↑↓ pokrywają dostępność z klawiatury. Drag UX / plakietki /
 * rytm — do dopracowania w `proto-design`/`proto-polish`.
 */
export function SessionTaskList({ tasks, onReorder }: SessionTaskListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (tasks.length === 0) return null;

  const finish = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const move = (from: number, dir: -1 | 1) => {
    const to = from + dir;
    if (to < 0 || to >= tasks.length) return;
    const ids = tasks.map((t) => t.id);
    [ids[from], ids[to]] = [ids[to], ids[from]];
    onReorder(ids);
  };

  const handleDrop = (target: number) => {
    if (dragIndex === null || dragIndex === target) {
      finish();
      return;
    }
    const ids = tasks.map((t) => t.id);
    const [moved] = ids.splice(dragIndex, 1);
    ids.splice(target, 0, moved);
    onReorder(ids);
    finish();
  };

  return (
    <ol className="space-y-1.5" aria-label="Matched tasks — drag or use arrows to reorder">
      {tasks.map((t, i) => (
        // DnD drop zone na <li> (mysz); dostępność z klawiatury pokrywają przyciski ↑↓ niżej.
        // role="option" odpada — opcje listboxa nie mogą zawierać przycisków. Do dopracowania w polish.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <li
          key={t.id}
          onDragEnter={() => setOverIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(i);
          }}
          className={cn(
            'flex items-center gap-2 rounded-lg border bg-card p-2.5 text-sm transition-colors hover:bg-muted/40',
            dragIndex === i && 'opacity-40',
            overIndex === i && dragIndex !== null && dragIndex !== i && 'border-primary ring-2 ring-primary/30',
          )}
        >
          <span
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragEnd={finish}
            className="shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
            aria-hidden
            title="Drag to reorder"
          >
            <GripVertical className="size-4" />
          </span>
          <span className="flex-1 truncate">{t.text}</span>
          <TaskBadges task={t} />
          <span className="flex shrink-0 items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Move "${t.text}" up`}
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Move "${t.text}" down`}
              disabled={i === tasks.length - 1}
              onClick={() => move(i, 1)}
            >
              <ArrowDown className="size-4" />
            </Button>
          </span>
        </li>
      ))}
    </ol>
  );
}

function TaskBadges({ task }: { task: Task }) {
  return (
    <span className="hidden shrink-0 items-center gap-1 sm:inline-flex">
      {task.context && <Badge>{CONTEXT_LABELS[task.context]}</Badge>}
      {task.energy && (
        <Badge>
          <BatteryIcon level={task.energy} className="size-3" /> {ENERGY_LABELS[task.energy]}
        </Badge>
      )}
      {task.estimatedTime && <Badge>{task.estimatedTime} min</Badge>}
    </span>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
      {children}
    </span>
  );
}
