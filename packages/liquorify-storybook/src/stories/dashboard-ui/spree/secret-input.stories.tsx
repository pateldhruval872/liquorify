import { SecretInput } from '@spree/dashboard-ui/spree/secret-input'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ComponentProps, useState } from 'react'
import { screen, userEvent } from 'storybook/test'

// Holds the value the field reports, as the preferences form does.
function Field({ value: initial, ...props }: ComponentProps<typeof SecretInput>) {
  const [value, setValue] = useState<unknown>(initial)
  return (
    <div className="w-96">
      <SecretInput {...props} value={value} onChange={setValue} />
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Secret input',
  component: Field,
  tags: ['CMP-DUI-C-48'],
  // An integration's secret setting in its configure sheet (DA-SET-10).
  args: { id: 'preference-api_secret', label: 'Api Secret', value: '', onChange: () => {} },
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

// What is typed stays hidden until the eye is pressed.
export const Typed: Story = {
  play: async () => {
    await userEvent.type(screen.getByLabelText('Api Secret'), 'not-a-real-secret')
  },
}

export const Shown: Story = {
  play: async () => {
    await userEvent.type(screen.getByLabelText('Api Secret'), 'not-a-real-secret')
    await userEvent.click(screen.getByRole('button', { name: 'Show' }))
  },
}

// A stored secret comes back from the server masked, and shows as a badge
// with no way to reveal it.
export const Stored: Story = { args: { value: '••••0000' } }

export const Replacing: Story = {
  args: { value: '••••0000' },
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Replace' }))
  },
}
