import { ColorPicker } from '@spree/dashboard-ui/spree/color-picker'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { screen, userEvent } from 'storybook/test'

/**
 * A colour value's swatch in the option type sheet (DA-PRD-05), at the sheet's
 * text, where it sits in the values table's last column, compact, with its
 * panel opening leftwards.
 * The value is held as the sheet's form holds it.
 */
function ValueColor({
  initial,
  invalid,
  compact = true,
}: {
  initial: string | null
  invalid?: boolean
  compact?: boolean
}) {
  const [value, setValue] = useState<string | null>(initial)
  return (
    <div className="flex items-start justify-end text-sm" style={{ width: 320, minHeight: 360 }}>
      <ColorPicker
        value={value}
        onChange={setValue}
        aria-invalid={invalid}
        compact={compact}
        panelAlign="end"
      />
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Color picker',
  component: ValueColor,
  tags: ['CMP-DUI-C-09'],
  args: { initial: '#B07056' },
} satisfies Meta<typeof ValueColor>

export default meta
type Story = StoryObj<typeof meta>

export const Chosen: Story = {}

export const NoColor: Story = {
  name: 'No color',
  args: { initial: null },
}

export const Open: Story = {
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Change color (#B07056)' }))
    await screen.findByRole('dialog', { name: 'Pick a color' })
  },
}

export const OpenWithNoColor: Story = {
  name: 'Open, with no color',
  args: { initial: null },
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Pick a color' }))
    await screen.findByText('No color')
  },
}

// Typing a valid hex code moves the swatch; an invalid one is kept as typed and not applied.
export const Typed: Story = {
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Change color (#B07056)' }))
    const input = await screen.findByPlaceholderText('#000000')
    await userEvent.clear(input)
    await userEvent.type(input, '#708238{Enter}')
    await screen.findByRole('button', { name: 'Change color (#708238)' })
  },
}

// The sheet marks a value whose code it refused; in the compact picker the code's field is in the panel.
export const Invalid: Story = {
  args: { initial: null, invalid: true },
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Pick a color' }))
    await screen.findByText('No color')
  },
}
