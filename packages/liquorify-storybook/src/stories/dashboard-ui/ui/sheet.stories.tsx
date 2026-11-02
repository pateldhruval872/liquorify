import { Button } from '@spree/dashboard-ui/ui/button'
import { Checkbox } from '@spree/dashboard-ui/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@spree/dashboard-ui/ui/field'
import { Input } from '@spree/dashboard-ui/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@spree/dashboard-ui/ui/sheet'
import { Skeleton } from '@spree/dashboard-ui/ui/skeleton'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { expect, screen, waitFor } from 'storybook/test'

const roleNames = ['Merchandiser', 'Order manager', 'Staff manager', 'Support', 'Admin']

type Props = ComponentProps<typeof SheetContent> & {
  loading?: boolean
  nameError?: string
  roleCount?: number
}

// Laid out as the staff page's edit sheet (DA-SET-24): a header, a form whose
// body scrolls, and the actions in the footer.
function EditTeammateSheet({ loading, nameError, roleCount = roleNames.length, ...props }: Props) {
  const names = Array.from({ length: roleCount }, (_, index) =>
    index < roleNames.length ? roleNames[index] : `Regional team ${index - roleNames.length + 1}`,
  )

  return (
    <Sheet defaultOpen>
      <SheetContent {...props}>
        <SheetHeader>
          <SheetTitle>Jordan Lee</SheetTitle>
          <SheetDescription>
            Update profile details and assigned roles for this staff member.
          </SheetDescription>
        </SheetHeader>
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <form className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4" data-story-scroller>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="staff-first-name">First name</FieldLabel>
                  <Input
                    id="staff-first-name"
                    defaultValue={nameError ? '' : 'Jordan'}
                    aria-invalid={!!nameError || undefined}
                  />
                  {nameError && <FieldError errors={[{ message: nameError }]} />}
                </Field>
                <Field>
                  <FieldLabel htmlFor="staff-last-name">Last name</FieldLabel>
                  <Input id="staff-last-name" defaultValue="Lee" />
                </Field>
              </div>
              <Field>
                <FieldLabel>Roles for this store</FieldLabel>
                <div className="flex flex-col gap-1.5 rounded-md border border-border p-3">
                  {names.map((name) => (
                    <label
                      key={name}
                      htmlFor={`role-${name}`}
                      className="flex cursor-pointer items-center gap-2 text-sm capitalize"
                    >
                      <Checkbox id={`role-${name}`} defaultChecked={name === 'Support'} />
                      {name}
                    </label>
                  ))}
                </div>
                <a href="#roles" className="link text-xs">
                  Manage roles
                </a>
              </Field>
            </div>
            <SheetFooter>
              <Button type="button" variant="outline">
                Cancel
              </Button>
              {/* Save waits for a change, as on the staff page. */}
              <Button type="submit" disabled={!nameError}>
                Save
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Sheet',
  component: EditTeammateSheet,
  tags: ['CMP-DUI-P-37'],
  // The sheet renders outside the story's root, against the window's edge.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof EditTeammateSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const FieldErrors: Story = {
  name: 'Field errors',
  args: { nameError: 'First name is required' },
}

export const Loading: Story = { args: { loading: true } }

export const Wide: Story = { args: { className: 'sm:max-w-2xl' } }

// The header gains its shadow once the body scrolls under it. The sheet moves
// focus into itself as it opens, which scrolls the focused field back into
// view, so the body is scrolled only after that.
export const Scrolled: Story = {
  args: { roleCount: 40 },
  play: async () => {
    const sheet = await screen.findByRole('dialog')
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true))
    const body = sheet.querySelector<HTMLElement>('[data-story-scroller]')
    if (!body) throw new Error('The sheet has no scrolling body')
    body.scrollTop = body.scrollHeight
    await waitFor(() =>
      expect(sheet.querySelector('[data-slot="sheet-header"]')).toHaveClass('shadow-xs'),
    )
  },
}
