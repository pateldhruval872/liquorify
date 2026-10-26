import { SpreeError } from '@spree/admin-sdk'
import { AddressFormDialog, stockLocationToEditableAddress } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { storeParameters, withStore } from '../../decorators/store'
import { addressedLocation, shopLocation } from '../../fixtures/admin/settings'
import { countries } from '../../mocks/handlers/admin/countries'

const nothing = () => {}

const meta = {
  title: 'Dashboard core/Address form dialog',
  component: AddressFormDialog,
  tags: ['CMP-CORE-01'],
  decorators: [withStore],
  // The store address task on the getting started page (DA-HOME-02) opens it
  // for the store's own location: a business address, in the store's country.
  args: {
    open: true,
    onOpenChange: nothing,
    onSave: nothing,
    business: true,
    title: 'Add your shipping address',
    address: stockLocationToEditableAddress(shopLocation),
  },
  parameters: {
    ...storeParameters(),
    liquorify: { ...storeParameters().liquorify, capture: 'viewport' },
    msw: { handlers: { ...storeParameters().msw.handlers, countries } },
  },
} satisfies Meta<typeof AddressFormDialog>

export default meta
type Story = StoryObj<typeof meta>

const save = () => userEvent.click(screen.getByRole('button', { name: 'Save' }))

// Nothing given yet: the country comes from the location, with its states to pick from.
export const NoAddressYet: Story = {
  name: 'No address yet',
  play: async () => {
    await screen.findByRole('combobox', { name: 'State / Province' })
  },
}

export const AddressGiven: Story = {
  name: 'Address given',
  args: { address: stockLocationToEditableAddress(addressedLocation) },
  play: async () => {
    await screen.findByDisplayValue('410 Market Street')
  },
}

// A business address needs the company; the street, city and postal code are required too.
export const Required: Story = {
  play: async () => {
    await screen.findByRole('combobox', { name: 'State / Province' })
    await save()
    await waitFor(() =>
      expect(screen.getByLabelText('Company')).toHaveAttribute('aria-invalid', 'true'),
    )
  },
}

// A country without listed states takes the region as text.
export const RegionAsText: Story = {
  name: 'Region as text',
  args: { address: { ...stockLocationToEditableAddress(shopLocation), country_code: 'IE' } },
  play: async () => {
    await screen.findByRole('textbox', { name: 'State / Province' })
  },
}

// A customer's address book: a person's name, a label and the default flags.
export const PersonWithLabel: Story = {
  name: 'Person, with label and defaults',
  args: {
    business: false,
    showLabel: true,
    showDefaultFlags: true,
    title: 'Add address',
    address: null,
  },
}

// Spree refuses a postal code that does not fit the country, in its own words.
export const Refused: Story = {
  args: {
    business: false,
    title: 'Edit Address',
    address: {
      first_name: 'Jordan',
      last_name: 'Lee',
      address1: '18 Hill Street',
      city: 'Austin',
      postal_code: 'ABCDE',
      country_code: 'US',
      state_code: 'TX',
    },
    onSave: () => {
      throw new SpreeError(
        {
          error: {
            code: 'validation_error',
            message: 'Postal code is invalid',
            details: { postal_code: [{ code: 'invalid', message: 'is invalid', specific: false }] },
          },
        },
        422,
      )
    },
  },
  play: async () => {
    await screen.findByDisplayValue('ABCDE')
    await save()
    await waitFor(() =>
      expect(screen.getByLabelText('Postal code')).toHaveAttribute('aria-invalid', 'true'),
    )
  },
}
