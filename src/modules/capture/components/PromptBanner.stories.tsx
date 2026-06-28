import type { Meta, StoryObj } from '@storybook/react';

import { PromptBanner } from './PromptBanner';

const meta: Meta<typeof PromptBanner> = {
  title: 'Capture/PromptBanner',
  component: PromptBanner,
};

export default meta;

type Story = StoryObj<typeof PromptBanner>;

export const Default: Story = {
  args: {},
};

export const SinglePrompt: Story = {
  args: {
    prompts: [{ category: 'finanse', example: 'A rata kredytu?' }],
  },
};
