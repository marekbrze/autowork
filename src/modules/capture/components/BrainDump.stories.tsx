import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { BrainDump } from './BrainDump';
import type { Stressor } from '../types/stressor';

function makeStressors(texts: string[]): Stressor[] {
  return texts.map((text, i) => ({
    id: `stressor-${i + 1}`,
    runId: 'story',
    text,
    createdAt: '2026-06-28T00:00:00.000Z',
    updatedAt: '2026-06-28T00:00:00.000Z',
  }));
}

const meta: Meta<typeof BrainDump> = {
  title: 'Capture/BrainDump',
  component: BrainDump,
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

type Story = StoryObj<typeof BrainDump>;

export const EmptyState: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('capture:stressors', JSON.stringify(makeStressors([])));
      return <Story />;
    },
  ],
};

export const WithData: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem(
        'capture:stressors',
        JSON.stringify(
          makeStressors([
            'samochód do naprawy',
            'wypowiedzenie umowy najmu',
            'rozmowa z szefem o podwyżce',
          ]),
        ),
      );
      return <Story />;
    },
  ],
};
