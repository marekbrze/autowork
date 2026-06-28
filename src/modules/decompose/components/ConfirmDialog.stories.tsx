import type { Meta, StoryObj } from '@storybook/react';

import { ConfirmDialog } from './ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Decompose/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    open: true,
    title: 'Usunąć ten next-action?',
    description: 'Usunę też jego taski. Tej operacji nie da się cofnąć.',
    confirmLabel: 'Usuń',
    cancelLabel: 'Anuluj',
    onConfirm: () => console.log('confirm'),
    onCancel: () => console.log('cancel'),
  },
};

export default meta;

type Story = StoryObj<typeof ConfirmDialog>;

/** Potwierdzenie usunięcia next-actionu (razem z jego taskami). Fokus na „Anuluj". */
export const DeleteNextAction: Story = {};

/** Potwierdzenie usunięcia pojedynczego powodu. */
export const DeleteReason: Story = {
  args: {
    title: 'Usunąć ten powód?',
    description: 'Ta operacja nie da się cofnąć.',
  },
};

/** Zamknięty — nic nie renderuje. */
export const Closed: Story = {
  args: { open: false },
};
