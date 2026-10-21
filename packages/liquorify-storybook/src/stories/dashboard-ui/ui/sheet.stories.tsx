import { Button } from '@spree/dashboard-ui/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@spree/dashboard-ui/ui/field'
import { Input } from '@spree/dashboard-ui/ui/input'
import { RadioGroup, RadioGroupItem } from '@spree/dashboard-ui/ui/radio-group'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@spree/dashboard-ui/ui/sheet'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { screen } from 'storybook/test'

const keyTypes = [
  {
    value: 'secret',
    title: 'Secret key',
    description: 'Server-to-server. Each key carries an explicit list of scopes.',
  },
  {
    value: 'publishable',
    title: 'Publishable key',
    description: 'Safe to expose in client-side code. Grants public/guest access.',
  },
]

type Props = ComponentProps<typeof Sheet> & {
  showCloseButton?: boolean
  rows?: number
}

/** The create API key sheet: a form whose body scrolls between a fixed header and footer. */
function CreateKeySheet({ showCloseButton, rows = 0, ...props }: Props) {
  return (
    <Sheet {...props}>
      <SheetContent showCloseButton={showCloseButton}>
        <SheetHeader>
          <SheetTitle>Create API key</SheetTitle>
          <SheetDescription>Choose a key type, then pick the scopes it can use.</SheetDescription>
        </SheetHeader>
        <form className="flex min-h-0 flex-1 flex-col">
          <div data-testid="sheet-body" className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <Field>
              <FieldLabel htmlFor="api-key-name">Name</FieldLabel>
              <Input id="api-key-name" placeholder="Backend integration, Storefront prod, …" />
            </Field>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <RadioGroup defaultValue="secret">
                {keyTypes.map((keyType) => (
                  <FieldLabel key={keyType.value}>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>{keyType.title}</FieldTitle>
                        <FieldDescription>{keyType.description}</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={keyType.value} />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </Field>
            {Array.from({ length: rows }, (_, index) => (
              <Field
                // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list of sample fields
                key={index}
              >
                <FieldLabel htmlFor={`scope-${index}`}>Scope {index + 1}</FieldLabel>
                <Input id={`scope-${index}`} defaultValue="read_products" />
              </Field>
            ))}
          </div>
          <SheetFooter>
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Create key</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Sheet',
  component: CreateKeySheet,
  tags: ['CMP-DUI-P-37'],
  args: { defaultOpen: true },
  // The sheet renders outside the story's root, at the window's right edge.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof CreateKeySheet>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The header gains a shadow once the body scrolls under it. */
export const Scrolled: Story = {
  args: { rows: 12 },
  play: async () => {
    const body = await screen.findByTestId('sheet-body')
    body.scrollTop = body.scrollHeight
    body.dispatchEvent(new Event('scroll'))
  },
}

/** The media editor's sheet, which closes only through its own buttons. */
export const WithoutCloseButton: Story = {
  name: 'Without close button',
  args: { showCloseButton: false },
}
