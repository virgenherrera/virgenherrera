import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { signal } from '@angular/core';
import { mockProfile } from '../../mock-profile';
import { CredentialBadgeComponent } from './credential-badge.component';
import { ThemeStoreBase, type ThemePreference } from '../../types/hub-action';

function createMockThemeStore(initialIsDark: boolean): ThemeStoreBase {
  const isDark = signal(initialIsDark);
  const preference = signal<ThemePreference>(initialIsDark ? 'dark' : 'light');

  return {
    isDark,
    preference,
    toggle: (): void => {
      isDark.update((value) => !value);
      preference.set(isDark() ? 'dark' : 'light');
    },
  };
}

const meta: Meta<CredentialBadgeComponent> = {
  title: 'Design System/CredentialBadge',
  component: CredentialBadgeComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    certifications: [
      {
        name: 'Top 3% Talent',
        issuer: 'Toptal',
        date: { year: 2026, month: 7 },
        url: 'https://topt.al/AjcJrA',
        badge: true,
      },
      ...mockProfile.certifications,
    ],
  },
};

export default meta;
type Story = StoryObj<CredentialBadgeComponent>;

export const LightTheme_DarkBadge: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThemeStoreBase, useValue: createMockThemeStore(false) },
      ],
    }),
  ],
};

export const DarkTheme_LightBadge: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThemeStoreBase, useValue: createMockThemeStore(true) },
      ],
    }),
  ],
};
