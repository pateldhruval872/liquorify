import { SpreeError } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { SaveReportDialog } from '../../../../../dashboard/src/components/spree/reporting/save-report-dialog'

/**
 * The name and description asked for when a report is saved, saved as a
 * copy or renamed (DA-RPT-02, DA-RPT-03). The report page passes the titles
 * and button labels, and saves through Spree; a refusal is shown in the
 * dialog.
 */
const meta = {
  title: 'Admin dashboard/Reporting/Save report dialog',
  component: SaveReportDialog,
  tags: ['CMP-DA-G-17'],
  args: {
    open: true,
    onOpenChange: fn(),
    title: 'Save report',
    submitLabel: 'Save',
    onSubmit: fn(async () => undefined),
  },
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof SaveReportDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Save: Story = {
  name: 'Saving a new report',
  play: async () => {
    await screen.findByRole('dialog', { name: 'Save report' })
  },
}

export const Rename: Story = {
  name: 'Renaming',
  args: {
    title: 'Rename report',
    defaultValues: {
      name: 'Weekend sales',
      description: 'Saturday and Sunday orders, by channel.',
    },
  },
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Rename report' })
    await expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue('Weekend sales')
  },
}

export const Copy: Story = {
  name: 'Saving a copy',
  args: {
    title: 'Save a copy',
    defaultValues: { name: 'Sales by channel (copy)', description: '' },
  },
  play: async () => {
    await screen.findByRole('dialog', { name: 'Save a copy' })
  },
}

export const NameMissing: Story = {
  name: 'Name missing',
  play: async ({ args }) => {
    const dialog = await screen.findByRole('dialog', { name: 'Save report' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

/**
 * Spree refuses a name another of the store's reports has, as the
 * browser-test server answered; the dialog stays open with its words.
 */
export const Refused: Story = {
  name: 'Name already taken',
  args: {
    onSubmit: fn(async () => {
      throw new SpreeError(
        {
          error: {
            code: 'validation_error',
            message: 'Name has already been taken',
            details: {
              name: [
                {
                  value: 'Sales by channel',
                  code: 'taken',
                  message: 'has already been taken',
                  specific: false,
                },
              ],
            },
          },
        },
        422,
      )
    }),
  },
  play: async ({ args }) => {
    const dialog = await screen.findByRole('dialog', { name: 'Save report' })
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Sales by channel')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalled())
    await within(dialog).findByText('Name has already been taken')
    // A mouse click leaves no focus ring on Save; the story's click does.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}
