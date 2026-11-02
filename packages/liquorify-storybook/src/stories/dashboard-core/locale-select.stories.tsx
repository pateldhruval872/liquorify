import { LocaleSelect } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { storeParameters, withStore } from '../../decorators/store'
import { shellStore } from '../../fixtures/admin/shell'

const nothing = () => {}

interface PickerProps {
  value?: string | null
  invalid?: boolean
  disabled?: boolean
}

/** One of the store's languages, as a market's default language is picked. */
function OneLanguage({ value = 'en', invalid, disabled }: PickerProps) {
  return <LocaleSelect value={value} onChange={nothing} invalid={invalid} disabled={disabled} />
}

/** A market's languages: any the store can translate into, as chips. */
function SeveralLanguages({ value }: { value: string[] }) {
  return (
    <LocaleSelect
      multiple
      value={value}
      onChange={nothing}
      options={shellStore.available_locales}
    />
  )
}

const meta = {
  title: 'Dashboard core/Locale select',
  component: OneLanguage,
  tags: ['CMP-CORE-14'],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
    withStore,
  ],
  // The store's storefront speaks English and German.
  parameters: storeParameters(),
} satisfies Meta<typeof OneLanguage>

export default meta
type Story = StoryObj<typeof meta>

export const Selected: Story = {}

export const Placeholder: Story = { args: { value: null } }

export const Open: Story = {
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: /^DE/ })
  },
}

export const Invalid: Story = { args: { value: null, invalid: true } }

export const Disabled: Story = { args: { disabled: true } }

export const Several: Story = {
  render: () => <SeveralLanguages value={['en', 'de']} />,
}

export const SeveralOpen: Story = {
  name: 'Several, open',
  render: () => <SeveralLanguages value={['en', 'de']} />,
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: /^PL/ })
  },
}

export const NoneChosen: Story = {
  name: 'Several, none chosen',
  render: () => <SeveralLanguages value={[]} />,
}
