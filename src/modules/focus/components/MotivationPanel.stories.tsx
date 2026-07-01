import type { Meta, StoryObj } from '@storybook/react';

import { MotivationPanel } from './MotivationPanel';

const meta: Meta<typeof MotivationPanel> = {
  title: 'Focus/MotivationPanel',
  component: MotivationPanel,
};

export default meta;

type Story = StoryObj<typeof MotivationPanel>;

const TS = '2026-06-28T00:00:00.000Z';

export const Full: Story = {
  args: {
    doneVision: { text: 'samochód jedzie gładko i milczy, jazda bez napięcia', emoji: '😌' },
    reasons: [
      { id: 'r1', runId: 'story', stressorId: 's1', text: 'wrócę bezpiecznie do domu każdej nocy', valence: 'positive', createdAt: TS, updatedAt: TS },
      { id: 'r2', runId: 'story', stressorId: 's1', text: 'auto zepsuje się w trasie', valence: 'negative', createdAt: TS, updatedAt: TS },
    ],
  },
};

export const ReasonsOnly: Story = {
  args: {
    reasons: [
      { id: 'r1', runId: 'story', stressorId: 's1', text: 'spokój — urząd przestanie wisieć nad głową', valence: 'positive', createdAt: TS, updatedAt: TS },
    ],
  },
};

export const Empty: Story = {
  args: { doneVision: undefined, reasons: [] },
};
