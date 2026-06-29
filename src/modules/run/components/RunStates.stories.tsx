import type { Meta, StoryObj } from '@storybook/react';

import { RunCompleted, RunReadError } from './RunStates';

const meta: Meta<typeof RunReadError> = {
  title: 'Run/RunStates',
  component: RunReadError,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl py-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof RunReadError>;

export const ReadError: Story = {
  render: () => <RunReadError onReload={() => window.location.reload()} />,
};

export const Completed: Story = {
  render: () => <RunCompleted onArchive={() => undefined} />,
};
