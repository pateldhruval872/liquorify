import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  CreditCardIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  InfoIcon,
  XCircleIcon,
} from '@spree/dashboard-ui/icons'
import { StatusDot } from '@spree/dashboard-ui/ui/badge'
import { Button } from '@spree/dashboard-ui/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@spree/dashboard-ui/ui/dropdown-menu'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'

/** The order's payment row actions. */
function PaymentActions({ open, disabled }: { open?: boolean; disabled?: boolean }) {
  return (
    <div className="flex w-[32rem] justify-end">
      <DropdownMenu defaultOpen={open}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs">
            <EllipsisVerticalIcon className="size-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <InfoIcon className="size-4" />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="#gateway">
              <ExternalLinkIcon className="size-4" />
              View at Stripe
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem disabled={disabled}>
            <CreditCardIcon className="size-4" />
            Capture
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive">
            <XCircleIcon className="size-4" />
            Void
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

const sortColumns = [
  { key: 'number', label: 'Number' },
  { key: 'completed_at', label: 'Date' },
  { key: 'total', label: 'Total' },
]

const meta = {
  title: 'Dashboard UI/Primitives/Dropdown menu',
  component: DropdownMenu,
  tags: ['CMP-DUI-P-21'],
  // The menu renders outside the story's root.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {
  render: () => <PaymentActions />,
}

export const Actions: Story = {
  render: () => <PaymentActions open />,
}

export const DisabledItem: Story = {
  name: 'Disabled item',
  render: () => <PaymentActions open disabled />,
}

/** Opened from the keyboard, which highlights the first item. */
export const Highlighted: Story = {
  render: () => <PaymentActions />,
  play: async () => {
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('menuitem', { name: 'View details' })
  },
}

export const DestructiveHighlighted: Story = {
  name: 'Destructive highlighted',
  render: () => <PaymentActions open />,
  play: async () => {
    await userEvent.hover(await screen.findByRole('menuitem', { name: 'Void' }))
  },
}

/** The table toolbar's quick status filter. */
export const Checkboxes: Story = {
  render: () => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <span className="text-muted-foreground">Payment</span>
          <span className="tabular-nums">2/4</span>
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        {statuses.map((status, index) => (
          <DropdownMenuCheckboxItem key={status.value} checked={index < 2}>
            <StatusDot status={status.value} />
            {status.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

/** The table toolbar's sort menu. */
export const RadioGroups: Story = {
  name: 'Radio groups',
  render: () => (
    <div className="flex w-[32rem] justify-end">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Sort">
            <ArrowUpDownIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup defaultValue="completed_at">
            {sortColumns.map((column) => (
              <DropdownMenuRadioItem key={column.key} value={column.key}>
                {column.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Order</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup defaultValue="desc">
            <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
}
