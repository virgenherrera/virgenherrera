import type { Meta, StoryObj } from '@storybook/angular';
import { mockProfile } from '../../mock-profile';
import { ContactLinkComponent } from './contact-link.component';

const meta: Meta<ContactLinkComponent> = {
  title: 'Design System/ContactLink',
  component: ContactLinkComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<ContactLinkComponent>;

export const WithIcon: Story = {
  args: {
    data: mockProfile.links[0],
  },
};

export const WithoutIcon: Story = {
  args: {
    data: {
      label: 'Publications',
      url: 'https://teslauniverse.com/nikola-tesla/articles',
      target: 'blank',
      visibility: 'public',
    },
  },
};
