import { LockIcon } from '@spree/dashboard-ui/icons'
import { RowActions } from '@spree/dashboard-ui/spree/row-actions'
import { Avatar, AvatarFallback } from '@spree/dashboard-ui/ui/avatar'
import { Badge } from '@spree/dashboard-ui/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@spree/dashboard-ui/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@spree/dashboard-ui/ui/data-table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@spree/dashboard-ui/ui/tooltip'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { screen, userEvent } from 'storybook/test'

const members = [
  { initials: 'AM', name: 'Alex Morgan', email: 'alex.morgan@example.com', roles: ['admin'] },
  { initials: 'JL', name: 'Jordan Lee', email: 'jordan.lee@example.com', roles: ['Support'] },
  {
    initials: 'PS',
    name: 'Priya Shah',
    email: 'priya.shah@example.com',
    roles: ['Order manager', 'Merchandiser'],
  },
]

const roles = [
  {
    name: 'Order manager',
    permissions: ['Manage Orders', 'Manage Payments', 'Manage Fulfillments'],
    more: ['Manage Refunds', 'Manage Gift cards', 'Manage Store credits', 'View Customers'],
    members: 2,
  },
  {
    name: 'Support',
    permissions: ['View Orders', 'View Customers', 'View Dashboard'],
    more: [],
    members: 3,
  },
  { name: 'admin', permissions: [], more: [], members: 1, locked: true },
]

// Laid out as the staff page's members card (DA-SET-24): a table filling the
// card, a member and role badges in each row, and the row's actions last.
function MembersTable(props: ComponentProps<typeof Table>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table {...props}>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.email}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-muted text-xs">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium text-foreground">{member.name}</span>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {member.roles.map((role) => (
                      <Badge key={role} className="capitalize" variant="info">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <RowActions actions={[{ key: 'edit', onSelect: () => {} }]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Laid out as the roles page's table (DA-SET-25), which fills the page column
// with no card header above it.
function RolesTable() {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.name} className="cursor-pointer">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 font-medium capitalize">
                      {role.name}
                      {role.locked && <LockIcon className="size-3.5 text-muted-foreground" />}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {role.locked ? (
                    <Badge>Full access</Badge>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1">
                      {role.permissions.map((permission) => (
                        <Badge key={permission} variant="outline">
                          {permission}
                        </Badge>
                      ))}
                      {role.more.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="cursor-help rounded-sm text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                            >
                              +{role.more.length} more
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <ul>
                              {role.more.map((permission) => (
                                <li key={permission}>{permission}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{role.members}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <RowActions actions={[{ key: 'edit', onSelect: () => {} }]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Data table',
  component: MembersTable,
  tags: ['CMP-DUI-P-17'],
  parameters: { liquorify: { column: 'settings' } },
} satisfies Meta<typeof MembersTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const HoveredRow: Story = {
  name: 'Hovered row',
  play: async () => {
    await userEvent.hover(await screen.findByText('Jordan Lee'))
  },
}

export const Roles: Story = { render: () => <RolesTable /> }
