import { Tooltip, TooltipContent, TooltipTrigger } from '@spree/dashboard-ui/ui/tooltip'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps, ReactNode } from 'react'

type Props = Pick<ComponentProps<typeof TooltipContent>, 'side' | 'align' | 'className'> & {
  trigger: string
  content: ReactNode
}

// Opened from a small text trigger, as the roles page opens the rest of a
// role's permissions from its "+4 more" count (DA-SET-25).
function Example({ trigger, content, ...props }: Props) {
  return (
    <div className="flex h-56 w-[28rem] items-center justify-center">
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="cursor-help rounded-sm text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            {trigger}
          </button>
        </TooltipTrigger>
        <TooltipContent {...props}>{content}</TooltipContent>
      </Tooltip>
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Tooltip',
  component: Example,
  tags: ['CMP-DUI-P-46'],
  args: { trigger: 'in 14 days', content: 'Nov 5, 2026, 9:00:00 AM' },
  // The tooltip renders outside the story's root.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof Example>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Bottom: Story = { args: { side: 'bottom' } }

export const AlignedToStart: Story = { name: 'Aligned to start', args: { align: 'start' } }

export const List: Story = {
  args: {
    trigger: '+4 more',
    className: 'max-w-xs',
    content: (
      <ul>
        <li>Manage Refunds</li>
        <li>Manage Gift cards</li>
        <li>Manage Store credits</li>
        <li>View Customers</li>
      </ul>
    ),
  },
}

// The default width, 200 pixels, wraps a sentence such as a delivery method's
// carrier-priced hint; that screen widens it with `max-w-xs`.
export const Wrapping: Story = {
  args: {
    trigger: 'Calculated',
    content: 'Prices come from EasyPost at checkout, quoted live for each order.',
  },
}
