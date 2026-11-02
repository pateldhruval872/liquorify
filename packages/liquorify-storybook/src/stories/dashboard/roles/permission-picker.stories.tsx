import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  allReadKeys,
  allWriteKeys,
  PermissionGrid,
} from '../../../../../dashboard/src/components/spree/permission-picker'
import {
  everyPermissionKey,
  orderManagerRole,
  staffPermissionCatalog,
} from '../../../fixtures/admin/staff'

const meta = {
  title: 'Admin dashboard/Roles/Permission picker',
  component: PermissionGrid,
  tags: ['CMP-DA-G-24'],
  args: { entries: staffPermissionCatalog, value: [] },
  // The width and text size the grid has inside the role sheet (DA-SET-25).
  decorators: [
    (Story) => (
      <div className="w-[566px] text-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PermissionGrid>

export default meta
type Story = StoryObj<typeof meta>

export const NothingGranted: Story = { name: 'Nothing granted' }

// Managing a resource includes viewing it, so each managed row's view box is
// checked and locked.
export const FromATemplate: Story = {
  name: 'From a template',
  args: { value: orderManagerRole.permissions },
}

export const ReadOnly: Story = {
  name: 'Read only',
  args: { value: allReadKeys(staffPermissionCatalog) },
}

export const FullAccess: Story = {
  name: 'Full access',
  args: { value: allWriteKeys(staffPermissionCatalog) },
}

// A staffer may grant only what their own roles hold; a staff manager's grid
// leaves every other key disabled.
export const LimitedByTheReader: Story = {
  name: 'Limited by the reader',
  args: {
    value: ['write_staff'],
    disabledKeys: new Set(
      everyPermissionKey.filter((key) => !['read_staff', 'write_staff'].includes(key)),
    ),
  },
}

// The admin role, which cannot be edited.
export const Disabled: Story = {
  args: { value: allWriteKeys(staffPermissionCatalog), disabled: true },
}
