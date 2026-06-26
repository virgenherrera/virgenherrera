import type { Meta, StoryObj } from '@storybook/angular';
import { mockProfile } from '../../mock-profile';
import { ExperienceListComponent } from './experience-list.component';

const meta: Meta<ExperienceListComponent> = {
  title: 'Design System/ExperienceList',
  component: ExperienceListComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['full', 'compact'],
    },
  },
};

export default meta;
type Story = StoryObj<ExperienceListComponent>;

export const Default: Story = {
  args: {
    items: mockProfile.experience,
    heading: 'Experience',
    variant: 'full',
  },
};

export const Compact: Story = {
  args: {
    items: mockProfile.experience,
    heading: 'Experience',
    variant: 'compact',
  },
};
