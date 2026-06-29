import type { ComponentType, ReactNode } from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  Home as HomeIcon,
  Lightbulb,
  MapPin,
  MessageSquare,
  Pause,
  Phone,
  Play,
  ShoppingCart,
  X,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BatteryIcon } from '@/modules/process/components/BatteryIcon';
import type { DoneVision } from '@/shared/types';
import type { Stressor } from '@/modules/capture/types/stressor';
import type { NextAction } from '@/modules/decompose/types/next-action';
import type { Reason } from '@/modules/decompose/types/reason';
import type { Context, Task } from '@/modules/decompose/types/task';

import { FocusTimer } from './FocusTimer';
import { MotivationPanel } from './MotivationPanel';
import { CONTEXT_LABELS, ENERGY_LABELS } from '../types/focus';

const CONTEXT_ICON: Record<Context, ComponentType<LucideProps>> = {
  Phone,
  Message: MessageSquare,
  Creative: Lightbulb,
  Errands: ShoppingCart,
  Home: HomeIcon,
  City: MapPin,
};

interface FocusTaskScreenProps {
  task: Task;
  stressor?: Stressor;
  nextAction?: NextAction;
  reasons: Reason[];
  doneVision?: DoneVision;
  elapsedSeconds: number;
  running: boolean;
  position: { index: number; total: number };
  canGoBack: boolean;
  onDone: () => void;
  onSkip: () => void;
  onDismiss: () => void;
  onBack: () => void;
  onTogglePause: () => void;
  onExit: () => void;
}

/**
 * Ekran zadania w sesji focus (rdzeń). Layout **B — dwie kolumny**: lewa =
 * materiał motywacyjny (zawsze widoczny), prawa = timer (model B) + akcje
 * (Done primary, Skip/Dismiss secondary). Górny pasek: Back / Pause / Exit.
 * Prezentacyjny — stan sesji i timera trzymany przez `FocusView`.
 */
export function FocusTaskScreen({
  task,
  stressor,
  nextAction,
  reasons,
  doneVision,
  elapsedSeconds,
  running,
  position,
  canGoBack,
  onDone,
  onSkip,
  onDismiss,
  onBack,
  onTogglePause,
  onExit,
}: FocusTaskScreenProps) {
  const CtxIcon = task.context ? CONTEXT_ICON[task.context] : null;

  return (
    <div className="space-y-5">
      {/* górny pasek: Back / Pause / Exit */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" disabled={!canGoBack} onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={onTogglePause}>
            {running ? (
              <>
                <Pause /> Pause
              </>
            ) : (
              <>
                <Play /> Resume
              </>
            )}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onExit}>
            <X /> Exit
          </Button>
        </div>
      </div>

      {/* breadcrumb: stresor › next-action */}
      {(stressor || nextAction) && (
        <p
          className="-mb-1 truncate text-xs text-muted-foreground"
          title={[stressor?.text, nextAction?.text].filter(Boolean).join(' › ')}
        >
          {stressor && <span>{stressor.text}</span>}
          {stressor && nextAction && <span> › </span>}
          {nextAction && <span>{nextAction.text}</span>}
        </p>
      )}

      {/* tytuł zadania + badge atrybutów + pozycja */}
      <div className="space-y-2">
        <h2 className="break-words text-2xl font-semibold tracking-tight">{task.text}</h2>
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
          {task.context && CtxIcon && (
            <Badge>
              <CtxIcon className="size-3.5" aria-hidden />
              {CONTEXT_LABELS[task.context]}
            </Badge>
          )}
          {task.energy && (
            <Badge>
              <BatteryIcon level={task.energy} />
              {ENERGY_LABELS[task.energy]}
            </Badge>
          )}
          {task.estimatedTime && (
            <Badge>
              <Clock className="size-3.5" aria-hidden />
              {task.estimatedTime} min
            </Badge>
          )}
          <span className="text-xs tabular-nums">
            {position.index + 1} / {position.total}
          </span>
        </div>
      </div>

      <div className="border-t" />

      {/* dwie kolumny: motywacja | timer + akcje */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <MotivationPanel doneVision={doneVision} reasons={reasons} />
        </div>

        <div className="flex flex-col items-center gap-5 rounded-lg border p-6">
          <FocusTimer elapsedSeconds={elapsedSeconds} thresholdMinutes={task.estimatedTime} paused={!running} />
          <div className="grid w-full grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={onSkip}>
              Skip
            </Button>
            <Button type="button" variant="ghost" onClick={onDismiss}>
              Not relevant
            </Button>
          </div>
          <Button type="button" size="lg" className="w-full" onClick={onDone}>
            <Check /> Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}
