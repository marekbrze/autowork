import type { Meta, StoryObj } from '@storybook/react';

import { ReadErrorState } from './FocusStates';

const meta: Meta<typeof ReadErrorState> = {
  title: 'Focus/ReadErrorState',
  component: ReadErrorState,
  args: { onReload: () => {} },
};

export default meta;

type Story = StoryObj<typeof ReadErrorState>;

/** #10 — storage read failure: a clear error state instead of a misleading list empty-state. */
export const Default: Story = {};
