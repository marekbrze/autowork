import type { Meta, StoryObj } from '@storybook/react';

import { StorageStatusToast } from '@/modules/capture/components/StorageStatusToast';

const meta: Meta<typeof StorageStatusToast> = {
  title: 'Decompose/StorageStatusToast',
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
    entityLabel: 'danych',
  },
};

export default meta;

type Story = StoryObj<typeof StorageStatusToast>;

/** Zapis reasons/nextActions/tasks/visions nie powiósł się (LocalStorage pełne) — z retry. */
export const WriteError: Story = {
  args: { writeError: true },
};

/** Odczyt któregoś ze store'ów decompose nie powiódł się (uszkodzony JSON). */
export const ReadError: Story = {
  args: { readError: true },
};
