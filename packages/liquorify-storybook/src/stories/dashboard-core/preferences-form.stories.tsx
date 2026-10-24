import { defaultPreferences, PreferencesForm } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ComponentProps, useState } from 'react'
import { relayIntegration, relayType } from '../../fixtures/admin/integrations'

// Holds the values the form reports, as the configure sheet does.
function Form({ values: initial, ...props }: ComponentProps<typeof PreferencesForm>) {
  const [values, setValues] = useState(initial)
  return (
    <div className="w-[566px] text-sm">
      <PreferencesForm {...props} values={values} onChange={setValues} />
    </div>
  )
}

const meta = {
  title: 'Dashboard core/Preferences form',
  component: Form,
  tags: ['CMP-CORE-22'],
  // An integration's settings in its configure sheet (DA-SET-10): text, a
  // secret, a number and a switch, each labelled from its key. At the width
  // and text size the sheet gives it.
  args: {
    schema: relayType.schema,
    values: defaultPreferences(relayType.schema),
    onChange: () => {},
  },
} satisfies Meta<typeof Form>

export default meta
type Story = StoryObj<typeof meta>

// A new connection starts from the defaults the type declares.
export const NewConnection: Story = { name: 'New connection' }

// A connected integration's saved settings, with the secret masked.
export const Saved: Story = { args: { values: relayIntegration.preferences } }
