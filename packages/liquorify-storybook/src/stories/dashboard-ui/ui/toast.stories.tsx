import { Toaster, toastManager } from '@spree/dashboard-ui/ui/toast'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'

interface ToastExample {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title: string
  description?: string
}

/**
 * Raises the toasts through the app-wide manager, as Spree's screens do, and
 * keeps them up until the story closes. The manager outlives each story, so
 * the toasts it raised are closed when the story unmounts.
 */
function Toasts({ toasts }: { toasts: ToastExample[] }) {
  useEffect(() => {
    const ids = toasts.map((toast) => toastManager.add({ ...toast, timeout: 0 }))
    return () => {
      for (const id of ids) toastManager.close(id)
    }
  }, [toasts])

  return <Toaster />
}

const meta = {
  title: 'Dashboard UI/Primitives/Toast',
  component: Toasts,
  tags: ['CMP-DUI-P-45'],
  args: { toasts: [{ type: 'success', title: 'Invitation resent' }] },
  // Toasts stack at the window's bottom-right corner, outside the story's root.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof Toasts>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {}

export const ErrorToast: Story = {
  name: 'Error',
  args: { toasts: [{ type: 'error', title: 'Failed to resend invitation' }] },
}

export const WithDescription: Story = {
  name: 'With description',
  args: {
    toasts: [
      {
        type: 'error',
        title: 'Could not export the data',
        description: 'Network request failed',
      },
    ],
  },
}

export const Info: Story = {
  args: {
    toasts: [{ type: 'info', title: 'Still processing — we’ll email you a link when it’s ready.' }],
  },
}

export const Loading: Story = {
  args: { toasts: [{ type: 'loading', title: 'Preparing export…' }] },
}

// Later toasts stack in front; the earlier ones peek out behind them.
export const Stacked: Story = {
  args: {
    toasts: [
      { type: 'success', title: 'Staff updated' },
      { type: 'success', title: 'Invitation resent' },
      { type: 'success', title: 'Role created' },
    ],
  },
}
