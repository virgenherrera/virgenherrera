import type { Meta, StoryObj } from '@storybook/angular';
import { ICON_PATHS, type IconName } from './icon-paths.constant';
import { IconComponent } from './icon.component';

const ICON_NAMES = Object.keys(ICON_PATHS) as IconName[];

const meta: Meta<IconComponent> = {
  title: 'Design System/Icon',
  component: IconComponent,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'select',
      options: ICON_NAMES,
    },
  },
};

export default meta;
type Story = StoryObj<IconComponent>;

export const Default: Story = {
  args: {
    name: 'download',
    label: 'Download',
  },
};

export const WithoutLabel: Story = {
  args: {
    name: 'gitHub',
  },
};

export const AllIcons: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; font-size: 1.5rem;">
        ${ICON_NAMES.map(
          (name) => `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
              <vh-icon name="${name}" label="${name}" />
              <span style="font-size: 0.75rem;">${name}</span>
            </div>
          `,
        ).join('')}
      </div>
    `,
  }),
};
