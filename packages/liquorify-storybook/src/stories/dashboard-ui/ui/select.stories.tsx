import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@spree/dashboard-ui/ui/select'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { screen, userEvent } from 'storybook/test'

const sizes = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

type Props = ComponentProps<typeof Select> & {
  size?: 'sm' | 'default'
  invalid?: boolean
}

function SizeSelect({ size, invalid, ...props }: Props) {
  return (
    <div className="w-60">
      <Select items={sizes} {...props}>
        <SelectTrigger size={size} aria-label="Size" aria-invalid={invalid || undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sizes.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Select',
  component: SizeSelect,
  tags: ['CMP-DUI-P-35'],
  args: { defaultValue: 'medium' },
} satisfies Meta<typeof SizeSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Small: Story = { args: { size: 'sm' } }

export const Disabled: Story = { args: { disabled: true } }

export const Invalid: Story = { args: { invalid: true } }

export const Open: Story = {
  // Base UI renders the list outside the story's root, so the whole viewport
  // is captured.
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(screen.getByRole('combobox', { name: 'Size' }))
    await screen.findByRole('option', { name: 'Large' })
  },
}
