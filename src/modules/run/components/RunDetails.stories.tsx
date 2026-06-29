import type { Meta, StoryObj } from '@storybook/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { runsFull } from '@/scenarios/data/run';

import { RunDetails } from './RunDetails';

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
