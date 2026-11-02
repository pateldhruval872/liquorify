import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, screen, userEvent } from 'storybook/test'
import { ProviderSettingsFields } from '../../../../../dashboard/src/components/spree/products/provider-settings-fields'
import { regionalPool } from './provider-settings'

/**
 * The fields a digital file's source declares, one for each setting, labelled
 * with the setting's own key, at the width of the sheets that hold them.
 *
 * The on/off setting's switch stretches across the rest of its row: its field
 * is laid out as a row, but keeps the column layout's rule that widens every
 * child to the full width. This looks like a Spree defect. No source Spree
 * ships declares an on/off setting, so the running dashboard cannot show it.
 */
function SettingsFields({ initial }: { initial: Record<string, unknown> }) {
  const [values, setValues] = useState(initial)
  return (
    <div className="flex w-[350px] flex-col gap-6 text-sm">
      <ProviderSettingsFields
        schema={regionalPool.settings_schema}
        values={values}
        onChange={setValues}
      />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Products/Provider settings fields',
  component: SettingsFields,
  tags: ['CMP-DA-G-14'],
  args: { initial: {} },
} satisfies Meta<typeof SettingsFields>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Filled: Story = {
  args: {
    initial: {
      pool_name: 'glazing-course-keys',
      region: 'eu',
      auto_revoke: true,
      keys_per_order: 2,
    },
  },
}

export const ChoosingRegion: Story = {
  name: 'Choosing from a list',
  args: { initial: { region: 'us' } },
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: 'eu' })
  },
}

// A number left empty stays unset rather than saving zero.
export const NumberCleared: Story = {
  name: 'A number cleared',
  args: { initial: { keys_per_order: 1 } },
  play: async () => {
    const field = screen.getByLabelText('keys_per_order')
    await userEvent.clear(field)
    await expect(field).toHaveValue(null)
  },
}
