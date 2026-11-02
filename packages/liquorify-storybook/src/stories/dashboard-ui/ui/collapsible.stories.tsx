import { ChevronDownIcon, ChevronRightIcon } from '@spree/dashboard-ui/icons'
import { Card } from '@spree/dashboard-ui/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@spree/dashboard-ui/ui/collapsible'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ComponentProps, useState } from 'react'

const variants = [
  { name: 'Small / Sand', onHand: 14 },
  { name: 'Medium / Sand', onHand: 3 },
  { name: 'Large / Sand', onHand: 0 },
]

// A product's stock levels, grouped as the stock location page groups them.
function ProductGroup({ defaultOpen = false, ...props }: ComponentProps<typeof Collapsible>) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="w-[28rem] overflow-hidden py-0">
      <Collapsible open={open} onOpenChange={setOpen} {...props}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-accent">
          {open ? (
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">Linen shirt</div>
            <div className="truncate text-xs text-muted-foreground">3 variants · low stock</div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="border-t border-border-subtle text-sm">
            {variants.map((variant) => (
              <li key={variant.name} className="flex justify-between px-4 py-2">
                <span>{variant.name}</span>
                <span className="tabular-nums">{variant.onHand}</span>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Collapsible',
  component: ProductGroup,
  tags: ['CMP-DUI-P-13'],
} satisfies Meta<typeof ProductGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}

export const Open: Story = { args: { defaultOpen: true } }
