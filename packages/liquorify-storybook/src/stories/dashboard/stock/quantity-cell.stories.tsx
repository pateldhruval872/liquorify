import { Table, TableBody, TableHeader, TableRow } from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { screen, userEvent } from 'storybook/test'
import {
  QuantityCell,
  QuantityHead,
} from '../../../../../dashboard/src/components/spree/quantity-cell'

/**
 * A column of counted quantities with its header, as the receive card lays
 * out its accepted and rejected columns (DA-INV-04, DA-INV-08): the header,
 * a typed count and a read-only one share one right edge.
 */
function QuantityColumn({ editable, initial }: { editable: boolean; initial: number }) {
  const [value, setValue] = useState(initial)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <QuantityHead>Accepted</QuantityHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <QuantityCell
            editable={editable}
            value={value}
            min={0}
            label="Accepted"
            onChange={setValue}
          />
        </TableRow>
      </TableBody>
    </Table>
  )
}

const meta = {
  title: 'Admin dashboard/Stock/Quantity cell',
  component: QuantityColumn,
  tags: ['CMP-DA-G-24'],
  args: { editable: true, initial: 0 },
  parameters: { liquorify: { column: 'inMainCard' } },
} satisfies Meta<typeof QuantityColumn>

export default meta
type Story = StoryObj<typeof meta>

export const Editable: Story = {}

export const Typed: Story = {
  play: async () => {
    const field = await screen.findByRole('spinbutton', { name: 'Accepted' })
    await userEvent.clear(field)
    await userEvent.type(field, '12')
  },
}

export const ReadOnly: Story = {
  name: 'Read only',
  args: { editable: false, initial: 12 },
}
