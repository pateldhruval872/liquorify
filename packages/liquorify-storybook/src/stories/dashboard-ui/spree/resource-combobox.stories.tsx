import type { Category } from '@spree/admin-sdk'
import { ResourceCombobox } from '@spree/dashboard-ui/spree/resource-combobox'
import { Field, FieldLabel } from '@spree/dashboard-ui/ui/field'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, screen, userEvent } from 'storybook/test'
import { categories } from '../../../fixtures/admin/catalog'

/**
 * The search-driven single picker without its data layer: the caller narrows
 * the records as the merchant types, as the dashboard's own wrapper does for
 * the category page's parent field (DA-PRD-08, DA-PRD-09) and the catalog
 * audience's company field (DA-PRD-13, DA-PRD-14).
 */
function ParentPicker({
  initial,
  records = categories,
  disabled,
  footer,
}: {
  initial?: string
  records?: Category[]
  disabled?: boolean
  footer?: string
}) {
  const [value, setValue] = useState<string | undefined>(initial)
  const [query, setQuery] = useState('')
  const items = records.filter((record) =>
    record.pretty_name.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <Field>
      <FieldLabel htmlFor="parent-category">Parent category</FieldLabel>
      <ResourceCombobox<Category>
        id="parent-category"
        value={value}
        onChange={(id) => setValue(id)}
        items={items}
        onInputChange={setQuery}
        getOptionLabel={(record) => record.pretty_name}
        placeholder="Search categories…"
        emptyText="No categories found"
        disabled={disabled}
        listFooter={
          footer ? <p className="px-3 py-2 text-muted-foreground text-xs">{footer}</p> : undefined
        }
      />
    </Field>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Resource combobox',
  component: ParentPicker,
  tags: ['CMP-DUI-C-39'],
  parameters: { liquorify: { column: 'inMainCard' } },
} satisfies Meta<typeof ParentPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async () => {
    await expect(await screen.findByRole('combobox', { name: 'Parent category' })).toHaveValue('')
  },
}

export const Selected: Story = {
  args: { initial: categories[0].id },
  play: async () => {
    await expect(await screen.findByRole('combobox', { name: 'Parent category' })).toHaveValue(
      'Kitchen',
    )
  },
}

// The list is captured as the window, since it opens over the page.
export const Open: Story = {
  parameters: { liquorify: { column: 'inMainCard', capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Parent category' }))
    await screen.findByRole('option', { name: 'Apparel -> Aprons' })
  },
}

export const Searching: Story = {
  parameters: { liquorify: { column: 'inMainCard', capture: 'viewport' } },
  play: async () => {
    await userEvent.type(await screen.findByRole('combobox', { name: 'Parent category' }), 'kit')
    await screen.findByRole('option', { name: 'Kitchen -> Mugs' })
    await expect(screen.queryByRole('option', { name: 'Guides' })).toBeNull()
  },
}

export const NoResults: Story = {
  name: 'No results',
  parameters: { liquorify: { column: 'inMainCard', capture: 'viewport' } },
  play: async () => {
    await userEvent.type(await screen.findByRole('combobox', { name: 'Parent category' }), 'zz')
    await screen.findByText('No categories found')
  },
}

// A footer under the list, which a caller uses to say more records exist than it shows.
export const WithFooter: Story = {
  name: 'With footer',
  args: { footer: 'Showing 5 of 48. Keep typing to narrow the list.' },
  parameters: { liquorify: { column: 'inMainCard', capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Parent category' }))
    await screen.findByText(/Showing 5 of 48/)
  },
}

export const Picking: Story = {
  play: async () => {
    const input = await screen.findByRole('combobox', { name: 'Parent category' })
    await userEvent.click(input)
    await userEvent.click(await screen.findByRole('option', { name: 'Guides' }))
    await expect(input).toHaveValue('Guides')
  },
}

export const Disabled: Story = {
  args: { initial: categories[2].id, disabled: true },
  play: async () => {
    await expect(await screen.findByRole('combobox', { name: 'Parent category' })).toBeDisabled()
  },
}
