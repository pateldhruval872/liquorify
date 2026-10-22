import { ErrorState, RouteErrorBoundary } from '@spree/dashboard-ui/spree/route-error-boundary'
import type { Meta, StoryObj } from '@storybook/react-vite'

function Broken(): never {
  throw new Error('Cannot read properties of undefined (reading "line_items")')
}

const meta = {
  title: 'Dashboard UI/Composed/Route error boundary',
  component: ErrorState,
  tags: ['CMP-DUI-C-44'],
  parameters: { liquorify: { column: 'page' } },
} satisfies Meta<typeof ErrorState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// An address inside a store that no screen answers (DA-SHELL-02).
export const NotFound: Story = {
  name: 'Not found',
  args: { title: 'Page not found', description: 'The page you’re looking for doesn’t exist.' },
}

// A plugin's page that the reader's role may not open (DA-SHELL-02).
export const NotAuthorized: Story = {
  name: 'Not authorized',
  args: {
    title: 'Not authorized',
    description: 'You don’t have permission to view this page.',
  },
}

// A part of the page threw while drawing; the boundary shows the error's
// message and offers to draw it again.
export const CaughtError: Story = {
  name: 'Caught error',
  render: () => (
    <RouteErrorBoundary>
      <Broken />
    </RouteErrorBoundary>
  ),
}
