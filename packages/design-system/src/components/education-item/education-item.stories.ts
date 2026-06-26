import type { Meta, StoryObj } from '@storybook/angular';
import { mockProfile } from '../../mock-profile';
import { EducationItemComponent } from './education-item.component';

const meta: Meta<EducationItemComponent> = {
  title: 'Design System/EducationItem',
  component: EducationItemComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<EducationItemComponent>;

export const Default: Story = {
  args: {
    data: mockProfile.education[0],
  },
};

export const WithoutHonors: Story = {
  args: {
    data: {
      ...mockProfile.education[0],
      honors: undefined,
    },
  },
};

export const DateFormat: Story = {
  args: {
    data: {
      ...mockProfile.education[0],
      startDate: '2018-01',
      graduationDate: '2021-05',
    },
  },
};
