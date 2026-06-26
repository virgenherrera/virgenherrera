import type { Meta, StoryObj } from '@storybook/angular';
import { mockProfile } from '../../mock-profile';
import { LanguageBadgeComponent } from './language-badge.component';

const meta: Meta<LanguageBadgeComponent> = {
  title: 'Design System/LanguageBadge',
  component: LanguageBadgeComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<LanguageBadgeComponent>;

export const Standard: Story = {
  args: {
    data: mockProfile.languages.find((lang) => lang.language === 'English') ?? {
      language: 'English',
      proficiency: 'C1',
    },
  },
};

export const NativeProficiency: Story = {
  args: {
    data: mockProfile.languages.find((lang) => lang.language === 'Serbian') ?? {
      language: 'Serbian',
      proficiency: 'Native',
    },
  },
};
