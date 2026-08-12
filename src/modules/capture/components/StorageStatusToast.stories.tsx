import type { Meta, StoryObj } from '@storybook/react';

import { StorageStatusToast } from './StorageStatusToast';

const meta: Meta<typeof StorageStatusToast> = {
  title: 'Capture/StorageStatusToast',
  component: StorageStatusToast,
  decorators: [
    (Story) => (
      <div className="relative min-h-48 rounded-lg border bg-background p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    writeError: false,
    readError: false,
    onRetry: () => {},
    onDismiss: () => {},
    entityLabel: 'stressors',
  },
};

export default meta;

type Story = StoryObj<typeof StorageStatusToast>;

/** The write failed (LocalStorage full / unavailable) — with retry. */
export const WriteError: Story = {
  args: { writeError: true },
};

/** The read failed (corrupted JSON) — informational, no retry. */
export const ReadError: Story = {
  args: { readError: true },
};

/** No error — nothing renders. */
export const Ok: Story = {
  args: { writeError: false, readError: false },
};
