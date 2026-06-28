import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { DecomposeView } from './DecomposeView';
import { buildDecomposeSeedFull } from '@/scenarios/data/decompose';
import type { Stressor } from '@/modules/capture/types/stressor';

function makeStressors(texts: string[]): Stressor[] {
  return texts.map((text, i) => ({
    id: `stressor-${i + 1}`,
    text,
    createdAt: '2026-06-28T00:00:00.000Z',
    updatedAt: '2026-06-28T00:00:00.000Z',
  }));
}

function clearDecompose() {
  ['decompose:reasons', 'decompose:nextActions', 'decompose:tasks', 'decompose:doneVisions'].forEach((k) =>
    localStorage.removeItem(k),
  );
}

const meta: Meta<typeof DecomposeView> = {
  title: 'Decompose/DecomposeView',
  component: DecomposeView,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="mx-auto max-w-2xl py-4">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof DecomposeView>;

export const EmptyState: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('capture:stressors', JSON.stringify([]));
      clearDecompose();
      return <Story />;
    },
  ],
};

export const WithData: Story = {
  decorators: [
    (Story) => {
      const stressors = makeStressors([
        'samochód do naprawy',
        'wypowiedzenie umowy najmu',
        'rozmowa z szefem o podwyżce',
      ]);
      localStorage.setItem('capture:stressors', JSON.stringify(stressors));

      // wypełniony WHY + HOW dla pierwszego stresora
      const seed = buildDecomposeSeedFull('stressor-1');
      localStorage.setItem('decompose:reasons', JSON.stringify(seed.reasons));
      localStorage.setItem('decompose:nextActions', JSON.stringify(seed.nextActions));
      localStorage.setItem('decompose:tasks', JSON.stringify(seed.tasks));
      localStorage.setItem('decompose:doneVisions', JSON.stringify(Object.fromEntries([seed.doneVision])));

      return <Story />;
    },
  ],
};
