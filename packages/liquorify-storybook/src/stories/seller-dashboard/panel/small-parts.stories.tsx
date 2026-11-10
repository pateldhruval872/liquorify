import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CenteredMessage } from '../../../../../seller-dashboard/src/components/centered-message'
import { ReadRow } from '../../../../../seller-dashboard/src/components/read-row'
import { RetryableError } from '../../../../../seller-dashboard/src/components/retryable-error'
import { panelParameters } from '../seller-panel'

/** The panel's small shared parts: a labelled value, and its full-page loading and error states. */
const meta = {
  title: 'Seller panel/Panel/Read row',
  component: ReadRow,
  tags: ['CMP-SP-G-03'],
  args: { label: 'Payment total', children: '$48.50' },
  parameters: panelParameters({ column: 'inSidebarCard' }),
} satisfies Meta<typeof ReadRow>

export default meta
type Story = StoryObj<typeof meta>

export const WithValue: Story = { name: 'Read row, with a value' }

export const NotProvided: Story = { name: 'Read row, not provided', args: { children: null } }

export const Message: Story = {
  name: 'Centered message',
  parameters: panelParameters({}),
  render: () => <CenteredMessage>Loading…</CenteredMessage>,
}

export const Retry: Story = {
  name: 'Retryable error',
  parameters: panelParameters({}),
  render: () => <RetryableError onRetry={fn()} />,
}
