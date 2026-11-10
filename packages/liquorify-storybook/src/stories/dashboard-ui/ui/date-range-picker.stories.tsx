import { resolveDateRangePreset } from '@spree/dashboard-ui/lib/date-range-presets'
import { type DateRange, DateRangePicker } from '@spree/dashboard-ui/ui/date-range-picker'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, screen, userEvent, within } from 'storybook/test'

type Preset = '7d' | '30d' | 'ytd'

/**
 * The home page's period picker (DA-HOME-01), and the custom range of a
 * report's time range (DA-RPT-02): named ranges resolved in the store's
 * timezone, or two dates picked on a two-month calendar and applied. The
 * stories are captured on 1 October 2026, in a store on UTC, at the right
 * edge of a page as the home page places it.
 */
function Picker({ preset, from, to }: { preset?: Preset; from?: string; to?: string }) {
  const [value, setValue] = useState<DateRange>(() =>
    preset
      ? resolveDateRangePreset(preset, 'UTC')
      : { from: new Date(`${from}T00:00:00`), to: new Date(`${to}T00:00:00`) },
  )
  return (
    <div className="flex w-[64rem] justify-end">
      <DateRangePicker value={value} onChange={setValue} timezone="UTC" />
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Date range picker',
  component: Picker,
  tags: ['CMP-DUI-P-19'],
  args: { preset: '30d' },
} satisfies Meta<typeof Picker>

export default meta
type Story = StoryObj<typeof meta>

export const LastThirtyDays: Story = { name: 'Last 30 days' }

export const YearToDate: Story = { name: 'Year to date', args: { preset: 'ytd' } }

export const CustomRange: Story = {
  name: 'A custom range',
  args: { preset: undefined, from: '2026-09-07', to: '2026-09-20' },
}

/** The named ranges beside two months, the current one highlighted. */
export const Open: Story = {
  name: 'Open',
  parameters: { liquorify: { capture: 'viewport' } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Last 30 days/ }))
    await screen.findByRole('button', { name: 'Last 90 days' })
    await expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled()
  },
}

/**
 * A day after the range's start becomes its end, so the last 30 days turn
 * into 2 to 20 September, ready to apply. Once both ends are chosen, Apply
 * is never left waiting: a day before the start becomes the start, and the
 * start or end day clicked alone becomes a one-day range.
 */
export const ChoosingRange: Story = {
  name: 'Choosing a custom range',
  parameters: { liquorify: { capture: 'viewport' } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Last 30 days/ }))
    await userEvent.click(await screen.findByRole('button', { name: /September 20th, 2026/ }))
    await expect(
      screen.getByRole('button', { name: /September 20th, 2026, selected/ }),
    ).toBeInTheDocument()
    await expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled()
    // A mouse click leaves no focus ring on the day; the story's click does.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}
