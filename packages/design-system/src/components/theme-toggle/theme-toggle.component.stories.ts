import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { signal } from '@angular/core';
import { ThemeToggleComponent } from './theme-toggle.component';
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

const meta: Meta<ThemeToggleComponent> = {
  title: 'Design System/ThemeToggle',
  component: ThemeToggleComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<ThemeToggleComponent>;

export const Default: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThemeStoreBase, useValue: createMockThemeStore(false) },
      ],
    }),
  ],
};

export const Dark: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThemeStoreBase, useValue: createMockThemeStore(true) },
      ],
    }),
  ],
};
