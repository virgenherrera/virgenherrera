import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { signal } from '@angular/core';
import { FloatingActionsComponent } from './floating-actions.component';
import {
  HUB_ACTIONS,
  type HubAction,
  type HubContext,
} from '../../types/hub-action';

function createAction(
  overrides: Partial<HubAction> & Pick<HubAction, 'id' | 'order'>,
): HubAction {
  return {
    label: signal('Action'),
    icon: signal('kebab'),
    zone: 'permanent',
    highlight: signal(false),
    isAvailable: () => true,
    execute: (): void => {},
    ...overrides,
  };
}

const themeAction = createAction({
  id: 'theme-toggle',
  order: 0,
  label: signal('Dark mode'),
  icon: signal('moon'),
});

const shareAction = createAction({
  id: 'share',
  order: 5,
  label: signal('Share profile'),
  icon: signal('globe'),
  highlight: signal(true),
});

const downloadAction = createAction({
  id: 'download-pdf',
  order: 10,
  zone: 'contextual',
  label: signal('Download resume'),
  icon: signal('download'),
  isAvailable: (ctx: HubContext) => ctx.isPrivateView,
});

const meta: Meta<FloatingActionsComponent> = {
  title: 'Design System/FloatingActions',
  component: FloatingActionsComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    moduleMetadata({
      providers: [
        { provide: HUB_ACTIONS, useValue: themeAction, multi: true },
        { provide: HUB_ACTIONS, useValue: shareAction, multi: true },
        { provide: HUB_ACTIONS, useValue: downloadAction, multi: true },
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<FloatingActionsComponent>;

export const Default: Story = {
  args: {
    position: 'top-right',
    context: { isDark: false, isPrivateView: true },
  },
};

export const Expanded: Story = {
  args: {
    position: 'top-right',
    context: { isDark: false, isPrivateView: true },
  },
  play: ({ canvasElement }) => {
    const trigger = canvasElement.querySelector<HTMLButtonElement>(
      '.vh-floating-actions__trigger',
    );
    trigger?.click();
  },
};

export const SingleAction: Story = {
  decorators: [
    moduleMetadata({
      providers: [{ provide: HUB_ACTIONS, useValue: themeAction, multi: true }],
    }),
  ],
  args: {
    position: 'top-right',
    context: { isDark: false, isPrivateView: false },
  },
};
