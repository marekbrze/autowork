import type { Meta, StoryObj } from '@storybook/react';

import { SessionResumeBanner } from './FocusStates';

const meta: Meta<typeof SessionResumeBanner> = {
  title: 'Focus/SessionResumeBanner',
  component: SessionResumeBanner,
  args: { onResume: () => {}, onAbandon: () => {} },
};

export default meta;

type Story = StoryObj<typeof SessionResumeBanner>;

/** #2 — przerwana sesja; banner wznawiania nad filtrem. */
export const MidSession: Story = {
  args: { position: 3, total: 5 },
};

export const FirstTask: Story = {
  args: { position: 1, total: 4 },
};

export const LastTask: Story = {
  args: { position: 5, total: 5 },
};
