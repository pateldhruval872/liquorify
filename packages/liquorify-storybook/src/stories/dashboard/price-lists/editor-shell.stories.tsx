import {
  Field,
  FieldLabel,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { EditorShell } from '../../../../../dashboard/src/components/spree/promotion-editors/editor-shell'

/**
 * The body and Save and Cancel footer every rule editor sheet shares, for
 * price rules (DA-PRD-17) as for promotion rules and actions. Shown here
 * around the volume rule's first field.
 */
const meta = {
  title: 'Admin dashboard/Promotion editors/Editor shell',
  component: EditorShell,
  tags: ['CMP-DA-G-15'],
  args: { onSave: fn(), onCancel: fn(), pending: false, children: null },
  parameters: { liquorify: { capture: 'viewport' } },
  render: (args) => (
    <Sheet open>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Volume pricing</SheetTitle>
          <SheetDescription>Apply pricing based on quantity purchased</SheetDescription>
        </SheetHeader>
        <EditorShell {...args}>
          <Field>
            <FieldLabel htmlFor="minimum">Minimum quantity</FieldLabel>
            <Input id="minimum" type="number" defaultValue={6} />
          </Field>
        </EditorShell>
      </SheetContent>
    </Sheet>
  ),
} satisfies Meta<typeof EditorShell>

export default meta
type Story = StoryObj<typeof meta>

export const Editing: Story = {
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole('button', { name: 'Save' }))
    await expect(args.onSave).toHaveBeenCalled()
  },
}

export const Saving: Story = {
  args: { pending: true },
  play: async () => {
    await expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
    await expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  },
}

export const NothingToSave: Story = {
  name: 'Nothing to save',
  args: { saveDisabled: true },
  play: async () => {
    await expect(await screen.findByRole('button', { name: 'Save' })).toBeDisabled()
  },
}

export const OwnSaveLabel: Story = {
  name: 'Its own save label',
  args: { saveLabel: 'Apply' },
  play: async () => {
    await screen.findByRole('button', { name: 'Apply' })
  },
}

export const Cancelling: Story = {
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    await expect(args.onCancel).toHaveBeenCalled()
  },
}
