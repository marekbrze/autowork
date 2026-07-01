import type { Meta, StoryObj } from '@storybook/react';

import { ActiveRunProvider } from '@/shared/active-run';
import type { Run } from '../types/run';

import { ActiveRunChip } from './ActiveRunChip';

const meta: Meta<typeof ActiveRunChip> = {
  title: 'Run/ActiveRunChip',
  component: ActiveRunChip,
  decorators: [
    (Story) => (
      <ActiveRunProvider>
        {/* ramka nagłówka — żeby chip czytać w kontekście shella */}
        <div className="flex h-14 items-center gap-2 border-b bg-background px-4">
          <span className="font-semibold tracking-tight">Autowork</span>
          <Story />
        </div>
      </ActiveRunProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ActiveRunChip>;

const TS = '2026-07-01T17:15:00.000Z';
function run(over: Partial<Run> = {}): Run {
  return {
    id: 'r1',
    name: 'Run · Jul 1, 5:15 PM',
    state: 'in_progress',
    lastReachedStep: 'focus',
    stats: { timeSpentSec: 0, doneCount: 0, dismissedCount: 0, totalTasks: 0 },
    reviewItems: [],
    createdAt: TS,
    updatedAt: TS,
    lastActiveAt: TS,
    ...over,
  };
}

function seed(runs: Run[], active: string | null) {
  localStorage.setItem('run:runs', JSON.stringify(runs));
  localStorage.setItem('run:active', JSON.stringify(active));
}

export const Active: Story = {
  render: () => {
    seed([run()], 'r1');
    return <ActiveRunChip className="ml-auto" />;
  },
};

export const LongName: Story = {
  render: () => {
    seed(
      [run({ name: 'Finances, the loan payment, overdue taxes and the lease renewal all at once' })],
      'r1',
    );
    return <ActiveRunChip className="ml-auto" />;
  },
};

export const NoActive: Story = {
  render: () => {
    seed([run()], null);
    return (
      <>
        <ActiveRunChip className="ml-auto" />
        <span className="ml-auto text-xs text-muted-foreground">
          (chip hidden — no active run; Dashboard is where you pick)
        </span>
      </>
    );
  },
};
