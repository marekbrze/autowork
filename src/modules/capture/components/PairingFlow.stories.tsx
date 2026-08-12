import type { Meta, StoryObj } from '@storybook/react';

import { PairingFlow, type PairingState } from './PairingFlow';
import type { Stressor } from '../types/stressor';

function makeStressors(texts: string[]): Stressor[] {
  return texts.map((text, i) => ({
    id: `s-${i + 1}`,
    runId: 'story',
    text,
    createdAt: '2026-06-28T00:00:00.000Z',
    updatedAt: '2026-06-28T00:00:00.000Z',
  }));
}

const STRESSORS = makeStressors([
  'the car needs fixing',
  'canceling the lease',
  'talking to the boss about a raise',
  'overdue taxes',
  'bathroom renovation',
]);

/** Mid-sequence state: 2 stressors already ordered, the 3rd being inserted, 3 questions behind us. */
const COMPARE_STATE: PairingState = {
  phase: 'compare',
  sorted: STRESSORS.slice(0, 2),
  queue: STRESSORS.slice(2),
  x: STRESSORS[2],
  lo: 0,
  hi: 1,
  mid: 0,
  count: 3,
};

const DONE_STATE: PairingState = {
  phase: 'done',
  order: STRESSORS,
  count: 6,
};

const meta: Meta<typeof PairingFlow> = {
  title: 'Capture/PairingFlow',
  component: PairingFlow,
  args: {
    stressors: STRESSORS,
    onApply: () => {},
    onClose: () => {},
  },
  decorators: [
    (Story) => (
      <div className="min-h-96 rounded-lg border bg-background/40 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PairingFlow>;

/** Pairing start screen. */
export const Intro: Story = {};

/** Mid-sequence — the progress counter is visible (Question N, Stressor X of Y). */
export const MidSequence: Story = {
  args: { initialState: COMPARE_STATE },
};

/** Mid-sequence abandon confirmation — progress would be lost. */
export const AbandonConfirm: Story = {
  args: { initialState: COMPARE_STATE, initialConfirmAbandon: true },
};

/** Completed pairing — final order + Apply. */
export const Done: Story = {
  args: { initialState: DONE_STATE },
};
