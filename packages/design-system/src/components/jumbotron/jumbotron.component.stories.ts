import type { Meta, StoryObj } from '@storybook/angular';
import { mockProfile } from '../../mock-profile';
import { JumbotronComponent } from './jumbotron.component';

const TECH_LABELS = mockProfile.skills.flatMap((category) => category.skills);
const SUBTITLE_ITEMS = mockProfile.headline.split('|').map((s) => s.trim());

const meta: Meta<JumbotronComponent> = {
  title: 'Design System/Jumbotron',
  component: JumbotronComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<JumbotronComponent>;

export const Default: Story = {
  args: {
    heading: mockProfile.name,
    avatarSrc: 'avatar.jpg',
    avatarAlt: mockProfile.name,
    subtitleItems: SUBTITLE_ITEMS,
    particleLabels: TECH_LABELS,
  },
};
