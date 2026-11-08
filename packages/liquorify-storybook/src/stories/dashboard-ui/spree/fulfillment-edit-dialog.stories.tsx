import { FulfillmentEditDialog } from '@spree/dashboard-ui/spree/fulfillment-edit-dialog'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'

const originOptions = [
  { value: 'sloc_4Rt6Yu8I', label: 'Shop location' },
  { value: 'sloc_2Wq5Er7T', label: 'East coast depot' },
  { value: 'sloc_9Op1As3D', label: 'Downtown counter — Out of stock' },
]
const rateOptions = [
  { value: 'dr_2St7Hk4q', label: 'Standard — $8.00' },
  { value: 'dr_3Ex8Jl5r', label: 'Express — $15.00' },
  { value: 'dr_4Fr9Km6s', label: 'Free over $75 — Free' },
]

/**
 * Where a parcel ships from and which priced service carries it. Rates are
 * quoted for an origin, so picking another one stands the method down until
 * the move is saved and the parcel re-quoted. Each panel labels its own
 * options and owns its writes.
 */
const meta = {
  title: 'Dashboard UI/Composed/Fulfillment edit dialog',
  component: FulfillmentEditDialog,
  tags: ['CMP-DUI-C-24'],
  args: {
    open: true,
    onOpenChange: fn(),
    originOptions,
    rateOptions,
    currentOriginId: 'sloc_4Rt6Yu8I',
    currentRateId: 'dr_2St7Hk4q',
    onSubmit: fn(async () => 'done' as const),
  },
  // The dialog renders outside the story's root, over the whole window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof FulfillmentEditDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'Edit fulfillment' })
  },
}

export const OriginList: Story = {
  name: 'Origin list open',
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Ships from' }))
    await screen.findByRole('option', { name: 'Downtown counter — Out of stock' })
  },
}

export const MethodList: Story = {
  name: 'Method list open',
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Delivery method' }))
    await screen.findByRole('option', { name: 'Free over $75 — Free' })
  },
}

// A new origin is picked: the methods quoted for the old one stand down.
export const OriginMoved: Story = {
  name: 'Origin moved',
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Ships from' }))
    await userEvent.click(await screen.findByRole('option', { name: 'East coast depot' }))
    await screen.findByRole('button', { name: 'Move and re-quote' })
  },
}

export const NoRates: Story = {
  name: 'No rates',
  args: { rateOptions: [], currentRateId: '' },
  play: async () => {
    await screen.findByText('No delivery methods are quoted for this fulfillment.')
  },
}

// Freight waits on the forwarder's quote, which is not the same as free.
export const QuotedAfterReview: Story = {
  name: 'Quoted after review',
  args: {
    rateOptions: [{ value: 'dr_5Pf1Ln7t', label: 'Pallet freight — Quoted after review' }],
    currentRateId: 'dr_5Pf1Ln7t',
  },
}

export const NoOrigin: Story = {
  name: 'No origin',
  args: { currentOriginId: '', currentRateId: '' },
}

export const Saving: Story = {
  args: { pending: true },
}
