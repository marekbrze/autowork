import type { Meta, StoryObj } from '@storybook/react';

import { ReadErrorState } from './FocusStates';

const meta: Meta<typeof ReadErrorState> = {
  title: 'Focus/ReadErrorState',
  component: ReadErrorState,
  args: { onReload: () => {} },
};

export default meta;

type Story = StoryObj<typeof ReadErrorState>;

/** #10 — awaria odczytu storage: jasny stan błędu zamiast mylnego empty-state listy. */
export const Default: Story = {};
