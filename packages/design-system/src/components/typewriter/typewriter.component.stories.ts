import type { Meta, StoryObj } from '@storybook/angular';
import { mockProfile } from '../../mock-profile';
import { TypewriterComponent } from './typewriter.component';

const SUBTITLE_ITEMS = mockProfile.headline.split('|').map((s) => s.trim());

const meta: Meta<TypewriterComponent> = {
  title: 'Design System/Typewriter',
  component: TypewriterComponent,
  tags: ['autodocs'],
  argTypes: {
    typeSpeed: { control: { type: 'number', min: 10, max: 500 } },
    deleteSpeed: { control: { type: 'number', min: 10, max: 500 } },
    pauseAfterType: { control: { type: 'number', min: 100, max: 5000 } },
    pauseAfterDelete: { control: { type: 'number', min: 100, max: 5000 } },
  },
};

export default meta;
type Story = StoryObj<TypewriterComponent>;

export const Default: Story = {
  args: {
    items: SUBTITLE_ITEMS,
    typeSpeed: 80,
    deleteSpeed: 40,
    pauseAfterType: 2000,
    pauseAfterDelete: 400,
  },
};

export const CustomSpeeds: Story = {
  args: {
    items: ['Fast typing', 'Slow deleting'],
    typeSpeed: 30,
    deleteSpeed: 100,
    pauseAfterType: 1000,
    pauseAfterDelete: 200,
  },
};

export const SingleItem: Story = {
  args: {
    items: ['Only one item — loops back'],
    typeSpeed: 80,
    deleteSpeed: 40,
    pauseAfterType: 2000,
    pauseAfterDelete: 400,
  },
};

export const EmptyItems: Story = {
  args: {
    items: [],
  },
};
