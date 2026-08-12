import type { Meta, StoryObj } from '@storybook/react';

import { FocusTimer } from './FocusTimer';

const meta: Meta<typeof FocusTimer> = {
  title: 'Focus/FocusTimer',
  component: FocusTimer,
};

export default meta;

type Story = StoryObj<typeof FocusTimer>;

/** Below the estimate threshold — neutral color. */
export const UnderThreshold: Story = {
  args: { elapsedSeconds: 120, thresholdMinutes: 30 },
};

/** Above the threshold — red render (overtime). */
export const OverThreshold: Story = {
  args: { elapsedSeconds: 2100, thresholdMinutes: 30 },
};

/** Task without a time estimate — threshold undefined. */
export const NoThreshold: Story = {
  args: { elapsedSeconds: 745 },
};

/** Paused. */
export const Paused: Story = {
  args: { elapsedSeconds: 90, thresholdMinutes: 5, paused: true },
};
