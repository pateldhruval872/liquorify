import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ComponentProps, useState } from 'react'
import { screen } from 'storybook/test'
import { ScopePicker } from '../../../../../dashboard/src/components/spree/api-keys/api-key-scope-picker'
import { adminUser } from '../../../fixtures/admin/session'
import { staffManagerRules } from '../../../fixtures/admin/staff'
import { permissions, permissionsHeld } from '../../../mocks/handlers/admin/permissions'
import { adminSession } from '../../../mocks/handlers/admin/session'

// Holds the chosen scopes, as the create sheet's form does.
function Picker({ value: initial, ...props }: ComponentProps<typeof ScopePicker>) {
  const [value, setValue] = useState(initial)
  return <ScopePicker {...props} value={value} onChange={props.disabled ? undefined : setValue} />
}

const meta = {
  title: 'Admin dashboard/API keys/Scope picker',
  component: Picker,
  tags: ['CMP-DA-G-01'],
  // A secret key's scopes, at their width in the create sheet (DA-SET-26),
  // from a shorter catalog than Spree's so each state fits on one screen.
  args: { value: [] },
  parameters: {
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id },
    msw: { handlers: { session: adminSession(), permissions } },
  },
  decorators: [
    (Story) => (
      <div className="w-[566px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Picker>

export default meta
type Story = StoryObj<typeof meta>

const grid = async () => {
  await screen.findByRole('checkbox', { name: 'View Products' })
}

export const NothingChosen: Story = { name: 'Nothing chosen', play: grid }

export const ChosenScopes: Story = {
  name: 'Chosen scopes',
  args: { value: ['read_products', 'read_orders', 'write_orders'] },
  play: grid,
}

// The catch-alls cover every resource, so the grid below them is set aside.
export const FullAccess: Story = { name: 'Full access', args: { value: ['write_all'] }, play: grid }

export const ReadAll: Story = { name: 'Read all', args: { value: ['read_all'] }, play: grid }

// A staffer may grant only what their own role holds; the rest is offered
// disabled, and so are the catch-alls.
export const LimitedByTheReader: Story = {
  name: 'Limited by the reader',
  parameters: {
    msw: {
      handlers: {
        session: adminSession(staffManagerRules, ['read_products', 'read_orders', 'write_orders']),
      },
    },
  },
  play: grid,
}

// An existing key's scopes are fixed for its life, as its edit sheet shows them.
export const Fixed: Story = {
  args: { value: ['read_products', 'write_stock', 'read_orders'], disabled: true },
  play: grid,
}

export const Loading: Story = {
  parameters: { msw: { handlers: { permissions: permissionsHeld } } },
}
