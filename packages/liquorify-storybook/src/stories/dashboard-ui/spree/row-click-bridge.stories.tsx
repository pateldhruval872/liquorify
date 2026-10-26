import { ResourceNameCell } from '@spree/dashboard-ui/spree/resource-name-cell'
import { useRowClickBridge } from '@spree/dashboard-ui/spree/row-click-bridge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@spree/dashboard-ui/ui/data-table'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@spree/dashboard-ui/ui/sheet'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { screen, userEvent } from 'storybook/test'
import { policies } from '../../../fixtures/admin/settings'

/**
 * The policies page (DA-SET-06): each row's name carries the policy's ID in a
 * data attribute, and the bridge opens that policy's sheet when any part of
 * the name is clicked. It draws nothing itself; the story shows the click.
 */
function PolicyRows() {
  const [openId, setOpenId] = useState<string | null>(null)
  useRowClickBridge('data-policy-id', setOpenId)
  const open = policies.find((policy) => policy.id === openId)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map((policy) => (
            <TableRow key={policy.id}>
              <TableCell>
                <ResourceNameCell
                  id={policy.id}
                  dataAttr="data-policy-id"
                  name={policy.name}
                  secondary={policy.slug}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Sheet open={!!open} onOpenChange={(next) => !next && setOpenId(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{open?.name}</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Row click bridge',
  component: PolicyRows,
  tags: ['CMP-DUI-C-46'],
  parameters: { liquorify: { column: 'settings' } },
} satisfies Meta<typeof PolicyRows>

export default meta
type Story = StoryObj<typeof meta>

export const Rows: Story = {}

export const RowOpened: Story = {
  name: 'Row opened',
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(screen.getByText('returns-policy'))
    await screen.findByRole('heading', { name: 'Returns Policy' })
  },
}
