import type { Meta, StoryObj } from '@storybook/react';

import { DecomposeModal } from './DecomposeModal';
import type { NextAction } from '../types/next-action';

const nextAction: NextAction = {
  id: 'na-1',
  runId: 'story',
  stressorId: 'stressor-1',
  text: 'Call the shop and book a time',
  createdAt: '2026-06-28T00:00:00.000Z',
  updatedAt: '2026-06-28T00:00:00.000Z',
};

const meta: Meta<typeof DecomposeModal> = {
  title: 'Decompose/DecomposeModal',
  component: DecomposeModal,
  args: {
    nextAction,
    onSave: (texts: string[]) => console.log('save', texts),
    onClose: () => console.log('close'),
  },
};

export default meta;

type Story = StoryObj<typeof DecomposeModal>;

export const Empty: Story = {
  args: {
    initialSteps: [],
  },
};

export const WithSteps: Story = {
  args: {
    initialSteps: ['Find the shop\'s phone number', 'Call and book a visit this week'],
  },
};
