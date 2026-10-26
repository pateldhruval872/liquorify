import { Toaster } from '@spree/dashboard-ui/ui/toast'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { type ComponentProps, useState } from 'react'
import { screen, userEvent } from 'storybook/test'
import { StorefrontConnectSheet } from '../../../../../dashboard/src/components/spree/storefront-connect-sheet'
import { withStore } from '../../../decorators/store'
import { setUpStore } from '../../../fixtures/admin/settings'
import { shellStore } from '../../../fixtures/admin/shell'
import {
  storefrontKeyFailed,
  storefrontKeyHeld,
  storefrontRequests,
} from '../../../mocks/handlers/admin/settings'
import { taskParameters } from './task-frame'

const nothing = () => {}

const meta = {
  title: 'Admin dashboard/Getting started/Storefront connect sheet',
  component: StorefrontConnectSheet,
  tags: ['CMP-DA-G-24'],
  args: { store: shellStore, open: true, onOpenChange: nothing },
  decorators: [withStore],
  // The sheet renders outside the story's root, against the window's edge.
  parameters: {
    ...taskParameters({ storefront: storefrontRequests() }),
    liquorify: { ...taskParameters().liquorify, capture: 'viewport' },
  },
} satisfies Meta<typeof StorefrontConnectSheet>

export default meta
type Story = StoryObj<typeof meta>

// The dashboard's toaster, which the sheet reports a save or a refused address to.
const withToaster: Decorator = (Story) => (
  <>
    <Story />
    <Toaster />
  </>
)

const keyField = () => screen.findByLabelText('Show', { selector: 'button' })

// The key is hidden, and the store has no storefront address yet.
export const KeyHidden: Story = {
  name: 'Key hidden',
  play: async () => {
    await keyField()
  },
}

export const KeyShown: Story = {
  name: 'Key shown',
  play: async () => {
    await userEvent.click(await keyField())
    await screen.findByDisplayValue('sample-storefront-key')
  },
}

export const AddressSaved: Story = {
  name: 'Address already saved',
  args: { store: setUpStore },
  play: async () => {
    await screen.findByDisplayValue('https://shop.example.com')
  },
}

export const KeyLoading: Story = {
  name: 'Key loading',
  parameters: { msw: { handlers: { storefront: storefrontKeyHeld } } },
}

export const KeyFailed: Story = {
  name: 'Key failed',
  parameters: { msw: { handlers: { storefront: storefrontKeyFailed } } },
  play: async () => {
    await screen.findByText("Couldn't load your publishable API key.", undefined, {
      timeout: 15_000,
    })
  },
}

// An address that is not one is refused before anything is sent. The refusal is
// a toast, and toasts sit beneath the sheet's layer, so nothing shows over it.
export const NotAnAddress: Story = {
  name: 'Not an address',
  decorators: [withToaster],
  play: async () => {
    await keyField()
    await userEvent.type(screen.getByLabelText('Storefront URL'), 'https://')
    await userEvent.click(screen.getByRole('button', { name: 'Save & finish setup' }))
    await screen.findByText("This doesn't look like a valid storefront URL.")
  },
}

/** The sheet as the getting started page holds it open, so a save closes it. */
function OpenUntilSaved(args: ComponentProps<typeof StorefrontConnectSheet>) {
  const [open, setOpen] = useState(true)
  return <StorefrontConnectSheet {...args} open={open} onOpenChange={setOpen} />
}

// Saving closes the sheet and confirms the address in a toast.
export const Saved: Story = {
  decorators: [withToaster],
  render: (args) => <OpenUntilSaved {...args} />,
  play: async () => {
    await keyField()
    await userEvent.type(screen.getByLabelText('Storefront URL'), 'shop.example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Save & finish setup' }))
    await screen.findByText('Storefront URL saved: https://shop.example.com')
  },
}
