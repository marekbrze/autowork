import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { SessionFilter } from './SessionFilter';
import type { Task } from '@/modules/decompose/types/task';

/** Matched against the Phone/Creative × energies 1–3 filter. */
const matchedTasks: Task[] = [
  { id: '1', runId: 'story', text: 'Call the bank about the mortgage rate', nextActionId: 'n', stressorId: 's', state: 'pending', context: 'Phone', energy: 1, estimatedTime: 15, timerElapsed: 0, createdAt: '2026-06-30T00:00:00.000Z', updatedAt: '2026-06-30T00:00:00.000Z' },
  { id: '2', runId: 'story', text: 'Draft landing page hero copy', nextActionId: 'n', stressorId: 's', state: 'pending', context: 'Creative', energy: 3, estimatedTime: 45, timerElapsed: 0, createdAt: '2026-06-30T00:00:01.000Z', updatedAt: '2026-06-30T00:00:01.000Z' },
  { id: '3', runId: 'story', text: 'Reply to the landlord about the leak', nextActionId: 'n', stressorId: 's', state: 'pending', context: 'Phone', energy: 2, estimatedTime: 5, timerElapsed: 0, createdAt: '2026-06-30T00:00:02.000Z', updatedAt: '2026-06-30T00:00:02.000Z' },
];

const meta: Meta<typeof SessionFilter> = {
  title: 'Focus/SessionFilter',
  component: SessionFilter,
  args: { onSelectionChange: () => {}, onStart: () => {}, resolvedAttributed: 0, matchedEstimateMin: 0 },
  // AllDone renders a <Link to="/process"> — needs a router context.
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SessionFilter>;

export const Empty: Story = {
  args: { selection: { contexts: [], energies: [] }, matchCount: 0, totalAttributed: 8 },
};

export const WithMatches: Story = {
  args: { selection: { contexts: ['Phone', 'Creative'], energies: [1, 2, 3] }, matchCount: 4, matchedEstimateMin: 120, totalAttributed: 8 },
};

export const NoMatches: Story = {
  args: { selection: { contexts: ['City'], energies: [3] }, matchCount: 0, totalAttributed: 8 },
};

export const AllSelected: Story = {
  args: {
    selection: { contexts: ['Phone', 'Message', 'Creative', 'Errands', 'Home', 'City'], energies: [1, 2, 3] },
    matchCount: 8,
    matchedEstimateMin: 240,
    totalAttributed: 8,
  },
};

export const NothingAttributed: Story = {
  args: { selection: { contexts: [], energies: [] }, matchCount: 0, totalAttributed: 0, resolvedAttributed: 0 },
};

/** #4 — tasks are described but all resolved (end of the funnel, not missing data). */
export const AllDone: Story = {
  args: { selection: { contexts: [], energies: [] }, matchCount: 0, totalAttributed: 0, resolvedAttributed: 6 },
};

/** Matched list + order control (ADR 0035/0036). */
export const WithMatchedList: Story = {
  args: {
    selection: { contexts: ['Phone', 'Creative'], energies: [1, 2, 3] },
    matchCount: 3,
    matchedEstimateMin: 65,
    totalAttributed: 8,
    resolvedAttributed: 0,
    matchedTasks,
    onReorder: () => {},
    hasManualOrder: false,
    onResetOrder: () => {},
  },
};

/** Active manual order → "Reset to default" is visible. */
export const WithManualOrder: Story = {
  args: {
    selection: { contexts: ['Phone', 'Creative'], energies: [1, 2, 3] },
    matchCount: 3,
    matchedEstimateMin: 65,
    totalAttributed: 8,
    resolvedAttributed: 0,
    matchedTasks,
    onReorder: () => {},
    hasManualOrder: true,
    onResetOrder: () => {},
  },
};
