import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { SessionFilter } from './SessionFilter';

const meta: Meta<typeof SessionFilter> = {
  title: 'Focus/SessionFilter',
  component: SessionFilter,
  args: { onSelectionChange: () => {}, onStart: () => {}, resolvedAttributed: 0 },
  // AllDone renderuje <Link to="/process"> — potrzebuje kontekstu routera.
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SessionFilter>;

export const Empty: Story = {
  args: { selection: { contexts: [], energies: [] }, matchCount: 0, totalAttributed: 8 },
};

export const WithMatches: Story = {
  args: { selection: { contexts: ['Phone', 'Creative'], energies: [1, 2, 3] }, matchCount: 4, totalAttributed: 8 },
};

export const NoMatches: Story = {
  args: { selection: { contexts: ['City'], energies: [3] }, matchCount: 0, totalAttributed: 8 },
};

export const AllSelected: Story = {
  args: {
    selection: { contexts: ['Phone', 'Message', 'Creative', 'Errands', 'Home', 'City'], energies: [1, 2, 3] },
    matchCount: 8,
    totalAttributed: 8,
  },
};

export const NothingAttributed: Story = {
  args: { selection: { contexts: [], energies: [] }, matchCount: 0, totalAttributed: 0, resolvedAttributed: 0 },
};

/** #4 — taski opisane są, ale wszystkie rozwiązane (koniec lejka, nie brak danych). */
export const AllDone: Story = {
  args: { selection: { contexts: [], energies: [] }, matchCount: 0, totalAttributed: 0, resolvedAttributed: 6 },
};
