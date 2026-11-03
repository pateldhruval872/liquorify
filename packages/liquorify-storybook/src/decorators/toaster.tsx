import { Toaster } from '@spree/dashboard-ui/ui/toast'
import type { Decorator } from '@storybook/react-vite'

/** Renders the dashboard's toasts beside the story, as the app shell does. */
export const withToaster: Decorator = (Story) => (
  <>
    <Story />
    <Toaster />
  </>
)
