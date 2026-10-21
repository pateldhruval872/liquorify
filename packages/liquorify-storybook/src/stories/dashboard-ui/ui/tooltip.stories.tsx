import { InfoIcon, SearchIcon, XIcon } from '@spree/dashboard-ui/icons'
import { Badge } from '@spree/dashboard-ui/ui/badge'
import { Field, FieldLabel } from '@spree/dashboard-ui/ui/field'
import { Input } from '@spree/dashboard-ui/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@spree/dashboard-ui/ui/tooltip'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent } from 'storybook/test'

const minimumHelp =
  'The least a buyer may order of one product. An order below it is refused with the nearest valid quantities named — nothing is ever rounded up for them.'

/** The catalog terms card's field label, with its explanation behind an icon. */
function TermField({ open }: { open?: boolean }) {
  return (
    <div className="w-72 pt-28">
      <Field>
        <FieldLabel htmlFor="catalog-moq" className="flex items-center gap-1.5">
          Minimum order quantity
          <Tooltip defaultOpen={open}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="cursor-help rounded-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                aria-label={minimumHelp}
              >
                <InfoIcon className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{minimumHelp}</TooltipContent>
          </Tooltip>
        </FieldLabel>
        <Input id="catalog-moq" type="number" defaultValue={12} />
      </Field>
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Tooltip',
  component: Tooltip,
  tags: ['CMP-DUI-P-46'],
  args: { defaultOpen: true },
  // The tooltip renders outside the story's root.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

/** The image grid's remove button, at the default width of at most 200 pixels. */
export const Default: Story = {
  render: (args) => (
    <div className="pt-16 pl-16">
      <Tooltip {...args}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Remove image"
            className="flex size-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-xs"
          >
            <XIcon className="size-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Remove image</TooltipContent>
      </Tooltip>
    </div>
  ),
}

/** The delivery method list's carrier price, explained. */
export const Wrapped: Story = {
  render: (args) => (
    <div className="pt-24 pl-24">
      <Tooltip {...args}>
        <TooltipTrigger
          render={
            <span className="shrink-0 cursor-default text-sm underline decoration-dotted underline-offset-2">
              Carrier rates
            </span>
          }
        />
        <TooltipContent className="max-w-xs">
          Prices come from EasyPost at checkout, quoted live for each order.
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

export const Help: Story = {
  render: () => <TermField open />,
}

/** Opened by moving the keyboard focus to its trigger. */
export const Focused: Story = {
  args: { defaultOpen: false },
  render: () => <TermField />,
  play: async () => {
    await userEvent.tab()
  },
}

/** The roles table's overflow, listing the permissions not shown. */
export const List: Story = {
  render: (args) => (
    <div className="pt-24">
      <Tooltip {...args}>
        <TooltipTrigger asChild>
          <button type="button" className="text-sm text-muted-foreground underline">
            +3 more
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <ul>
            <li>Manage orders</li>
            <li>Manage customers</li>
            <li>View reports</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

/** The price list's tier badge, stacking a heading over a table. */
export const Block: Story = {
  render: (args) => (
    <div className="pt-32">
      <Tooltip {...args}>
        <TooltipTrigger asChild>
          <button type="button" className="cursor-help rounded-sm">
            <Badge variant="outline" className="font-normal">
              +2 tiers
            </Badge>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-none flex-col items-stretch gap-0 px-2.5 py-2 text-left">
          <p className="mb-1.5 whitespace-nowrap font-medium">What this list charges</p>
          <table className="text-xs tabular-nums">
            <tbody>
              {[
                ['From 1', '$24.00'],
                ['From 10', '$21.60'],
                ['From 50', '$19.20'],
              ].map(([quantity, price]) => (
                <tr key={quantity}>
                  <td className="whitespace-nowrap pr-4 text-muted-foreground">{quantity}</td>
                  <td className="whitespace-nowrap text-right">{price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

/** The collapsed sidebar's search button, labelled to its right. */
export const Right: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Search"
          className="flex size-8 items-center justify-center rounded-md"
        >
          <SearchIcon className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center">
        Search
      </TooltipContent>
    </Tooltip>
  ),
}
