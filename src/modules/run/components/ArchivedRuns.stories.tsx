import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { runsFull } from '@/scenarios/data/run';

import { ArchivedRuns } from './ArchivedRuns';

const meta: Meta<typeof ArchivedRuns> = {
  title: 'Run/ArchivedRuns',
  component: ArchivedRuns,
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

type Story = StoryObj<typeof ArchivedRuns>;

export const WithArchived: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('run:runs', JSON.stringify(runsFull));
      return <Story />;
    },
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => {
      // Tylko aktywne → archiwum puste.
      localStorage.setItem(
        'run:runs',
        JSON.stringify(runsFull.filter((r) => r.state === 'in_progress')),
      );
      return <Story />;
    },
  ],
};
