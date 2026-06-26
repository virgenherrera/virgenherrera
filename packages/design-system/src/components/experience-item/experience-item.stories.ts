import type { Meta, StoryObj } from '@storybook/angular';
import { mockProfile } from '../../mock-profile';
import { ExperienceItemComponent } from './experience-item.component';

const meta: Meta<ExperienceItemComponent> = {
  title: 'Design System/ExperienceItem',
  component: ExperienceItemComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['full', 'compact'],
    },
  },
};

export default meta;
type Story = StoryObj<ExperienceItemComponent>;

export const Default: Story = {
  args: {
    data: mockProfile.experience[0],
    variant: 'full',
  },
};

export const Compact: Story = {
  args: {
    data: mockProfile.experience[0],
    variant: 'compact',
  },
};

export const CurrentPosition: Story = {
  args: {
    data: {
      ...mockProfile.experience[0],
      endDate: undefined,
    },
    variant: 'full',
  },
};

export const NoTechnologies: Story = {
  args: {
    data: {
      ...mockProfile.experience[1],
      technologies: [],
    },
    variant: 'full',
  },
};

export const MixedDescription: Story = {
  args: {
    data: mockProfile.experience[2],
    variant: 'full',
  },
};
