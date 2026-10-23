import { Badge } from '@spree/dashboard-ui/ui/badge'
import { Button } from '@spree/dashboard-ui/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@spree/dashboard-ui/ui/popover'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps, ReactNode } from 'react'

type Props = Pick<ComponentProps<typeof PopoverContent>, 'side' | 'align' | 'className'> & {
  trigger: ReactNode
  content: ReactNode
}

function Example({ trigger, content, ...props }: Props) {
  return (
    // Room above the trigger, so a popover asked to open above it can.
    <div className="flex h-[28rem] w-[30rem] items-start justify-center pt-48">
      <Popover defaultOpen>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent {...props}>{content}</PopoverContent>
      </Popover>
    </div>
  )
}

const scopes = ['Read Products', 'Write Stock', 'Read Orders', 'Write Orders', 'Read Customers']

// The rest of a key's scopes, opened from its "+3" count on the API keys page
// (DA-SET-26).
const scopeList = (
  <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
    {scopes.map((scope) => (
      <Badge key={scope} variant="outline" className="self-start">
        {scope}
      </Badge>
    ))}
  </div>
)

const meta = {
  title: 'Dashboard UI/Primitives/Popover',
  component: Example,
  tags: ['CMP-DUI-P-30'],
  args: {
    trigger: (
      <button type="button" className="cursor-pointer rounded-md">
        <Badge variant="secondary">+3</Badge>
      </button>
    ),
    content: scopeList,
    align: 'start',
    className: 'w-auto max-w-sm p-2',
  },
  // The popover renders outside the story's root.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof Example>

export default meta
type Story = StoryObj<typeof meta>

export const ScopeList: Story = { name: 'Scope list' }

export const Centred: Story = { args: { align: 'center' } }

export const Above: Story = { args: { side: 'top' } }

// The table toolbar's Add filter panel opens from an outlined button, with no
// padding of its own.
export const FromAButton: Story = {
  name: 'From a button',
  args: {
    trigger: (
      <Button variant="outline" size="sm">
        Add filter
      </Button>
    ),
    className: 'w-80 p-0',
    content: (
      <div className="flex flex-col gap-1 p-3 text-sm">
        <span className="font-medium">Filter by</span>
        <span className="text-muted-foreground">Created at</span>
      </div>
    ),
  },
}
