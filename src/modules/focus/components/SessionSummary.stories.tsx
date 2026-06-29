import type { Meta, StoryObj } from '@storybook/react';

import { SessionSummary } from './SessionSummary';

const meta: Meta<typeof SessionSummary> = {
  title: 'Focus/SessionSummary',
  component: SessionSummary,
  args: { onClearCompleted: () => {}, onNewSession: () => {} },
};

export default meta;

type Story = StoryObj<typeof SessionSummary>;

export const WithData: Story = {
  args: {
    completed: [
      { id: 't1', text: 'Znajdź numer telefonu do warsztatu', seconds: 312 },
      { id: 't2', text: 'Zadzwoń i umów wizytę na ten tydzień', seconds: 645 },
    ],
    dismissed: [{ id: 't3', text: 'Wypełnij formularz PIT w e-Urzędzie' }],
    totalSeconds: 957,
  },
};

export const OnlyCompleted: Story = {
  args: {
    completed: [{ id: 't1', text: 'Sprawdź stawki rynkowe', seconds: 480 }],
    dismissed: [],
    totalSeconds: 480,
  },
};

export const Empty: Story = {
  args: { completed: [], dismissed: [], totalSeconds: 0 },
};

export const OnlyDismissed: Story = {
  args: {
    completed: [],
    dismissed: [{ id: 't3', text: 'Wypełnij formularz PIT w e-Urzędzie' }],
    totalSeconds: 0,
  },
};
