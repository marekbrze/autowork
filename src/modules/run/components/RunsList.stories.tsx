import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { runsFull } from '@/scenarios/data/run';
import type { Run } from '../types/run';

import { RunsList } from './RunsList';

function seed(runs: Run[]) {
  localStorage.setItem('run:runs', JSON.stringify(runs));
  return runs;
}

const meta: Meta<typeof RunsList> = {
  title: 'Run/RunsList',
  component: RunsList,
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

type Story = StoryObj<typeof RunsList>;

export const WithActiveRuns: Story = {
  decorators: [
    (Story) => {
      seed(runsFull);
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

export const ReadError: Story = {
  decorators: [
    (Story) => {
      // Uszkodzony JSON → readError → stan błędu zamiast mylnego empty-state (LE-1).
      localStorage.setItem('run:runs', '{not valid json');
      return <Story />;
    },
  ],
};
