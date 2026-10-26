import type { CustomFieldDefinition } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { type Resolver, useForm } from 'react-hook-form'
import { screen, userEvent } from 'storybook/test'
import { DefinitionFormFields } from '../../../../../dashboard/src/components/spree/custom-fields/definition-form'
import {
  CUSTOM_FIELD_DEFINITION_DEFAULTS,
  type CustomFieldDefinitionFormValues,
  customFieldDefinitionSchema,
} from '../../../../../dashboard/src/schemas/custom-field-definition'
import { adminUser } from '../../../fixtures/admin/session'
import { customFieldDefinitions } from '../../../fixtures/admin/settings'
import { adminSession } from '../../../mocks/handlers/admin/session'
import { resourceTypeList } from '../../../mocks/handlers/admin/settings'

interface Props {
  definition?: CustomFieldDefinition
  showResourceType?: boolean
  /** Runs the form's own validation on the values, as saving would. */
  validate?: boolean
}

// The sheets validate with this schema through react-hook-form's zod resolver,
// which this package does not depend on; this reports the schema's issues the
// same way for these flat fields.
const resolver: Resolver<CustomFieldDefinitionFormValues> = async (values) => {
  const result = customFieldDefinitionSchema.safeParse(values)
  if (result.success) return { values: result.data, errors: {} }
  const errors: Record<string, { type: string; message: string }> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0])
    errors[field] ??= { type: issue.code, message: issue.message }
  }
  return { values: {}, errors: errors as never }
}

// The fields of the custom fields page's create and edit sheets (DA-SET-09),
// at the width the sheets give them. Editing locks what the field belongs to
// and its type, since values may already be stored.
function DefinitionForm({ definition, showResourceType = true, validate = false }: Props) {
  const form = useForm<CustomFieldDefinitionFormValues>({
    resolver,
    defaultValues: definition
      ? {
          label: definition.label,
          namespace: definition.namespace,
          key: definition.key,
          field_type: definition.field_type,
          resource_type: definition.resource_type,
          storefront_visible: definition.storefront_visible,
          searchable: definition.searchable,
          sortable: definition.sortable,
        }
      : CUSTOM_FIELD_DEFINITION_DEFAULTS,
  })
  useEffect(() => {
    if (validate) form.trigger()
  }, [validate, form])
  return (
    <form className="w-[566px] text-sm">
      <DefinitionFormFields
        form={form}
        showResourceType={showResourceType}
        resourceTypeReadOnly={!!definition}
        fieldTypeReadOnly={!!definition}
      />
    </form>
  )
}

const meta = {
  title: 'Admin dashboard/Custom fields/Definition form',
  component: DefinitionForm,
  tags: ['CMP-DA-G-06'],
  parameters: {
    liquorify: { signedIn: true, storeId: adminUser.stores[0].id },
    msw: { handlers: { session: adminSession(), resourceTypes: resourceTypeList } },
  },
} satisfies Meta<typeof DefinitionForm>

export default meta
type Story = StoryObj<typeof meta>

const opened = { liquorify: { capture: 'viewport' } }

export const New: Story = {}

export const Required: Story = { args: { validate: true } }

// What a field can belong to comes from the server's list.
export const ResourceTypes: Story = {
  name: 'Applies to, open',
  parameters: opened,
  play: async () => {
    await userEvent.click(await screen.findByLabelText('Applies to'))
    await screen.findByRole('option', { name: 'Addresses' })
  },
}

export const FieldTypes: Story = {
  name: 'Field types, open',
  parameters: opened,
  play: async () => {
    await userEvent.click(await screen.findByLabelText('Type'))
    await screen.findByRole('option', { name: 'JSON' })
  },
}

// Long text is searchable but cannot be sorted, so that switch is off and locked.
export const EditLongText: Story = {
  name: 'Editing long text, shown on the storefront',
  args: { definition: customFieldDefinitions[0] },
}

export const EditNumber: Story = {
  name: 'Editing a number, sortable',
  args: { definition: customFieldDefinitions[1] },
}

// Rich text can be neither searched nor sorted.
export const EditRichText: Story = {
  name: 'Editing rich text',
  args: { definition: customFieldDefinitions[3] },
}

// The inline sheet on a record's own page already knows what the field belongs to.
export const ForAKnownRecord: Story = {
  name: 'For a known record',
  args: { showResourceType: false },
}
