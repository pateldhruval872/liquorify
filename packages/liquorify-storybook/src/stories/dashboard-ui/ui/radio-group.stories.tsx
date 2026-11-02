import { Field, FieldLabel } from '@spree/dashboard-ui/ui/field'
import { RadioGroup, RadioGroupItem } from '@spree/dashboard-ui/ui/radio-group'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { userEvent } from 'storybook/test'

const options = [
  { value: 'all', label: 'All customers' },
  { value: 'subscribed', label: 'Customers subscribed to email' },
  { value: 'none', label: 'Nobody', disabled: true },
]

function Audience(props: ComponentProps<typeof RadioGroup>) {
  return (
    <RadioGroup {...props}>
      {options.map((option) => (
        <Field key={option.value} orientation="horizontal" data-disabled={option.disabled}>
          <RadioGroupItem id={option.value} value={option.value} disabled={option.disabled} />
          <FieldLabel htmlFor={option.value} className="font-normal">
            {option.label}
          </FieldLabel>
        </Field>
      ))}
    </RadioGroup>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Radio group',
  component: Audience,
  tags: ['CMP-DUI-P-32'],
} satisfies Meta<typeof Audience>

export default meta
type Story = StoryObj<typeof meta>

export const NoneSelected: Story = { name: 'None selected' }

export const Selected: Story = { args: { defaultValue: 'subscribed' } }

export const Disabled: Story = { args: { defaultValue: 'all', disabled: true } }

export const FocusVisible: Story = {
  name: 'Focus visible',
  args: { defaultValue: 'all' },
  play: async () => {
    await userEvent.tab()
  },
}
