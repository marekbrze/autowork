import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { ProcessView } from './ProcessView';
import type { Stressor } from '@/modules/capture/types/stressor';
import type { NextAction } from '@/modules/decompose/types/next-action';
import type { Task } from '@/modules/decompose/types/task';

const TS = '2026-06-28T00:00:00.000Z';

const stressors: Stressor[] = [
  { id: 's1', runId: 'story', text: 'car to fix', createdAt: TS, updatedAt: TS },
  { id: 's2', runId: 'story', text: 'wypowiedzenie umowy najmu', createdAt: TS, updatedAt: TS },
];

const nextActions: NextAction[] = [
  { id: 'na1', runId: 'story', stressorId: 's1', text: 'Book the shop', createdAt: TS, updatedAt: TS },
  { id: 'na2', runId: 'story', stressorId: 's2', text: 'Wypowiedz najem', createdAt: TS, updatedAt: TS },
];

function bareTask(id: string, nextActionId: string, stressorId: string, text: string): Task {
  return { id, runId: 'story', text, nextActionId, stressorId, state: 'pending', timerElapsed: 0, createdAt: TS, updatedAt: TS };
}

function seed(tasks: Task[]) {
  localStorage.setItem('capture:stressors', JSON.stringify(stressors));
  localStorage.setItem('decompose:nextActions', JSON.stringify(nextActions));
  localStorage.setItem('decompose:tasks', JSON.stringify(tasks));
}

const meta: Meta<typeof ProcessView> = {
  title: 'Process/ProcessView',
  component: ProcessView,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="mx-auto max-w-5xl py-4">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ProcessView>;

/**
 * A summary with tasks to process (2 stressors, "bare" tasks).
 * Klik „Rozpocznij" (lub ↵) → ekran processing ze groupingiem po stresorze.
 */
export const WithData: Story = {
  decorators: [
    (Story) => {
      seed([
        bareTask('t1', 'na1', 's1', 'Find the shop\'s phone number'),
        bareTask('t2', 'na1', 's1', 'Call and book a visit this week'),
        bareTask('t3', 'na2', 's2', 'Napisz wypowiedzenie najmu'),
        bareTask('t4', 'na2', 's2', 'Send a registered letter'),
      ]);
      return <Story />;
    },
  ],
};

/** No tasks — the "All done" empty state. */
export const EmptyState: Story = {
  decorators: [
    (Story) => {
      seed([]);
      return <Story />;
    },
  ],
};

/** All tasks described — also "All done" (nothing to process). */
export const AllProcessed: Story = {
  decorators: [
    (Story) => {
      seed([
        { ...bareTask('t1', 'na1', 's1', 'Find the shop\'s number'), context: 'Phone', energy: 2, estimatedTime: 15 },
        { ...bareTask('t2', 'na2', 's2', 'Send a registered letter'), context: 'Errands', energy: 1, estimatedTime: 30 },
      ]);
      return <Story />;
    },
  ],
};

/**
 * A very long task name (+ a long stressor / next-action). Clicking "Start" →
 * in main the name is clamp-2 with a tooltip, the stressor header and breadcrumb shortened
 * (truncate) — grid opcji zostaje na miejscu.
 */
export const LongName: Story = {
  decorators: [
    (Story) => {
      seed([
        bareTask(
          't1',
          'na1',
          's1',
          'Find the shop\'s phone number, call and book a visit this week in the morning before the 1pm meeting',
        ),
      ]);
      localStorage.setItem(
        'capture:stressors',
        JSON.stringify([{ ...stressors[0], text: 'A very long stressor name that does not fit in one sidebar line' }]),
      );
      localStorage.setItem(
        'decompose:nextActions',
        JSON.stringify([{ ...nextActions[0], text: 'A long next-action description split into tasks, does not fit in the breadcrumb' }]),
      );
      return <Story />;
    },
  ],
};

/**
 * A corrupted LocalStorage read (bad `decompose:tasks` JSON) → start from an empty
 * list + a "Failed to load tasks" toast with a recovery path. Shows
 * the persistence-status aggregation (here: a task read-error).
 */
export const StorageReadError: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('capture:stressors', JSON.stringify(stressors));
      localStorage.setItem('decompose:nextActions', JSON.stringify(nextActions));
      localStorage.setItem('decompose:tasks', '{ to nie jest poprawny json');
      return <Story />;
    },
  ],
};
