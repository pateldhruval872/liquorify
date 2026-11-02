import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { VariantsOptionsBuilder } from '../../../../../dashboard-core/src/products/variants-options-builder'
import { withStore } from '../../../decorators/store'
import { colorOption, sizeOption } from '../../../fixtures/admin/catalog'
import { productParameters } from './product-form'

const color = {
  id: colorOption.id,
  name: 'color',
  label: 'Color',
  position: 1,
  values: [
    { name: 'olive', label: 'Olive' },
    { name: 'slate', label: 'Slate' },
  ],
}
const size = {
  id: sizeOption.id,
  name: 'size',
  label: 'Size',
  position: 2,
  values: [
    { name: 'm', label: 'M' },
    { name: 'l', label: 'L' },
  ],
}

// The option rows at the top of the variants card, from which the variants are built.
const meta = {
  title: 'Dashboard core/Product form/Variants options builder',
  component: VariantsOptionsBuilder,
  tags: ['CMP-CORE-PF-08'],
  args: { selected: [color, size], onChange: fn() },
  decorators: [withStore],
  parameters: productParameters({ column: 'inMainCard' }),
} satisfies Meta<typeof VariantsOptionsBuilder>

export default meta
type Story = StoryObj<typeof meta>

export const TwoOptions: Story = {
  name: 'Two options',
}

export const NoOptions: Story = {
  name: 'No options',
  args: { selected: [] },
}

// A product type's option arrives without values, and its picker opens on its own.
export const AwaitingValues: Story = {
  name: 'Awaiting values',
  args: { selected: [{ ...size, values: [] }] },
  play: async () => {
    await screen.findByRole('button', { name: 'Done' })
  },
}

export const EditingValues: Story = {
  name: 'Editing values',
  play: async () => {
    const [edit] = await screen.findAllByRole('button', { name: 'Edit' })
    await userEvent.click(edit)
    await screen.findByRole('button', { name: /Clay/ })
  },
}

export const AddingOption: Story = {
  name: 'Adding an option',
  args: { selected: [color] },
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add option' }))
    await screen.findByText('Option type')
  },
}

export const PickingOptionType: Story = {
  name: 'Picking an option type',
  args: { selected: [color] },
  parameters: productParameters({ viewport: true, column: 'inMainCard' }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add option' }))
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'Material' })
  },
}
