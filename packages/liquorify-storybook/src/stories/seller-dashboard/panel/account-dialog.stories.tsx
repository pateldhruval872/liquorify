import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { AccountDialog } from '../../../../../seller-dashboard/src/components/account-dialog'
import {
  sellerReadFailed,
  sellerReadHeld,
  sellerWriteHeld,
} from '../../../mocks/handlers/seller/panel'
import { panelParameters } from '../seller-panel'

const dialog = (first = sellerReadHeld('me').slice(0, 0)) =>
  panelParameters({ viewport: true, first })

/** The signed-in person's own name, photo and panel language (SP-OVL-02). */
const meta = {
  title: 'Seller panel/Panel/Account dialog',
  component: AccountDialog,
  tags: ['CMP-SP-G-03'],
  args: { open: true, onOpenChange: fn() },
  parameters: dialog(),
} satisfies Meta<typeof AccountDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async () => {
    await screen.findByLabelText('First name')
  },
}

export const Loading: Story = { parameters: dialog(sellerReadHeld('me')) }

export const LoadFailed: Story = {
  name: 'Could not load',
  parameters: dialog(sellerReadFailed('me')),
  // The dialog's query retries a failed read before it gives up, so the
  // message takes several seconds to show.
  play: async () => {
    await screen.findByText("Couldn't load your profile", {}, { timeout: 15_000 })
  },
}

export const Languages: Story = {
  name: 'Choosing a language',
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Language' }))
    await screen.findByRole('option', { name: /English/ })
  },
}

export const Saving: Story = {
  parameters: dialog(sellerWriteHeld('me')),
  play: async () => {
    await userEvent.type(await screen.findByLabelText('Last name'), '-Reyes')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  },
}
