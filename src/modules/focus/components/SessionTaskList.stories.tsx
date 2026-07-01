import type { Meta, StoryObj } from '@storybook/react';

import type { Task } from '@/modules/decompose/types/task';

import { SessionTaskList } from './SessionTaskList';

const base = (over: Partial<Task>): Task => ({
  id: 't',
  text: 'Task',
  nextActionId: 'n',
  stressorId: 's',
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
  base({ id: '1', text: 'Call the bank about the mortgage rate', context: 'Phone', energy: 1, estimatedTime: 15 }),
  base({ id: '2', text: 'Draft landing page hero copy', context: 'Creative', energy: 3, estimatedTime: 45 }),
  base({ id: '3', text: 'Reply to the landlord about the leak', context: 'Message', energy: 1, estimatedTime: 5 }),
  base({ id: '4', text: 'Weekly grocery shop', context: 'Errands', energy: 2, estimatedTime: 30 }),
];

const meta: Meta<typeof SessionTaskList> = {
  title: 'Focus/SessionTaskList',
  component: SessionTaskList,
  args: { onReorder: () => {} },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-xl py-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SessionTaskList>;

export const WithTasks: Story = { args: { tasks } };

export const Single: Story = { args: { tasks: tasks.slice(0, 1) } };

export const Untagged: Story = {
  args: {
    tasks: [
      base({ id: '1', text: 'Decide on the Q3 budget split', context: undefined, energy: undefined, estimatedTime: undefined }),
      base({ id: '2', text: 'Skim the contractor proposal', context: 'Creative', energy: 2, estimatedTime: 15 }),
    ],
  },
};
