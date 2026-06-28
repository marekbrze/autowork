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
    entityLabel: 'stresorów',
  },
};

export default meta;

type Story = StoryObj<typeof StorageStatusToast>;

/** Zapis nie powiósł się (LocalStorage pełne / niedostępne) — z retry. */
export const WriteError: Story = {
  args: { writeError: true },
};

/** Odczyt nie powiódł się (uszkodzony JSON) — informacyjnie, bez retry. */
export const ReadError: Story = {
  args: { readError: true },
};

/** Brak błędu — nic się nie renderuje. */
export const Ok: Story = {
  args: { writeError: false, readError: false },
};
