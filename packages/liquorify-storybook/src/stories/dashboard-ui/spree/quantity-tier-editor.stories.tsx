import {
  QuantityTierEditor,
  type QuantityTierEditorLabels,
  type QuantityTierRow,
} from '@spree/dashboard-ui/spree/quantity-tier-editor'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, screen, userEvent } from 'storybook/test'

/** The catalog pricing step's wording (DA-PRD-13, DA-PRD-14). */
const bandLabels: QuantityTierEditorLabels = {
  quantity: 'From quantity',
  value: 'Percentage',
  add: 'Add quantity tier',
  remove: 'Remove the tier from {quantity}',
  empty: 'No tiers — the percentage above applies at every quantity.',
  hint: 'From each quantity up, the agreement gives this percentage instead. Each tier is taken off the base price, never off the tier below it.',
}

const bands: QuantityTierRow[] = [
  { id: 'tier-1', minQuantity: '50', value: '20' },
  { id: 'tier-2', minQuantity: '200', value: '25' },
]

/**
 * The ladder as the catalog's pricing fields hold it: the rows live in the
 * caller's state, as they live in the catalog form, and the editor only
 * reports each change. Ten tiers is the most a price list takes.
 */
function TierLadder({
  initial,
  labels = bandLabels,
  valueAddon = '%',
  valueAddonAlign = 'inline-end',
  disabled,
  error,
}: {
  initial: QuantityTierRow[]
  labels?: QuantityTierEditorLabels
  valueAddon?: string
  valueAddonAlign?: 'inline-start' | 'inline-end'
  disabled?: boolean
  error?: string
}) {
  const [rows, setRows] = useState(initial)
  return (
    <QuantityTierEditor
      rows={rows}
      labels={labels}
      valueAddon={valueAddon}
      valueAddonAlign={valueAddonAlign}
      canAdd={!disabled && rows.length < 10}
      disabled={disabled}
      error={error}
      onChange={(id, field, next) =>
        setRows((current) =>
          current.map((row) => (row.id === id ? { ...row, [field]: next } : row)),
        )
      }
      onAdd={() =>
        setRows((current) => [
          ...current,
          { id: `tier-${current.length + 1}`, minQuantity: '', value: '' },
        ])
      }
      onRemove={(id) => setRows((current) => current.filter((row) => row.id !== id))}
    />
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Quantity tier editor',
  component: TierLadder,
  tags: ['CMP-DUI-C-37'],
  args: { initial: bands },
  // Beside the catalog's percentage, in the pricing card's main column.
  parameters: { liquorify: { column: 'inMainCard' } },
} satisfies Meta<typeof TierLadder>

export default meta
type Story = StoryObj<typeof meta>

export const Bands: Story = {
  play: async () => {
    await expect(await screen.findAllByRole('spinbutton', { name: 'From quantity' })).toHaveLength(
      2,
    )
  },
}

export const Empty: Story = {
  args: { initial: [] },
  play: async () => {
    await screen.findByText(/No tiers/)
  },
}

export const AddingTier: Story = {
  name: 'Adding a tier',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add quantity tier' }))
    await expect(screen.getAllByRole('spinbutton', { name: 'From quantity' })).toHaveLength(3)
  },
}

export const RemovingTier: Story = {
  name: 'Removing a tier',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Remove the tier from 200' }))
    await expect(screen.getAllByRole('spinbutton', { name: 'From quantity' })).toHaveLength(1)
  },
}

// At ten tiers the add button goes, so the cap shows before it is hit.
export const Full: Story = {
  args: {
    initial: Array.from({ length: 10 }, (_, index) => ({
      id: `tier-${index + 1}`,
      minQuantity: String((index + 1) * 25),
      value: String(10 + index),
    })),
  },
  play: async () => {
    await screen.findAllByRole('spinbutton', { name: 'Percentage' })
    await expect(screen.queryByRole('button', { name: 'Add quantity tier' })).toBeNull()
  },
}

// The catalog form's own check, shown under the rows in place of the hint.
export const Invalid: Story = {
  args: {
    initial: [
      { id: 'tier-1', minQuantity: '50', value: '20' },
      { id: 'tier-2', minQuantity: '50', value: '25' },
    ],
    error: 'Each tier needs its own quantity above 1.',
  },
  play: async () => {
    await screen.findByText('Each tier needs its own quantity above 1.')
  },
}

// A teammate who may view the catalog but not change it.
export const ReadOnly: Story = {
  name: 'Read only',
  args: { disabled: true },
  play: async () => {
    for (const input of await screen.findAllByRole('spinbutton')) await expect(input).toBeDisabled()
  },
}

/**
 * The editor's other shape: fixed price breaks, where the bottom rung is the
 * ordinary price, its quantity locked at one and never removable. No part 2
 * screen draws this shape yet; it is the component's own state.
 */
export const PriceBreaks: Story = {
  name: 'Price breaks',
  args: {
    initial: [
      { id: 'tier-1', minQuantity: '1', value: '24.00', locked: true },
      { id: 'tier-2', minQuantity: '12', value: '21.50' },
    ],
    labels: {
      quantity: 'From quantity',
      value: 'Price',
      add: 'Add price break',
      remove: 'Remove the break from {quantity}',
    },
    valueAddon: '$',
    valueAddonAlign: 'inline-start',
  },
  play: async () => {
    await screen.findByRole('button', { name: 'Remove the break from 12' })
    await expect(screen.queryByRole('button', { name: 'Remove the break from 1' })).toBeNull()
  },
}
