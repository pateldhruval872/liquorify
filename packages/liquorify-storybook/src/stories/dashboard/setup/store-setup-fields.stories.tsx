import type { SetupCountry } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { type Resolver, useForm } from 'react-hook-form'
import { screen, userEvent } from 'storybook/test'
import { AuthShell } from '../../../../../dashboard/src/components/spree/auth-shell'
import {
  StoreSetupFields,
  type StoreSetupValues,
} from '../../../../../dashboard/src/components/spree/store-setup-fields'
import { setupFormSchema } from '../../../../../dashboard/src/schemas/auth'
import { setupCountries } from '../../../fixtures/admin/settings'

const fields = ['store_name', 'country_code', 'locale', 'currency']

// First-run setup validates with its whole form's schema through
// react-hook-form's zod resolver, which this package does not depend on; this
// reports that schema's issues for these four fields the same way.
const resolver: Resolver<StoreSetupValues> = async (values) => {
  const result = setupFormSchema.safeParse(values)
  const errors: Record<string, { type: string; message: string }> = {}
  for (const issue of result.error?.issues ?? []) {
    const field = String(issue.path[0])
    if (fields.includes(field)) errors[field] ??= { type: issue.code, message: issue.message }
  }
  if (Object.keys(errors).length === 0) return { values, errors: {} }
  return { values: {}, errors: errors as never }
}

interface Props {
  countries?: SetupCountry[]
  countriesPending?: boolean
  /** Runs the form's own validation on the values, as completing setup would. */
  validate?: boolean
}

// The store's four answers on the first-run setup page (DA-SETUP-01), in its
// shell, with the defaults that page starts from. The browser here says it is
// in the United States, so that country is suggested.
function StoreSetup({ countries = setupCountries, countriesPending = false, validate }: Props) {
  const form = useForm<StoreSetupValues>({
    resolver,
    defaultValues: { store_name: '', country_code: '', locale: 'en', currency: 'USD' },
  })
  useEffect(() => {
    if (validate) form.trigger()
  }, [validate, form])
  return (
    <AuthShell>
      <form className="grid gap-6" autoComplete="off">
        <StoreSetupFields form={form} countries={countries} countriesPending={countriesPending} />
      </form>
    </AuthShell>
  )
}

const meta = {
  title: 'Admin dashboard/Setup/Store setup fields',
  component: StoreSetup,
  tags: ['CMP-DA-G-24'],
  parameters: { layout: 'fullscreen', liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof StoreSetup>

export default meta
type Story = StoryObj<typeof meta>

const country = () => screen.findByRole('combobox', { name: 'Country' })

export const Suggested: Story = {
  name: 'Country suggested',
  play: async () => {
    await screen.findByText('United States')
  },
}

export const CountryList: Story = {
  name: 'Country list',
  play: async () => {
    await userEvent.click(await country())
    await screen.findByRole('option', { name: /Poland/ })
  },
}

// Choosing a country brings its currency and its first language.
export const CountryChosen: Story = {
  name: 'Country chosen',
  play: async () => {
    await userEvent.click(await country())
    await userEvent.click(await screen.findByRole('option', { name: /Poland/ }))
    await screen.findByText(/^PLN/)
  },
}

// Switzerland's own languages, with English kept on the list.
export const Languages: Story = {
  play: async () => {
    await userEvent.click(await country())
    await userEvent.click(await screen.findByRole('option', { name: /Switzerland/ }))
    await userEvent.click(screen.getByRole('combobox', { name: 'Language' }))
    await screen.findByRole('option', { name: 'English' })
  },
}

// The country's currency leads; every other currency follows it.
export const Currencies: Story = {
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Currency' }))
    await userEvent.type(screen.getByPlaceholderText('Search currencies'), 'yen')
    await screen.findByRole('option', { name: /^JPY/ })
  },
}

export const Required: Story = { args: { validate: true } }

// The country list is still on its way, so the field waits.
export const ListLoading: Story = {
  name: 'Country list loading',
  args: { countries: [], countriesPending: true },
}
