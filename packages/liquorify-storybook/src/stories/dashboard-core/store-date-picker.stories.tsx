import { StoreDatePicker } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, screen, userEvent } from 'storybook/test'
import { storeParameters, withStore } from '../../decorators/store'
import { shellStore } from '../../fixtures/admin/shell'

/**
 * The date fields on part 1's screens, read and written in the store's time
 * zone whatever the admin's own is. The product list's date filter picks a
 * day from a calendar that opens beside it. The publishing card's dates
 * (DA-PRD-02, DA-PRD-03) and the variant sheet's pre-order date pick a day
 * and a time, and open beneath the field, since they sit inside a sheet; they
 * are drawn at the width a channel's row in the publishing card gives them.
 */
function DateField({
  initial = null,
  includeTime = false,
  inline = false,
  placeholder,
}: {
  initial?: string | null
  includeTime?: boolean
  inline?: boolean
  placeholder: string
}) {
  const [value, setValue] = useState<string | null>(initial)
  return (
    <div className="h-96" style={includeTime ? { width: 254 } : undefined}>
      <StoreDatePicker
        value={value}
        onChange={setValue}
        placeholder={placeholder}
        includeTime={includeTime}
        inline={inline}
      />
    </div>
  )
}

/** A store trading on New York time, so a stored instant reads in its zone. */
const newYork = { ...shellStore, timezone: 'America/New_York' }

const meta = {
  title: 'Dashboard core/Store date picker',
  component: DateField,
  tags: ['CMP-CORE-35'],
  args: { placeholder: 'Pick a date' },
  decorators: [withStore],
  parameters: {
    ...storeParameters(),
    liquorify: { ...storeParameters().liquorify, column: 'sidebar' },
  },
} satisfies Meta<typeof DateField>

export default meta
type Story = StoryObj<typeof meta>

export const DateEmpty: Story = {
  name: 'Date, empty',
}

export const DateChosen: Story = {
  name: 'Date, chosen',
  args: { initial: '2026-10-01' },
}

export const DateChoosing: Story = {
  name: 'Date, choosing',
  parameters: {
    liquorify: { ...storeParameters().liquorify, column: 'sidebar', capture: 'viewport' },
  },
  args: { initial: '2026-10-01' },
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: /October 1st, 2026/ }))
    await screen.findByRole('grid')
  },
}

export const DateAndTimeEmpty: Story = {
  name: 'Date and time, empty',
  args: { includeTime: true, inline: true, placeholder: 'Live immediately' },
}

export const DateAndTimeInTheStoresZone: Story = {
  name: "Date and time, in the store's zone",
  args: {
    includeTime: true,
    inline: true,
    placeholder: 'Never',
    initial: '2026-10-15T13:00:00.000Z',
  },
  parameters: { ...storeParameters(newYork) },
  play: async () => {
    await expect(await screen.findByText(/October 15th, 2026 9:00 AM/)).toBeVisible()
  },
}

export const DateAndTimeChoosing: Story = {
  name: 'Date and time, choosing',
  args: {
    includeTime: true,
    inline: true,
    placeholder: 'Never',
    initial: '2026-10-15T13:00:00.000Z',
  },
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: /October 15th, 2026/ }))
    await screen.findByRole('grid')
  },
}
