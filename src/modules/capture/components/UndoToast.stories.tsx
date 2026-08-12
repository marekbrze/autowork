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
    text: 'canceling the lease',
    remaining: 1,
    onUndo: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof UndoToast>;

/** A single deletion in the undo stack. */
export const Single: Story = {
  args: { remaining: 1 },
};

/** Several rapid deletions — all undoable, shows a remaining counter. */
export const Multiple: Story = {
  args: { remaining: 3 },
};
