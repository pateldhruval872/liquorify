import { ClaimResolveDialog } from '@spree/dashboard-ui/spree/claim-resolve-dialog'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent, within } from 'storybook/test'

const mugLine = { id: 'cli_2Mg8Cu7s', label: 'Clay mug', quantity: 1, sendReplacement: false }
const apronLine = {
  id: 'cli_3Ap9Dv8t',
  label: 'Linen apron',
  quantity: 1,
  sendReplacement: false,
}

/**
 * Settles a claim once the facts are in: money back, by store credit or the
 * original payment, a replacement for chosen lines, or both. The dialog says
 * when there is nothing to refund or nothing to replace, rather than let the
 * server refuse it.
 */
const meta = {
  title: 'Dashboard UI/Composed/Claim resolve dialog',
  component: ClaimResolveDialog,
  tags: ['CMP-DUI-C-08'],
  args: {
    lines: [mugLine],
    defaultAmount: '25.92',
    currencySymbol: '$',
    onClose: fn(),
    onSubmit: fn(),
  },
  // The dialog renders outside the story's root, over the whole window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof ClaimResolveDialog>

export default meta
type Story = StoryObj<typeof meta>

const chooseResolution = async (name: string) => {
  await userEvent.click(await screen.findByRole('combobox', { name: 'How to resolve' }))
  await userEvent.click(await screen.findByRole('option', { name }))
}

export const Refund: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'Resolve claim' })
  },
}

export const Resolutions: Story = {
  name: 'Resolutions open',
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'How to resolve' }))
    await screen.findByRole('option', { name: 'Refund and replacement' })
  },
}

export const RefundToOriginalPayment: Story = {
  name: 'Refund, to the original payment',
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Refund to' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Original payment' }))
  },
}

// Settled for less than the claim asked.
export const PartRefund: Story = {
  name: 'Refund, part of the amount',
  play: async () => {
    const amount = await screen.findByRole('spinbutton', { name: 'Refund amount' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '15.00')
  },
}

// Nothing to refund, so Resolve waits for an amount.
export const NothingToRefund: Story = {
  name: 'Nothing to refund',
  args: { defaultAmount: '0.00' },
}

// No line is chosen for a replacement, so Resolve waits for one.
export const Replacement: Story = {
  play: async () => {
    await chooseResolution('Replacement')
    await screen.findByText('Send a replacement for')
  },
}

// The claim asked for the mug to be replaced, so its switch starts on.
export const ReplacementAsked: Story = {
  name: 'Replacement, as the claim asked',
  args: { lines: [{ ...mugLine, sendReplacement: true }, apronLine], defaultAmount: '66.96' },
  play: async () => {
    await chooseResolution('Replacement')
    const dialog = await screen.findByRole('dialog')
    await within(dialog).findByRole('switch', { name: 'Linen apron' })
  },
}

export const RefundAndReplacement: Story = {
  name: 'Refund and replacement',
  args: { lines: [{ ...mugLine, sendReplacement: true }, apronLine], defaultAmount: '66.96' },
  play: async () => {
    await chooseResolution('Refund and replacement')
    await screen.findByText('Send a replacement for')
  },
}

export const Saving: Story = {
  args: { pending: true },
}
