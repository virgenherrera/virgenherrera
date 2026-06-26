import type { Meta, StoryObj } from '@storybook/angular';
import { mockProfile } from '../../mock-profile';
import { ProfileSidebarComponent } from './profile-sidebar.component';

const meta: Meta<ProfileSidebarComponent> = {
  title: 'Design System/ProfileSidebar',
  component: ProfileSidebarComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<ProfileSidebarComponent>;

export const FullProfile: Story = {
  args: {
    name: mockProfile.name,
    headline: mockProfile.headline,
    avatarSrc: 'avatar.jpg',
    avatarAlt: mockProfile.name,
    location: mockProfile.location,
    summary: mockProfile.summary,
    skills: mockProfile.skills,
    education: mockProfile.education,
    languages: mockProfile.languages,
    links: mockProfile.links,
    variant: 'private',
  },
};

export const WithProjection: Story = {
  render: (args) => ({
    props: args,
    template: `
      <vh-profile-sidebar
        [name]="name"
        [headline]="headline"
        [location]="location"
        [skills]="skills"
      >
        <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 0.5rem;">
          <a href="https://teslauniverse.com" style="color: var(--vh-text-accent);">Tesla Universe</a>
          <a href="https://nikolateslamuseum.org" style="color: var(--vh-text-accent);">Museum</a>
        </div>
      </vh-profile-sidebar>
    `,
  }),
  args: {
    name: mockProfile.name,
    headline: mockProfile.headline,
    location: mockProfile.location,
    skills: mockProfile.skills.slice(0, 2),
  },
};

export const PublicVariant: Story = {
  args: {
    name: mockProfile.name,
    headline: mockProfile.headline,
    avatarSrc: 'avatar.jpg',
    avatarAlt: mockProfile.name,
    location: mockProfile.location,
    summary: mockProfile.summary,
    skills: mockProfile.skills,
    education: mockProfile.education,
    languages: mockProfile.languages,
    links: mockProfile.links,
    email: 'contact@example.com',
    phone: '+1 555 000 0000',
    variant: 'public',
  },
};

export const PrivateVariant: Story = {
  args: {
    name: mockProfile.name,
    headline: mockProfile.headline,
    avatarSrc: 'avatar.jpg',
    avatarAlt: mockProfile.name,
    location: mockProfile.location,
    summary: mockProfile.summary,
    skills: mockProfile.skills,
    education: mockProfile.education,
    languages: mockProfile.languages,
    links: mockProfile.links,
    email: 'contact@example.com',
    phone: '+1 555 000 0000',
    variant: 'private',
  },
};
