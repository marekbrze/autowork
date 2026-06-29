import type { Meta, StoryObj } from '@storybook/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { runsFull } from '@/scenarios/data/run';

import { ReviewRun } from './ReviewRun';

function routeFor(initial: string) {
  return [
    (Story: () => ReactElement) => (
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/run/:runId/review" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
    (Story: () => ReactElement) => {
      localStorage.setItem('run:runs', JSON.stringify(runsFull));
      return <Story />;
    },
  ];
}

const meta: Meta<typeof ReviewRun> = {
  title: 'Run/ReviewRun',
  component: ReviewRun,
};
export default meta;

type Story = StoryObj<typeof ReviewRun>;

/** run-finanse ma pozycje do przeglądu (jedna oflagowana jako stale). */
export const WithItems: Story = { decorators: routeFor('/run/run-finanse/review') };

/** run-przeprowadzka ma pusty przegląd. */
export const Empty: Story = { decorators: routeFor('/run/run-przeprowadzka/review') };
