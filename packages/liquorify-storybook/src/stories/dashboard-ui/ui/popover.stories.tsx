import { CheckIcon, ChevronDownIcon } from '@spree/dashboard-ui/icons'
import { Badge } from '@spree/dashboard-ui/ui/badge'
import { Button } from '@spree/dashboard-ui/ui/button'
import { Input } from '@spree/dashboard-ui/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@spree/dashboard-ui/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@spree/dashboard-ui/ui/select'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'

const modes = [
  { value: 'set', label: 'Set to' },
  { value: 'adjust', label: 'Adjust by' },
]
const reasons = [
  { value: 'correction', label: 'Correction' },
  { value: 'count', label: 'Count' },
  { value: 'received', label: 'Received' },
]
const scopes = ['read_products', 'write_products', 'read_orders', 'write_orders', 'read_customers']

/** The stock table's count cell, which opens its popover. */
function CountTrigger({ value, ...props }: { value: number } & ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className="-mr-1.5 flex w-full cursor-pointer items-center justify-end gap-1 rounded-sm px-1.5 py-1 tabular-nums hover:bg-accent-strong/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:bg-accent-strong"
      {...props}
    >
      {value}
      <ChevronDownIcon className="size-3 text-muted-foreground" />
    </button>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Popover',
  component: Popover,
  tags: ['CMP-DUI-P-30'],
  args: { defaultOpen: true },
  // The popover renders outside the story's root.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

/** The stock table's on-hand count, edited in place. */
export const QuickEdit: Story = {
  name: 'Quick edit',
  render: (args) => (
    <div className="flex w-[40rem] justify-end">
      <div className="w-20">
        <Popover {...args}>
          <PopoverTrigger asChild>
            <CountTrigger value={24} aria-label="Edit on-hand count for Sand tee · M" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto">
            <form className="flex items-center gap-2">
              <Select items={modes} defaultValue="set">
                <SelectTrigger className="w-32" aria-label="How to change the count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step={1}
                min={0}
                defaultValue={24}
                aria-label="Amount"
                className="w-24 text-right tabular-nums"
                autoFocus
              />
              <Select items={reasons} defaultValue="correction">
                <SelectTrigger className="w-44" aria-label="Reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" size="icon" aria-label="Apply">
                <CheckIcon className="size-4" />
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  ),
}

/** The stock table's incoming count, with the two ways to add stock. */
export const Links: Story = {
  render: (args) => (
    <div className="flex w-[40rem] justify-end">
      <div className="w-20">
        <Popover {...args}>
          <PopoverTrigger asChild>
            <CountTrigger value={6} aria-label="Add incoming stock" />
          </PopoverTrigger>
          <PopoverContent align="end" className="flex w-auto flex-col gap-1 p-1">
            <a href="#transfer" className="rounded-md px-2 py-1 text-sm hover:bg-accent">
              Create transfer
            </a>
            <a href="#purchase-order" className="rounded-md px-2 py-1 text-sm hover:bg-accent">
              Create purchase order
            </a>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  ),
}

/** The API key table's scopes, where the overflow badge lists them all. */
export const ScopeList: Story = {
  name: 'Scope list',
  render: (args) => (
    <div className="flex flex-wrap items-center gap-1">
      {scopes.slice(0, 2).map((scope) => (
        <Badge key={scope} variant="secondary">
          {scope}
        </Badge>
      ))}
      <Popover {...args}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Show 3 more scopes"
          >
            <Badge variant="secondary" className="hover:bg-accent">
              +3
            </Badge>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto max-w-sm p-2">
          <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
            {scopes.map((scope) => (
              <Badge key={scope} variant="outline" className="self-start">
                {scope}
              </Badge>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
}

export const Closed: Story = {
  ...ScopeList,
  name: 'Closed',
  args: { defaultOpen: false },
}
