import { Button } from '@spree/dashboard-ui/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@spree/dashboard-ui/ui/dialog'
import { Field, FieldError, FieldLabel } from '@spree/dashboard-ui/ui/field'
import { Input } from '@spree/dashboard-ui/ui/input'
import { Select, SelectTrigger, SelectValue } from '@spree/dashboard-ui/ui/select'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'

type Props = ComponentProps<typeof DialogContent> & {
  roleError?: string
  paragraphs?: number
}

// Laid out as the staff page's invite dialog (DA-SET-24): a header, fields in
// the body, and the actions in the footer.
function InviteDialog({ roleError, paragraphs = 0, ...props }: Props) {
  const paragraphKeys = Array.from({ length: paragraphs }, (_, index) => `paragraph-${index + 1}`)

  return (
    <Dialog defaultOpen>
      <DialogContent {...props}>
        <DialogHeader>
          <DialogTitle>Invite teammate</DialogTitle>
          <DialogDescription>We'll email them a link to set their password.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="invite-email">Email</FieldLabel>
            <Input
              id="invite-email"
              type="email"
              placeholder="teammate@example.com"
              defaultValue={roleError ? 'jordan.lee@example.com' : undefined}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="invite-role">Role</FieldLabel>
            {/* As on the staff page: the field holds an empty string until a role
                is picked, and the trigger names the picked role through a
                function, which answers that empty string. So the trigger stays
                blank and its placeholder never shows. */}
            <Select value="">
              <SelectTrigger id="invite-role">
                <SelectValue placeholder="Select a role">{(value) => value as string}</SelectValue>
              </SelectTrigger>
            </Select>
            {roleError && <FieldError errors={[{ message: roleError }]} />}
          </Field>
          {paragraphKeys.map((key) => (
            <p key={key} className="text-muted-foreground">
              Teammates sign in with their own email and password. Each role decides which sections
              of the dashboard they can open and what they can change there.
            </p>
          ))}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Send invitation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Dialog',
  component: InviteDialog,
  tags: ['CMP-DUI-P-20'],
  // The dialog renders outside the story's root, over the whole window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof InviteDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const FieldErrors: Story = { name: 'Field errors', args: { roleError: 'Pick a role' } }

export const WithoutCloseButton: Story = {
  name: 'Without close button',
  args: { showCloseButton: false },
}

export const Wide: Story = { args: { className: 'sm:max-w-2xl' } }

// The body scrolls between the header and footer once the content passes
// 90% of the window's height.
export const LongContent: Story = { name: 'Long content', args: { paragraphs: 24 } }

export const FullScreen: Story = {
  name: 'Full screen',
  args: { fullScreen: true, showCloseButton: false },
}
