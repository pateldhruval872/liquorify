import { FormSection } from '@spree/dashboard-ui/spree/form-section'
import { Field, FieldLabel } from '@spree/dashboard-ui/ui/field'
import { Input } from '@spree/dashboard-ui/ui/input'
import type { Meta, StoryObj } from '@storybook/react-vite'

/** Two of a variant sheet's fields (DA-PRD-03), which the sheet groups in sections, at its width and text. */
function IdentityFields() {
  return (
    <>
      <Field>
        <FieldLabel htmlFor="story-sku">SKU</FieldLabel>
        <Input id="story-sku" defaultValue="APRON-LIN-M" />
      </Field>
      <Field>
        <FieldLabel htmlFor="story-barcode">Barcode</FieldLabel>
        <Input id="story-barcode" defaultValue="4006381333931" />
      </Field>
    </>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Form section',
  component: FormSection,
  tags: ['CMP-DUI-C-22'],
  args: { children: <IdentityFields /> },
  decorators: [
    (Story) => (
      <div className="w-[566px] text-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormSection>

export default meta
type Story = StoryObj<typeof meta>

export const Titled: Story = {
  args: { title: 'Identity' },
}

// A section without a heading still groups its fields.
export const Untitled: Story = {}
