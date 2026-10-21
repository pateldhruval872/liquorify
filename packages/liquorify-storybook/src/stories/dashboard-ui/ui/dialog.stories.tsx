import { AlertTriangleIcon, CopyIcon, XIcon } from '@spree/dashboard-ui/icons'
import { Alert, AlertDescription } from '@spree/dashboard-ui/ui/alert'
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
import { Field, FieldGroup, FieldLabel } from '@spree/dashboard-ui/ui/field'
import { Input } from '@spree/dashboard-ui/ui/input'
import { Textarea } from '@spree/dashboard-ui/ui/textarea'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Dashboard UI/Primitives/Dialog',
  component: Dialog,
  tags: ['CMP-DUI-P-20'],
  args: { defaultOpen: true },
  // The dialog renders outside the story's root, over the whole window.
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

/** The save report dialog: a form in the header, body and footer. */
export const Form: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogContent>
        <form>
          <DialogHeader>
            <DialogTitle>Save report</DialogTitle>
            <DialogDescription>Saved reports appear in the reports list.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="report-name">Name</FieldLabel>
                <Input id="report-name" autoFocus defaultValue="Sales by month" />
              </Field>
              <Field>
                <FieldLabel htmlFor="report-description">Description</FieldLabel>
                <Textarea id="report-description" rows={3} />
              </Field>
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  ),
}

/** The new API key's secret, shown once. */
export const WithAlert: Story = {
  name: 'With alert',
  render: (args) => (
    <Dialog {...args}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save your secret key</DialogTitle>
          <DialogDescription>Copy this value now — we won't show it again.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <Alert variant="warning">
            <AlertTriangleIcon />
            <AlertDescription>
              Treat this key like a password. Store it in your secrets manager — we can't show it
              again.
            </AlertDescription>
          </Alert>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3">
            <code className="flex-1 truncate font-mono text-sm">sk_test_4f8a2c9e1b7d3a6f</code>
            <Button size="sm" variant="outline">
              <CopyIcon />
              Copy
            </Button>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const TitleOnly: Story = {
  name: 'Title only',
  render: (args) => (
    <Dialog {...args}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename report</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel htmlFor="report-rename">Name</FieldLabel>
            <Input id="report-rename" autoFocus defaultValue="Sales by month" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

/** A long body scrolls inside the dialog, which stops at 90% of the window's height. */
export const ScrollingBody: Story = {
  name: 'Scrolling body',
  render: (args) => (
    <Dialog {...args}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import products</DialogTitle>
          <DialogDescription>Check the rows before they are imported.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-2">
          {Array.from({ length: 30 }, (_, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list of sample rows
              key={index}
              className="flex justify-between rounded-md border border-border px-3 py-2"
            >
              <span>Row {index + 1}</span>
              <span className="text-muted-foreground">Ready</span>
            </div>
          ))}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

/** The price editor: fills the window, with its own actions and close button in the header. */
export const FullScreen: Story = {
  name: 'Full screen',
  render: (args) => (
    <Dialog {...args}>
      <DialogContent fullScreen showCloseButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b p-3">
          <DialogTitle className="truncate">Edit prices: Wholesale</DialogTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled>
              Discard
            </Button>
            <Button size="sm" disabled>
              Save prices
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Close">
              <XIcon />
            </Button>
          </div>
        </DialogHeader>
        <DialogBody>
          <p className="text-muted-foreground">The editor's table fills this area.</p>
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
}
