import { PageHeader } from '@spree/dashboard-core'
import { FormActions } from '@spree/dashboard-ui/spree/form-actions'
import { Card, CardContent } from '@spree/dashboard-ui/ui/card'
import { Field, FieldLabel } from '@spree/dashboard-ui/ui/field'
import { Input } from '@spree/dashboard-ui/ui/input'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useForm } from 'react-hook-form'
import { screen, userEvent } from 'storybook/test'

/**
 * The store settings page's header (DA-SET-02), whose Save waits for a change
 * and whose Discard appears once there is one. Saving never finishes here, so
 * the saving state stays on screen.
 */
function StoreHeader() {
  const form = useForm({ defaultValues: { name: 'Sample Store' } })
  return (
    <form onSubmit={form.handleSubmit(() => new Promise(() => {}))} className="flex flex-col gap-4">
      <PageHeader
        title="Store"
        description="Name, regional settings and how your storefront behaves."
        sticky={false}
        actions={<FormActions form={form} />}
      />
      <Card>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="store-name">Store name</FieldLabel>
            <Input id="store-name" {...form.register('name')} />
          </Field>
        </CardContent>
      </Card>
    </form>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Form actions',
  component: StoreHeader,
  tags: ['CMP-DUI-C-21'],
  parameters: { liquorify: { column: 'settings' } },
} satisfies Meta<typeof StoreHeader>

export default meta
type Story = StoryObj<typeof meta>

const rename = async () => {
  await userEvent.type(screen.getByLabelText('Store name'), ' Outlet')
}

export const Unchanged: Story = {}

export const Changed: Story = { play: rename }

export const Saving: Story = {
  play: async () => {
    await rename()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('button', { name: 'Saving…' })
  },
}
