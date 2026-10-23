import { Field, FieldLabel } from '@spree/dashboard-ui/ui/field'
import { RadioGroup } from '@spree/dashboard-ui/ui/radio-group'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { screen, userEvent } from 'storybook/test'
import {
  ApiKeyNameField,
  ChannelBindingSelect,
  FormErrorBanner,
  KeyTypeChoice,
} from '../../../../../dashboard/src/components/spree/api-keys/api-key-form-fields'
import { adminUser } from '../../../fixtures/admin/session'
import { channelList } from '../../../mocks/handlers/admin/developers'
import { adminSession } from '../../../mocks/handlers/admin/session'

// The fields the create and edit sheets share (DA-SET-26), at the width the
// sheets give them.
function NameField({ error }: { error?: string }) {
  const form = useForm<{ name: string }>({ defaultValues: { name: '' } })
  return (
    <ApiKeyNameField
      id="api-key-name"
      register={form.register}
      error={error ? { message: error } : undefined}
    />
  )
}

// Worded as the create sheet words them.
function KeyType() {
  const { t } = useTranslation()
  const [value, setValue] = useState('secret')
  return (
    <Field>
      <FieldLabel>{t('admin.fields.api_key.key_type.label')}</FieldLabel>
      <RadioGroup value={value} onValueChange={(next) => setValue(next as string)}>
        <KeyTypeChoice
          value="secret"
          title={t('admin.api_keys.key_type.secret_title')}
          description={t('admin.api_keys.key_type.secret_description')}
        />
        <KeyTypeChoice
          value="publishable"
          title={t('admin.api_keys.key_type.publishable_title')}
          description={t('admin.api_keys.key_type.publishable_description')}
        />
      </RadioGroup>
    </Field>
  )
}

function ChannelBinding() {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  return (
    <Field>
      <FieldLabel htmlFor="api-key-channel">{t('admin.fields.api_key.channel.label')}</FieldLabel>
      <ChannelBindingSelect id="api-key-channel" value={value} onChange={setValue} />
    </Field>
  )
}

const meta = {
  title: 'Admin dashboard/API keys/Form fields',
  tags: ['CMP-DA-G-01'],
  parameters: {
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id },
    msw: { handlers: { session: adminSession(), channels: channelList } },
  },
  decorators: [
    (Story) => (
      <div className="flex w-[566px] flex-col gap-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Name: Story = { render: () => <NameField /> }

export const NameRequired: Story = {
  name: 'Name required',
  render: () => <NameField error="Name is required" />,
}

export const KeyTypeChoices: Story = { name: 'Key type choices', render: () => <KeyType /> }

export const ChannelBindingClosed: Story = {
  name: 'Channel binding',
  render: () => <ChannelBinding />,
  play: async () => {
    await screen.findByText('All channels')
  },
}

export const ChannelBindingOpen: Story = {
  name: 'Channel binding, open',
  render: () => <ChannelBinding />,
  // The list renders outside the story's root.
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'Online store' })
  },
}

// A refusal the server gives for the whole form, rather than one field.
export const FormRefusal: Story = {
  name: 'Form refusal',
  render: () => <FormErrorBanner message="Scopes can't be blank" />,
}
