import type { Preview } from '@storybook/angular';
import { setCompodocJson } from '@storybook/addon-docs/angular';
import docJson from '../documentation.json';
setCompodocJson(docJson);

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Toggle dark mode',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (story, context) => {
      const result = story();
      const theme = context.globals['theme'] || 'light';
      return {
        ...result,
        template: `<div class="${theme === 'dark' ? 'dark' : ''}" style="min-height: 100vh; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">${result.template}</div>`,
      };
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      options: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '812px' },
          type: 'mobile',
        },
        sm: {
          name: 'SM (640px)',
          styles: { width: '640px', height: '900px' },
          type: 'mobile',
        },
        md: {
          name: 'MD (768px)',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
        xl: {
          name: 'XL (1280px)',
          styles: { width: '1280px', height: '900px' },
          type: 'desktop',
        },
      },
    },
  },
};

export default preview;
