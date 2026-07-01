import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { Ranking } from './Ranking';
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

const meta: Meta<typeof Ranking> = {
  title: 'Capture/Ranking',
  component: Ranking,
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

type Story = StoryObj<typeof Ranking>;

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
            'zaległe podatki',
            'remont łazienki',
          ]),
        ),
      );
      return <Story />;
    },
  ],
};

export const SingleStressor: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem(
        'capture:stressors',
        JSON.stringify(makeStressors(['rozmowa z szefem o podwyżce'])),
      );
      return <Story />;
    },
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('capture:stressors', JSON.stringify(makeStressors([])));
      return <Story />;
    },
  ],
};
