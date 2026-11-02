import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/stories/**/*.stories.@(ts|tsx)'],
  // The mock service worker, served from the Storybook's own origin.
  staticDirs: ['../public'],
  core: { disableTelemetry: true },
  // Story names are the states (LIQ-010 §10); prop tables are not needed, and
  // generating them would parse every Spree source file the stories import.
  typescript: { reactDocgen: false },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
      resolve: {
        // The stories import Spree's packages by source path, so their bare
        // imports resolve from each package's own folder. One copy of each
        // context-carrying library keeps providers and consumers connected.
        dedupe: [
          'react',
          'react-dom',
          '@tanstack/react-query',
          '@tanstack/react-router',
          'i18next',
          'react-i18next',
          'react-hook-form',
        ],
      },
    }),
}

export default config
