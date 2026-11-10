import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { SellerAddressCard } from '../../../../../seller-dashboard/src/components/seller-address-card'
import { SellerBusinessCard } from '../../../../../seller-dashboard/src/components/seller-business-card'
import { newOrder } from '../../../fixtures/seller/orders'
import { profile } from '../../../fixtures/seller/profile'
import { panelParameters } from '../seller-panel'

const billed: typeof profile = {
  ...profile,
  billing_address: {
    ...newOrder.billing_address,
    id: 'addr_7Hn2Kq9Lw4',
    first_name: 'Ines',
    last_name: 'Carvalho',
    full_name: 'Ines Carvalho',
    company: 'Harbour Cask Company Ltd',
    address1: '2 Bonded Warehouse Row',
    address2: 'Unit 4',
    city: 'Portland',
    postal_code: '97209',
    phone: '5035550142',
  },
}

const card = (viewport = false) => panelParameters({ column: 'sidebar', viewport })

/** The seller's business details and billing address (SP-PRF-01). */
const meta = {
  title: 'Seller panel/Profile/Seller business card',
  component: SellerBusinessCard,
  tags: ['CMP-SP-G-03'],
  args: { profile },
  parameters: card(),
} satisfies Meta<typeof SellerBusinessCard>

export default meta
type Story = StoryObj<typeof meta>

export const Filled: Story = { name: 'Business details' }

export const Empty: Story = {
  name: 'Business details, not filled in',
  args: { profile: { ...profile, legal_name: null, registration_number: null } },
}

export const Editing: Story = {
  name: 'Business details, editing',
  parameters: card(true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    await screen.findByLabelText('Legal name')
  },
}

export const Address: Story = {
  name: 'Billing address',
  args: { profile: billed },
  render: (args) => <SellerAddressCard {...args} />,
}

export const NoAddress: Story = {
  name: 'Billing address, missing',
  render: (args) => <SellerAddressCard {...args} />,
}

export const AddressInOnboarding: Story = {
  name: 'Billing address, in the onboarding checklist',
  parameters: panelParameters({ page: 'onboarding', column: 'inMainCard' }),
  render: (args) => <SellerAddressCard {...args} headless />,
}

export const AddingAddress: Story = {
  name: 'Billing address, adding',
  parameters: card(true),
  render: (args) => <SellerAddressCard {...args} />,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /add address/i }))
    await screen.findByRole('dialog')
  },
}
