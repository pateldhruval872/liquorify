import { Checkbox } from '@spree/dashboard-ui/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '@spree/dashboard-ui/ui/field'
import { Input } from '@spree/dashboard-ui/ui/input'
import { RadioGroup, RadioGroupItem } from '@spree/dashboard-ui/ui/radio-group'
import { Switch } from '@spree/dashboard-ui/ui/switch'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Dashboard UI/Primitives/Field',
  component: Field,
  tags: ['CMP-DUI-P-23'],
  decorators: [(Story) => <div className="w-[28rem]">{Story()}</div>],
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Vertical: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="sku">SKU</FieldLabel>
      <Input id="sku" defaultValue="LIN-SHIRT-SND-M" />
      <FieldDescription>A unique code for this variant, used in stock reports.</FieldDescription>
    </Field>
  ),
}

// Spree's forms mark only the control and show the message; the label keeps its colour.
export const Invalid: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="slug">Slug</FieldLabel>
      <Input id="slug" defaultValue="linen shirt" aria-invalid />
      <FieldError errors={[{ message: 'Slug can only contain letters, numbers and hyphens' }]} />
    </Field>
  ),
}

export const SeveralErrors: Story = {
  name: 'Several errors',
  render: () => (
    <Field>
      <FieldLabel htmlFor="code">Promotion code</FieldLabel>
      <Input id="code" defaultValue="" aria-invalid />
      <FieldError errors={[{ message: "Code can't be blank" }, { message: 'Code is too short' }]} />
    </Field>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldTitle>Track inventory</FieldTitle>
        <FieldDescription>Count stock for this product at each location.</FieldDescription>
      </FieldContent>
      <Switch defaultChecked />
    </Field>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Field data-disabled="true">
      <FieldLabel htmlFor="currency">Currency</FieldLabel>
      <Input id="currency" defaultValue="USD" disabled />
      <FieldDescription>The store's currency cannot change once it has orders.</FieldDescription>
    </Field>
  ),
}

// Choice cards, as the choice card picker builds them.
export const ChoiceCards: Story = {
  name: 'Choice cards',
  render: () => (
    <FieldGroup>
      <FieldLabel>Tax calculation</FieldLabel>
      <RadioGroup defaultValue="exclusive">
        {[
          {
            value: 'exclusive',
            label: 'Add tax at checkout',
            description: 'Prices you enter do not include tax.',
          },
          {
            value: 'inclusive',
            label: 'Include tax in prices',
            description: 'Prices you enter already include tax.',
          },
        ].map((option) => (
          <FieldLabel key={option.value}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{option.label}</FieldTitle>
                <FieldDescription>{option.description}</FieldDescription>
              </FieldContent>
              <RadioGroupItem value={option.value} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </FieldGroup>
  ),
}

// As the report builder groups its metric checkboxes.
export const Fieldset: Story = {
  name: 'Field set',
  render: () => (
    <FieldSet className="flex flex-col gap-4">
      <FieldLegend variant="label" className="mb-0">
        Metrics
      </FieldLegend>
      {['Gross sales', 'Orders', 'Average order value'].map((label, index) => (
        <Field key={label} orientation="horizontal">
          <Checkbox id={label} defaultChecked={index < 2} disabled={index === 2} />
          <FieldLabel
            htmlFor={label}
            className={index === 2 ? 'font-normal text-muted-foreground' : 'font-normal'}
          >
            {label}
          </FieldLabel>
        </Field>
      ))}
    </FieldSet>
  ),
}

export const Legend: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Notifications</FieldLegend>
      <FieldDescription>Choose which emails staff receive.</FieldDescription>
      <Field orientation="horizontal">
        <Checkbox id="new-orders" defaultChecked />
        <FieldLabel htmlFor="new-orders" className="font-normal">
          New orders
        </FieldLabel>
      </Field>
    </FieldSet>
  ),
}

// No Spree screen uses the separator yet; it sits on the page background it was made for.
export const Separator: Story = {
  render: () => (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" defaultValue="avery@example.com" />
      </Field>
      <FieldSeparator>or</FieldSeparator>
      <Field>
        <FieldLabel htmlFor="phone">Phone</FieldLabel>
        <Input id="phone" defaultValue="+1 555 0100" />
      </Field>
    </FieldGroup>
  ),
}
