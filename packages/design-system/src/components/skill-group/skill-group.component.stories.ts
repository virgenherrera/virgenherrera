import type { Meta, StoryObj } from '@storybook/angular';
import { SkillGroupComponent } from './skill-group.component';

const meta: Meta<SkillGroupComponent> = {
  title: 'Design System/SkillGroup',
  component: SkillGroupComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<SkillGroupComponent>;

export const WithSkills: Story = {
  args: {
    category: 'Frontend',
    skills: ['React', 'Angular', 'TypeScript', 'CSS', 'Tailwind'],
  },
};

export const EmptySkills: Story = {
  args: {
    category: 'Other',
    skills: [],
  },
};

export const LargeSkillSet: Story = {
  args: {
    category: 'Backend',
    skills: [
      'Node.js',
      'NestJS',
      'TypeScript',
      'PostgreSQL',
      'Redis',
      'Docker',
      'Kubernetes',
      'Azure',
    ],
  },
};
