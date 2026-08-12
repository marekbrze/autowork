import type { Meta, StoryObj } from '@storybook/react';

import { DismissUndoToast } from './FocusStates';

const meta: Meta<typeof DismissUndoToast> = {
  title: 'Focus/DismissUndoToast',
  component: DismissUndoToast,
  args: { onUndo: () => {} },
};

export default meta;

type Story = StoryObj<typeof DismissUndoToast>;

/** #3 — undo Dismiss visible on the summary too (toast at the FocusView level). */
export const Default: Story = {
  args: { text: 'Fill out the PIT form in the e-Office' },
};

export const LongText: Story = {
  args: {
    text: 'Write a long, detailed message to the client summarizing the agreements and proposing the next steps in the project',
  },
};
