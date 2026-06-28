import type { Meta, StoryObj } from '@storybook/react';

import { PairingFlow, type PairingState } from './PairingFlow';
import type { Stressor } from '../types/stressor';

function makeStressors(texts: string[]): Stressor[] {
  return texts.map((text, i) => ({
    id: `s-${i + 1}`,
    text,
    createdAt: '2026-06-28T00:00:00.000Z',
    updatedAt: '2026-06-28T00:00:00.000Z',
  }));
}

const STRESSORS = makeStressors([
  'samochód do naprawy',
  'wypowiedzenie umowy najmu',
  'rozmowa z szefem o podwyżce',
  'zaległe podatki',
  'remont łazienki',
]);

/** Stan mid-sequence: 2 stresory już ułożone, 3. wstawiany, 3 pytania za nami. */
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

/** Ekran startowy parowania. */
export const Intro: Story = {};

/** Mid-sequence — widać licznik postępu (Pytanie N, Stresor X z Y). */
export const MidSequence: Story = {
  args: { initialState: COMPARE_STATE },
};

/** Potwierdzenie przerwania mid-sequence — postęp by przepadł. */
export const AbandonConfirm: Story = {
  args: { initialState: COMPARE_STATE, initialConfirmAbandon: true },
};

/** Ukończone parowanie — finalna kolejność + Zastosuj. */
export const Done: Story = {
  args: { initialState: DONE_STATE },
};
