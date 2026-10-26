import { Button } from '@spree/dashboard-ui'
import { PlusIcon, RotateCcwIcon } from '@spree/dashboard-ui/icons'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@spree/dashboard-ui/ui/data-table'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SettingsListCard } from '../../../../../dashboard/src/components/spree/settings-list-card'
import { claimReasons } from '../../../fixtures/admin/settings'

/** The rows the reasons page puts in the card: a name and whether it is offered. */
function ReasonRows() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {claimReasons.map((reason) => (
          <TableRow key={reason.id}>
            <TableCell className="font-medium">{reason.name}</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// A short list in a card, as the reasons page (DA-SET-21) shows each kind.
const meta = {
  title: 'Admin dashboard/Reasons/Settings list card',
  component: SettingsListCard,
  tags: ['CMP-DA-G-24'],
  args: {
    title: 'Claim reasons',
    description: 'What went wrong with a delivery — damaged, missing or wrong item.',
    action: (
      <Button size="sm">
        <PlusIcon className="size-4" />
        Add reason
      </Button>
    ),
    isLoading: false,
    isError: false,
    isEmpty: false,
    emptyIcon: <RotateCcwIcon />,
    emptyTitle: 'No reasons yet',
    children: <ReasonRows />,
  },
  parameters: { liquorify: { column: 'settings' } },
} satisfies Meta<typeof SettingsListCard>

export default meta
type Story = StoryObj<typeof meta>

export const Rows: Story = {}

export const Empty: Story = { args: { isEmpty: true } }

export const Loading: Story = { args: { isLoading: true } }

// A failed request is not shown as an empty list.
export const Failed: Story = { args: { isError: true } }

// Someone who may not add reasons sees no button.
export const WithoutAction: Story = { name: 'Without action', args: { action: undefined } }
