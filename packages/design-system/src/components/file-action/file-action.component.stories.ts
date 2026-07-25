import type { Meta, StoryObj } from '@storybook/angular';
import { FileActionComponent } from './file-action.component';

const meta: Meta<FileActionComponent> = {
  title: 'Design System/FileAction',
  component: FileActionComponent,
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'select',
      options: ['download', 'mail', 'globe', 'gitHub', 'linkedIn'],
    },
    loading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<FileActionComponent>;

export const Default: Story = {
  args: {
    icon: 'download',
    label: 'Download Resume',
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    icon: 'download',
    label: 'Download Resume',
    loading: true,
  },
};

export const CustomIcon: Story = {
  args: {
    icon: 'mail',
    label: 'Contact Me',
    loading: false,
  },
};
