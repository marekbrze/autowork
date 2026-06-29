import type { Meta, StoryObj } from '@storybook/react';

import { RunStatTiles } from './RunStatTiles';
import type { Run } from '../types/run';

const base = (over: Partial<Run>): Run => ({
  id: 'r',
  name: 'Run',
  state: 'in_progress',
  lastReachedStep: 'focus',
  stats: { timeSpentSec: 0, doneCount: 0, dismissedCount: 0, totalTasks: 0 },
  reviewItems: [],
  createdAt: '2026-06-28T00:00:00.000Z',
  updatedAt: '2026-06-28T00:00:00.000Z',
  lastActiveAt: '2026-06-28T00:00:00.000Z',
  ...over,
});

const meta: Meta<typeof RunStatTiles> = {
  title: 'Run/RunStatTiles',
  component: RunStatTiles,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl py-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof RunStatTiles>;

export const InProgress: Story = {
  args: {
    run: base({
      name: 'Finanse i rata kredytu',
      stats: { timeSpentSec: 2520, doneCount: 8, dismissedCount: 1, totalTasks: 12 },
    }),
  },
};

export const Completed: Story = {
  args: {
    run: base({
      name: 'Wiosenne porządki',
      stats: { timeSpentSec: 7200, doneCount: 15, dismissedCount: 2, totalTasks: 15 },
    }),
  },
};

export const Empty: Story = {
  args: { run: base({ name: 'Run · 28.06, 21:40' }) },
};
