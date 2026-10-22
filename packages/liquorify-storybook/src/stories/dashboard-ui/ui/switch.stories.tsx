import { Field, FieldLabel } from '@spree/dashboard-ui/ui/field'
import { Switch } from '@spree/dashboard-ui/ui/switch'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { userEvent } from 'storybook/test'

function Labelled(props: ComponentProps<typeof Switch>) {
  return (
    <Field orientation="horizontal">
      <Switch id="pickup" {...props} />
      <FieldLabel htmlFor="pickup" className="font-normal">
        Offer store pickup
      </FieldLabel>
    </Field>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Switch',
  component: Labelled,
  tags: ['CMP-DUI-P-41'],
} satisfies Meta<typeof Labelled>

export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {}

export const On: Story = { args: { defaultChecked: true } }

export const Disabled: Story = { args: { disabled: true } }

export const DisabledOn: Story = {
  name: 'Disabled on',
  args: { disabled: true, defaultChecked: true },
}

export const FocusVisible: Story = {
  name: 'Focus visible',
  play: async () => {
    await userEvent.tab()
  },
}
