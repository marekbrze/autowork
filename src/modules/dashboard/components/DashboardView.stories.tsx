import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { runsFull, runsMinimal } from '@/scenarios/data/run';
import type { Run } from '@/modules/run/types/run';

import { DashboardView } from './DashboardView';

function seed(runs: Run[]) {
  localStorage.setItem('run:runs', JSON.stringify(runs));
  return runs;
}

/** Tylko zarchiwizowane Runy → stan „brak aktywnych" + wejście do archiwum. */
const archivedOnly: Run[] = [
  {
    id: 'run-arc-1',
    name: 'Wiosenne porządki',
    state: 'archived',
    lastReachedStep: 'celebration',
    stats: { timeSpentSec: 7200, doneCount: 15, dismissedCount: 2, totalTasks: 15 },
    reviewItems: [],
    createdAt: '2026-04-02T10:00:00.000Z',
    updatedAt: '2026-04-05T16:00:00.000Z',
    lastActiveAt: '2026-04-05T16:00:00.000Z',
  },
];

const meta: Meta<typeof DashboardView> = {
  title: 'Dashboard/DashboardView',
  component: DashboardView,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="py-4">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof DashboardView>;

export const WithData: Story = {
  decorators: [
    (Story) => {
      seed(runsFull);
      return <Story />;
    },
  ],
};

export const SingleRun: Story = {
  decorators: [
    (Story) => {
      seed(runsMinimal);
      return <Story />;
    },
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => {
      seed([]);
      return <Story />;
    },
  ],
};

export const AllArchived: Story = {
  decorators: [
    (Story) => {
      seed(archivedOnly);
      return <Story />;
    },
  ],
};

export const ReadError: Story = {
  decorators: [
    (Story) => {
      // Uszkodzony JSON → readError → stan błędu zamiast mylnego empty-state.
      localStorage.setItem('run:runs', '{not valid json');
      return <Story />;
    },
  ],
};
