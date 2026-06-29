import type { Meta, StoryObj } from '@storybook/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { runsFull } from '@/scenarios/data/run';

import { RunDetails } from './RunDetails';
import type { Run } from '../types/run';

/** Ukończony Run (100%, aktywny) → stan celebracji + CTA archiwizuj (ST-1). */
const completedRun: Run = {
  id: 'run-done',
  name: 'Ukończony projekt',
  state: 'in_progress',
  lastReachedStep: 'celebration',
  stats: { timeSpentSec: 5400, doneCount: 10, dismissedCount: 1, totalTasks: 10 },
  reviewItems: [],
  createdAt: '2026-06-20T09:00:00.000Z',
  updatedAt: '2026-06-29T10:00:00.000Z',
  lastActiveAt: '2026-06-29T10:00:00.000Z',
};

function routeFor(initial: string) {
  return [
    (Story: () => ReactElement) => (
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/run/:runId" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
    (Story: () => ReactElement) => {
      localStorage.setItem('run:runs', JSON.stringify(runsFull));
      return <Story />;
    },
  ];
}

const meta: Meta<typeof RunDetails> = {
  title: 'Run/RunDetails',
  component: RunDetails,
};
export default meta;

type Story = StoryObj<typeof RunDetails>;

export const InProgress: Story = { decorators: routeFor('/run/run-finanse') };

export const Archived: Story = { decorators: routeFor('/run/run-archiwum-porzadki') };

export const NotFound: Story = { decorators: routeFor('/run/nope') };

export const Completed: Story = {
  decorators: [
    (Story: () => ReactElement) => (
      <MemoryRouter initialEntries={['/run/run-done']}>
        <Routes>
          <Route path="/run/:runId" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
    (Story: () => ReactElement) => {
      localStorage.setItem('run:runs', JSON.stringify([completedRun]));
      return <Story />;
    },
  ],
};
