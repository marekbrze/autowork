import type { Meta, StoryObj } from '@storybook/react';

import { DismissUndoToast } from './FocusStates';

const meta: Meta<typeof DismissUndoToast> = {
  title: 'Focus/DismissUndoToast',
  component: DismissUndoToast,
  args: { onUndo: () => {} },
};

export default meta;

type Story = StoryObj<typeof DismissUndoToast>;

/** #3 — undo Dismiss widoczne też na podsumowaniu (toast na poziomie FocusView). */
export const Default: Story = {
  args: { text: 'Wypełnij formularz PIT w e-Urzędzie' },
};

export const LongText: Story = {
  args: {
    text: 'Napisaz długą, szczegółową wiadomość do klienta z podsumowaniem ustaleń i propozycją kolejnych kroków w projekcie',
  },
};
