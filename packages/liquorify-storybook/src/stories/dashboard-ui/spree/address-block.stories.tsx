import { AddressBlock } from '@spree/dashboard-ui/spree/address-block'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Dashboard UI/Composed/Address block',
  component: AddressBlock,
  tags: ['CMP-DUI-C-01'],
  // The store's own address on the getting started page (DA-HOME-02), as the
  // store address task shows it once given: a business, without a person's name.
  args: {
    address: {
      full_name: null,
      company: 'Sample Store',
      address1: '410 Market Street',
      address2: 'Unit 2',
      city: 'San Francisco',
      state_text: 'CA',
      postal_code: '94111',
      country_code: 'US',
      country_name: 'United States',
      phone: '+1 415 555 0134',
    },
  },
} satisfies Meta<typeof AddressBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Business: Story = {}

// A person's address, as on an order, with a title naming which one it is.
export const Person: Story = {
  args: {
    title: 'Shipping address',
    address: {
      full_name: 'Jordan Lee',
      address1: '18 Rue des Martyrs',
      city: 'Paris',
      postal_code: '75009',
      country_code: 'FR',
      country_name: 'France',
    },
  },
}

export const NotProvided: Story = { name: 'Not provided', args: { address: null } }
