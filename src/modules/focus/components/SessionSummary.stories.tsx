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
      { id: 't1', text: 'Find the phone number for the repair shop', seconds: 312 },
      { id: 't2', text: 'Call and book an appointment for this week', seconds: 645 },
    ],
    dismissed: [{ id: 't3', text: 'Fill out the PIT form in the e-Office' }],
    totalSeconds: 957,
  },
};

export const OnlyCompleted: Story = {
  args: {
    completed: [{ id: 't1', text: 'Check market rates', seconds: 480 }],
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
    dismissed: [{ id: 't3', text: 'Fill out the PIT form in the e-Office' }],
    totalSeconds: 0,
  },
};
