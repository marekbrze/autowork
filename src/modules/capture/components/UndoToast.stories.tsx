import type { Meta, StoryObj } from '@storybook/react';

import { UndoToast } from './UndoToast';

const meta: Meta<typeof UndoToast> = {
  title: 'Capture/UndoToast',
  component: UndoToast,
  decorators: [
    (Story) => (
      <div className="relative min-h-40 rounded-lg border bg-background p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    text: 'wypowiedzenie umowy najmu',
    remaining: 1,
    onUndo: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof UndoToast>;

/** Jedno usunięcie w stosie undo. */
export const Single: Story = {
  args: { remaining: 1 },
};

/** Kilka szybkich usunięć — wszystkie cofnalne, pokazuje licznik pozostałych. */
export const Multiple: Story = {
  args: { remaining: 3 },
};
