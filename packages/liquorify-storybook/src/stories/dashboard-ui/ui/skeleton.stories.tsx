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

// A table row while it loads, as listing pages show it.
export const Row: Story = {
  render: () => (
    <div className="flex w-[28rem] items-center gap-3">
      <Skeleton className="size-10 rounded-md" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <Skeleton className="h-5 w-14" />
    </div>
  ),
}
