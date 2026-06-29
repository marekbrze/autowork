import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { runsFull } from '@/scenarios/data/run';

import { RunCard } from './RunCard';

const meta: Meta<typeof RunCard> = {
  title: 'Run/RunCard',
  component: RunCard,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="mx-auto max-w-xl space-y-4 py-4">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof RunCard>;

const ActiveActions = (
  <>
    <Button size="sm">Kontynuuj</Button>
    <Button size="sm" variant="outline">Szczegóły</Button>
  </>
);

const ArchivedActions = (
  <>
    <Button size="sm" variant="outline">Rozarchiwizuj</Button>
    <Button size="sm" variant="destructive">Usuń</Button>
  </>
);

export const Active: Story = {
  render: () => <RunCard run={runsFull[0]} actions={ActiveActions} />,
};

export const Archived: Story = {
  render: () => <RunCard run={runsFull[3]} actions={ArchivedActions} />,
};
