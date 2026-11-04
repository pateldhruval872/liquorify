import type { Preview } from '@storybook/react-vite'
import { setupWorker } from 'msw/browser'
import { mswLoader } from 'msw-storybook-addon/csf3'
import '../src/styles.css'
import { withPanelProviders } from '../src/decorators/providers'
import { routerLoader, withRouter } from '../src/decorators/router'

async function startMockServiceWorker() {
  const worker = setupWorker()
  await worker.start({
    quiet: true,
    // A request to Spree's APIs that no story handler answers is a gap in the
    // story's mocks. Everything else (fonts, flags) is Storybook's own files.
    onUnhandledRequest: (request, print) => {
      if (new URL(request.url).pathname.startsWith('/api/')) print.error()
    },
  })
  return worker
}

// Text drawn before its font arrives is drawn again when it does, and a dotted
// underline drawn twice is not always shaded the same, so a capture could differ
// from its reference. Stories render once the dashboard's fonts are in.
async function loadFonts() {
  await Promise.all(
    ['"Geist Variable"', '"Geist Mono Variable"'].map((family) =>
      document.fonts.load(`1em ${family}`, 'Aa\u0142'),
    ),
  )
}

const preview: Preview = {
  loaders: [loadFonts, mswLoader(startMockServiceWorker), routerLoader],
  // The first decorator is the innermost: the router sits inside the
  // providers, as it does in both panels.
  decorators: [withRouter, withPanelProviders],
  globalTypes: {
    theme: {
      description: 'Light or dark theme',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: { layout: 'padded' },
}

export default preview
