import type { Meta, StoryObj } from '@storybook/react';

import { FocusTaskScreen } from './FocusTaskScreen';
import type { Task } from '@/modules/decompose/types/task';

const meta: Meta<typeof FocusTaskScreen> = {
  title: 'Focus/FocusTaskScreen',
  component: FocusTaskScreen,
  args: {
    onDone: () => {},
    onSkip: () => {},
    onDismiss: () => {},
    onBack: () => {},
    onTogglePause: () => {},
    onExit: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof FocusTaskScreen>;

const TS = '2026-06-28T00:00:00.000Z';

const task: Task = {
  id: 't1',
  runId: 'story',
  text: 'Find the phone number for the repair shop',
  nextActionId: 'na1',
  stressorId: 's1',
  state: 'pending',
  context: 'Phone',
  energy: 1,
  estimatedTime: 5,
  timerElapsed: 0,
  createdAt: TS,
  updatedAt: TS,
};

const stressor = { id: 's1', runId: 'story', text: 'car needs repair', createdAt: TS, updatedAt: TS };
const nextAction = { id: 'na1', runId: 'story', stressorId: 's1', text: 'Book the repair at the shop', createdAt: TS, updatedAt: TS };

const reasons = [
  { id: 'r1', runId: 'story', stressorId: 's1', text: 'I get home safely every night', valence: 'positive' as const, createdAt: TS, updatedAt: TS },
  { id: 'r2', runId: 'story', stressorId: 's1', text: 'the car will break down on the road', valence: 'negative' as const, createdAt: TS, updatedAt: TS },
];

const baseArgs = {
  task,
  stressor,
  nextAction,
  reasons,
  doneVision: { text: 'the car runs smoothly and quietly, driving without tension', emoji: '😌' },
  running: true,
  position: { index: 0, total: 4 },
  canGoBack: false,
};

export const Default: Story = { args: { ...baseArgs, elapsedSeconds: 42 } };

export const OverThreshold: Story = {
  args: { ...baseArgs, elapsedSeconds: 900, position: { index: 2, total: 4 }, canGoBack: true },
};

export const Paused: Story = { args: { ...baseArgs, running: false, elapsedSeconds: 18 } };

export const NoMotivation: Story = {
  args: {
    ...baseArgs,
    reasons: [],
    doneVision: undefined,
  },
};
