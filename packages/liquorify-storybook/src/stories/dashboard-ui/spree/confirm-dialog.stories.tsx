import { useConfirm } from '@spree/dashboard-ui/spree/confirm-dialog'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'

type ConfirmOptions = Parameters<ReturnType<typeof useConfirm>>[0]

/**
 * Asks through `useConfirm`, as a screen does before a destructive action.
 * Both panels mount the dialog once, in their providers, and the story's
 * decorator mounts it the same way.
 */
function Confirm(options: ConfirmOptions) {
  const confirm = useConfirm()

  useEffect(() => {
    void confirm(options)
  }, [confirm, options])

  return null
}

const meta = {
  title: 'Dashboard UI/Composed/Confirm dialog',
  component: Confirm,
  tags: ['CMP-DUI-C-10'],
  args: { message: 'Move these units into a new fulfillment? This takes effect immediately.' },
  // The dialog renders outside the story's root, over the whole window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof Confirm>

export default meta
type Story = StoryObj<typeof meta>

// A confirmation without its own title, as the order page's split-shipment
// prompt asks, takes the default "Are you sure?".
export const Default: Story = {}

export const RemoveTeammate: Story = {
  name: 'Remove teammate',
  args: {
    title: 'Remove from store?',
    message: 'Jordan Lee will lose access to this store.',
    variant: 'destructive',
    confirmLabel: 'Remove',
  },
}

export const RevokeInvitation: Story = {
  name: 'Revoke invitation',
  args: {
    title: 'Revoke invitation?',
    message: 'jordan.lee@example.com will no longer be able to accept this invitation.',
    variant: 'destructive',
    confirmLabel: 'Revoke',
  },
}

export const DeleteRole: Story = {
  name: 'Delete role',
  args: {
    title: 'Delete role',
    message: 'Delete the role "Unused role"? This action cannot be undone.',
    variant: 'destructive',
    confirmLabel: 'Delete',
  },
}
