import type { Meta, StoryObj } from '@storybook/angular';
import { mockProfile } from '../../mock-profile';
import { AvatarComponent } from './avatar.component';

const meta: Meta<AvatarComponent> = {
  title: 'Design System/Avatar',
  component: AvatarComponent,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    showGlow: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<AvatarComponent>;

export const Default: Story = {
  args: {
    src: 'avatar.jpg',
    alt: mockProfile.name,
    size: 'md',
    showGlow: true,
  },
};

export const AllSizes: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; align-items: center; gap: 2rem;">
        <vh-avatar src="${args['src']}" alt="SM" size="sm" [showGlow]="false" />
        <vh-avatar src="${args['src']}" alt="MD" size="md" [showGlow]="false" />
        <vh-avatar src="${args['src']}" alt="LG" size="lg" [showGlow]="false" />
        <vh-avatar src="${args['src']}" alt="XL" size="xl" [showGlow]="false" />
      </div>
    `,
  }),
  args: {
    src: 'avatar.jpg',
    alt: mockProfile.name,
  },
};

export const WithGlow: Story = {
  args: {
    src: 'avatar.jpg',
    alt: mockProfile.name,
    size: 'lg',
    showGlow: true,
  },
};

export const WithoutGlow: Story = {
  args: {
    src: 'avatar.jpg',
    alt: mockProfile.name,
    size: 'lg',
    showGlow: false,
  },
};

export const MissingImage: Story = {
  args: {
    src: '',
    alt: 'HV',
    size: 'lg',
    showGlow: true,
  },
};
