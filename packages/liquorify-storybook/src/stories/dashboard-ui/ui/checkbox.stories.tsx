import { Checkbox } from '@spree/dashboard-ui/ui/checkbox'
import { Field, FieldLabel } from '@spree/dashboard-ui/ui/field'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { userEvent } from 'storybook/test'

// Labelled as the report builder labels its checkboxes.
function Labelled(props: ComponentProps<typeof Checkbox>) {
  return (
    <Field orientation="horizontal">
      <Checkbox id="compare" {...props} />
      <FieldLabel htmlFor="compare" className="font-normal">
        Compare with the previous period
      </FieldLabel>
    </Field>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Checkbox',
  component: Labelled,
  tags: ['CMP-DUI-P-11'],
} satisfies Meta<typeof Labelled>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {}

export const Checked: Story = { args: { defaultChecked: true } }

export const Indeterminate: Story = { args: { indeterminate: true } }

export const Disabled: Story = { args: { disabled: true } }

export const DisabledChecked: Story = {
  name: 'Disabled checked',
  args: { disabled: true, defaultChecked: true },
}

export const Invalid: Story = { args: { 'aria-invalid': true } }

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
  },
}
