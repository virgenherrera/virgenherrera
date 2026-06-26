import type { Meta, StoryObj } from '@storybook/angular';
import { TagComponent } from './tag.component';

const meta: Meta<TagComponent> = {
  title: 'Design System/Tag',
  component: TagComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'outlined'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
};

export default meta;
type Story = StoryObj<TagComponent>;

export const Default: Story = {
  args: {
    label: 'TypeScript',
    variant: 'default',
    size: 'md',
  },
};

export const Outlined: Story = {
  args: {
    label: 'Node.js',
    variant: 'outlined',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    label: 'CSS',
    variant: 'default',
    size: 'sm',
  },
};

export const SmallOutlined: Story = {
  args: {
    label: 'Angular',
    variant: 'outlined',
    size: 'sm',
  },
};
