import { ScrollArea, ScrollBar } from '@spree/dashboard-ui/ui/scroll-area'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'

const countries = [
  'Australia',
  'Austria',
  'Belgium',
  'Canada',
  'Denmark',
  'Finland',
  'France',
  'Germany',
  'Ireland',
  'Italy',
  'Japan',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Spain',
  'Sweden',
  'Switzerland',
  'United Kingdom',
  'United States',
]

const meta = {
  title: 'Dashboard UI/Primitives/Scroll area',
  component: ScrollArea,
  tags: ['CMP-DUI-P-34'],
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

function Countries() {
  return (
    <ul className="p-3 text-sm">
      {countries.map((country) => (
        <li key={country} className="py-1">
          {country}
        </li>
      ))}
    </ul>
  )
}

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-48 w-56 rounded-md border">
      <Countries />
    </ScrollArea>
  ),
}

// The scrollbar shows only while the pointer is over the area.
export const Hovered: Story = {
  render: () => (
    <ScrollArea className="h-48 w-56 rounded-md border" data-testid="area">
      <Countries />
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByTestId('area'))
  },
}

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-80 rounded-md border">
      <div className="flex gap-3 p-3">
        {countries.slice(0, 10).map((country) => (
          <div
            key={country}
            className="flex h-16 w-28 shrink-0 items-center justify-center rounded-md border bg-muted text-sm"
          >
            {country}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
}
