import type { Meta, StoryObj } from '@storybook/react';

import { FocusTimer } from './FocusTimer';

const meta: Meta<typeof FocusTimer> = {
  title: 'Focus/FocusTimer',
  component: FocusTimer,
};

export default meta;

type Story = StoryObj<typeof FocusTimer>;

/** Pod progiem oszacowania — kolor neutralny. */
export const UnderThreshold: Story = {
  args: { elapsedSeconds: 120, thresholdMinutes: 30 },
};

/** Powyżej progu — render czerwony (overtime). */
export const OverThreshold: Story = {
  args: { elapsedSeconds: 2100, thresholdMinutes: 30 },
};

/** Task bez oszacowania czasu — próg nieokreślony. */
export const NoThreshold: Story = {
  args: { elapsedSeconds: 745 },
};

/** Wstrzymany. */
export const Paused: Story = {
  args: { elapsedSeconds: 90, thresholdMinutes: 5, paused: true },
};
