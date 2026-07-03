import type { Meta, StoryObj } from '@storybook/angular';
import { mockProfile } from '../../mock-profile';
import { ParticleCanvasComponent } from './particle-canvas.component';

const TECH_LABELS = mockProfile.skills.flatMap((category) => category.skills);

const meta: Meta<ParticleCanvasComponent> = {
  title: 'Design System/Particle Canvas',
  component: ParticleCanvasComponent,
  tags: ['autodocs'],
  decorators: [
    (story) => {
      const result = story();

      return {
        ...result,
        template: `<div style="position: relative; width: 100%; height: 600px; background: var(--color-vh-jumbotron-bg);">${result.template}</div>`,
      };
    },
  ],
};

export default meta;
type Story = StoryObj<ParticleCanvasComponent>;

export const Default: Story = {
  args: {
    labels: TECH_LABELS,
    config: {},
  },
};

export const CustomPalette: Story = {
  args: {
    labels: TECH_LABELS,
    config: {
      palette: [
        'rgba(59, 130, 246, 0.6)',
        'rgba(16, 185, 129, 0.5)',
        'rgba(245, 158, 11, 0.4)',
        'rgba(239, 68, 68, 0.3)',
      ],
    },
  },
};

export const FewParticles: Story = {
  args: {
    labels: ['Angular', 'TypeScript', 'NestJS'],
    config: {
      dotCount: 15,
      textCount: 5,
    },
  },
};

export const WithDepth: Story = {
  args: {
    labels: TECH_LABELS,
    config: {},
  },
};

export const DepthCloseUp: Story = {
  args: {
    labels: ['Angular', 'TypeScript', 'NestJS'],
    config: {
      dotCount: 12,
      textCount: 3,
    },
  },
};
