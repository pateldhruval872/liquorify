import { TableBody, TableCell } from '@spree/dashboard-ui/ui/data-table'
import { Skeleton } from '@spree/dashboard-ui/ui/skeleton'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Dashboard UI/Primitives/Skeleton',
  component: Skeleton,
  tags: ['CMP-DUI-P-39'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Line: Story = { args: { className: 'h-4 w-48' } }

// A listing table's first page while it loads: one bar per row across every column.
export const Row: Story = {
  render: () => (
    <table className="w-[28rem]">
      <TableBody className="bg-card">
        {['first', 'second', 'third'].map((row) => (
          <tr key={row} className="last:*:border-b-0">
            <TableCell>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          </tr>
        ))}
      </TableBody>
    </table>
  ),
}
