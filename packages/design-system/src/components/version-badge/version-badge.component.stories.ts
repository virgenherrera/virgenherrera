import type { Meta, StoryObj } from '@storybook/angular';
import { VersionBadgeComponent } from './version-badge.component';

const meta: Meta<VersionBadgeComponent> = {
  title: 'Design System/VersionBadge',
  component: VersionBadgeComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<VersionBadgeComponent>;

export const Default: Story = {
  args: {
    version: 'v1.1.5',
  },
};

export const WithCommitSha: Story = {
  args: {
    version: 'v1.1.5+a1b2c3d',
  },
};
