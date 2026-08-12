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
    doneVision: { text: 'the car runs smoothly and quietly, driving without tension', emoji: '😌' },
    reasons: [
      { id: 'r1', runId: 'story', stressorId: 's1', text: 'I get home safely every night', valence: 'positive', createdAt: TS, updatedAt: TS },
      { id: 'r2', runId: 'story', stressorId: 's1', text: 'the car will break down on the road', valence: 'negative', createdAt: TS, updatedAt: TS },
    ],
  },
};

export const ReasonsOnly: Story = {
  args: {
    reasons: [
      { id: 'r1', runId: 'story', stressorId: 's1', text: 'peace of mind — the tax office stops hanging over my head', valence: 'positive', createdAt: TS, updatedAt: TS },
    ],
  },
};

export const Empty: Story = {
  args: { doneVision: undefined, reasons: [] },
};
