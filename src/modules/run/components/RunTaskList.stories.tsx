import type { Meta, StoryObj } from '@storybook/react';

import type { Task } from '@/modules/decompose/types/task';
import type { Stressor } from '@/modules/capture/types/stressor';

import { RunTaskList } from './RunTaskList';

const stressors: Stressor[] = [
  { id: 's1', text: 'Mortgage renewal', createdAt: '2026-06-30T00:00:00.000Z', updatedAt: '2026-06-30T00:00:00.000Z' },
  { id: 's2', text: 'Launch deadline', createdAt: '2026-06-30T00:00:01.000Z', updatedAt: '2026-06-30T00:00:01.000Z' },
];

const base = (over: Partial<Task>): Task => ({
  id: 't',
  text: 'Task',
  nextActionId: 'n',
  stressorId: 's1',
  state: 'pending',
  context: 'Phone',
  energy: 2,
  estimatedTime: 15,
  timerElapsed: 0,
  createdAt: '2026-06-30T00:00:00.000Z',
  updatedAt: '2026-06-30T00:00:00.000Z',
  ...over,
});

const tasks: Task[] = [
  base({ id: '1', text: 'Call the bank about the mortgage rate', state: 'pending', context: 'Phone', energy: 1, estimatedTime: 15 }),
  base({ id: '2', text: 'Draft the launch announcement', state: 'pending', context: 'Creative', energy: 3, estimatedTime: 45 }),
  base({ id: '3', text: 'Reply to the landlord', state: 'skipped', context: 'Message', energy: 1, estimatedTime: 5 }),
  base({ id: '4', text: 'Pick a paint colour', state: 'completed', context: 'Home', energy: 1, estimatedTime: 15, timerElapsed: 612 }),
  base({ id: '5', text: 'Old vendor quote', state: 'dismissed' }),
  base({ id: '6', text: 'Decide on Q3 budget split', state: 'pending', context: undefined, energy: undefined, estimatedTime: undefined }),
];

const meta: Meta<typeof RunTaskList> = {
  title: 'Run/RunTaskList',
  component: RunTaskList,
  args: { taskOrder: [], stressors, onDone: () => {}, onNotRelevant: () => {} },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl py-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof RunTaskList>;

export const AllStates: Story = { args: { tasks } };

export const Empty: Story = { args: { tasks: [] } };

/** Ręczny porządek (TaskOrder) podnosi „Draft the launch announcement" na pierwsze miejsce. */
export const ManualOrder: Story = {
  args: { tasks, taskOrder: ['2', '1'] },
};

/** Zarchiwizowany Run — lista read-only, bez akcji Done / Not relevant (R2-3). */
export const ReadOnly: Story = { args: { tasks, readOnly: true } };
