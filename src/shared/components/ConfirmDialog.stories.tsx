import type { Meta, StoryObj } from '@storybook/react';

import { ConfirmDialog } from './ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Shared/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    open: true,
    title: 'Delete this item?',
    description: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    onConfirm: () => console.log('confirm'),
    onCancel: () => console.log('cancel'),
  },
};

export default meta;

type Story = StoryObj<typeof ConfirmDialog>;

/** Confirmation for deleting a next-action (along with its tasks). Focus on "Cancel". */
export const DeleteNextAction: Story = {
  args: {
    title: 'Delete this next-action?',
    description: 'This will also delete its tasks. This action cannot be undone.',
  },
};

/** Confirmation for deleting a single reason (decompose). */
export const DeleteReason: Story = {
  args: {
    title: 'Delete this reason?',
    description: 'This action cannot be undone.',
  },
};

/** Confirmation for deleting a task mid-session (process). */
export const DeleteTask: Story = {
  args: {
    title: 'Delete this task?',
    description: 'It will disappear from the processing queue. This action cannot be undone.',
  },
};

/** Closed — renders nothing. */
export const Closed: Story = {
  args: { open: false },
};
