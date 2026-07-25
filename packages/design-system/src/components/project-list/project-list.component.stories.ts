import type { Meta, StoryObj } from '@storybook/angular';
import type { ProjectData } from '@vh/profile';
import { ProjectListComponent } from './project-list.component';

const projects: ProjectData[] = [
  {
    name: 'Alternating Current Motor',
    description:
      'A polyphase induction motor design that eliminated the need for commutators, laying the foundation for modern AC power distribution.',
    url: 'https://teslauniverse.com/nikola-tesla/patents/us-patent-381968',
    technologies: ['AC Motors', 'Polyphase Systems', 'Patents'],
  },
  {
    name: 'Tesla Coil',
    description:
      'A resonant transformer circuit capable of producing high-voltage, low-current, high-frequency alternating current electricity.',
    url: 'https://teslauniverse.com/nikola-tesla/patents/us-patent-454622',
    technologies: ['High-Frequency Apparatus', 'Resonance'],
  },
  {
    name: 'Wardenclyffe Tower',
    description:
      'An early experimental wireless transmission station intended for trans-Atlantic wireless telephony and broadcasting.',
    url: 'https://teslauniverse.com/nikola-tesla/articles/wardenclyffe-tower',
    technologies: [],
  },
];

const meta: Meta<ProjectListComponent> = {
  title: 'Design System/ProjectList',
  component: ProjectListComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<ProjectListComponent>;

export const Default: Story = {
  args: {
    items: projects,
    heading: 'Projects & Links',
  },
};

export const WithoutTechnologies: Story = {
  args: {
    items: [projects[2]],
    heading: 'Projects & Links',
  },
};

export const Empty: Story = {
  args: {
    items: [],
    heading: 'Projects & Links',
  },
};
