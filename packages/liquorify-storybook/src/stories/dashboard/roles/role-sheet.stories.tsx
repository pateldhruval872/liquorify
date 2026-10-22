import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { RoleSheet } from '../../../../../dashboard/src/components/spree/role-sheet'
import { adminUser, fullAccess } from '../../../fixtures/admin/session'
import {
  adminRole,
  everyPermissionKey,
  orderManagerRole,
  staffManagerRole,
  staffManagerRules,
  staffViewerRules,
  supportRole,
} from '../../../fixtures/admin/staff'
import { adminSession } from '../../../mocks/handlers/admin/session'
import { roleRecordHeld, roleRecords, staffPermissions } from '../../../mocks/handlers/admin/staff'

const asAdmin = adminSession(fullAccess, everyPermissionKey)
const nothing = () => {}

const meta = {
  title: 'Admin dashboard/Roles/Role sheet',
  component: RoleSheet,
  tags: ['CMP-DA-G-24'],
  args: { open: true, onOpenChange: nothing },
  parameters: {
    // The sheet renders outside the story's root, against the window's edge.
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id, capture: 'viewport' },
    msw: { handlers: { session: asAdmin, permissions: staffPermissions, roles: roleRecords() } },
  },
} satisfies Meta<typeof RoleSheet>

export default meta
type Story = StoryObj<typeof meta>

// The grid draws once the catalog loads, and Save appears once the reader's
// own permissions do. Until then the sheet is read-only, and a template grants
// nothing, because it only grants what the reader holds.
const ready = async () => {
  await screen.findByRole('checkbox', { name: 'View Orders' })
  return screen.findByRole('button', { name: 'Save' })
}

export const NewRole: Story = {
  name: 'New role',
  play: async () => {
    await ready()
  },
}

export const FromATemplate: Story = {
  name: 'From a template',
  play: async () => {
    await ready()
    await userEvent.click(screen.getByRole('button', { name: 'Order manager' }))
  },
}

export const NameRequired: Story = {
  name: 'Name required',
  play: async () => {
    await userEvent.click(await ready())
    await screen.findByText('Name is required')
  },
}

export const Edit: Story = {
  args: { roleId: orderManagerRole.id },
  play: async () => {
    await ready()
    await screen.findByDisplayValue(orderManagerRole.name)
  },
}

export const Loading: Story = {
  args: { roleId: orderManagerRole.id },
  parameters: { msw: { handlers: { roles: roleRecordHeld } } },
}

export const Duplicate: Story = {
  args: { duplicateFromId: supportRole.id },
  play: async () => {
    await ready()
    await screen.findByDisplayValue(/Support/)
  },
}

// Spree's admin role, which nobody can edit.
export const ProtectedRole: Story = {
  name: 'Protected role',
  args: { roleId: adminRole.id },
  play: async () => {
    await screen.findByDisplayValue(adminRole.name)
  },
}

// A staffer who may read roles but not change them gets the same read-only
// sheet, labelled as protected.
export const ReadOnlyForAViewer: Story = {
  name: 'Read only for a viewer',
  args: { roleId: staffManagerRole.id },
  parameters: {
    msw: { handlers: { session: adminSession(staffViewerRules, ['read_staff']) } },
  },
  play: async () => {
    await screen.findByDisplayValue(staffManagerRole.name)
  },
}

// A staff manager may grant only the staff keys they hold themselves.
export const LimitedByTheReader: Story = {
  name: 'Limited by the reader',
  parameters: {
    msw: {
      handlers: { session: adminSession(staffManagerRules, ['read_staff', 'write_staff']) },
    },
  },
  play: async () => {
    await ready()
  },
}
