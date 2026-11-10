import { CodeEditor, type CodeEditorProps } from '@spree/dashboard-ui/ui/code-editor'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { screen, userEvent, within } from 'storybook/test'
import { brokenBody, passwordResetTemplate } from '../../../fixtures/admin/email-templates'

/** The variables the password reset email's preview offers, as the editor suggests them. */
const completions = [
  { label: 'customer', info: 'The customer the email is sent to.' },
  { label: 'customer.email', detail: 'jane@example.com' },
  { label: 'customer.first_name', detail: 'Jane' },
  { label: 'customer.full_name', detail: 'Jane Doe' },
  { label: 'customer.last_name', detail: 'Doe' },
  { label: 'reset_url', detail: 'http://localhost:3000/account/reset-…' },
  { label: 'store', info: 'Your store: name, address, logo and colours.' },
  { label: 'store.name', detail: 'Sample Store' },
  { label: 'store.support_email', detail: 'support@example.com' },
]

const filters = ['money', 'money_with_currency', 'date', 't'].map((label) => ({ label }))

/**
 * The template editor (DA-SET-05): Liquid in MJML, with line numbers,
 * highlighting, variable and filter suggestions, and the problems Spree finds
 * marked on their line. The size is the editor's on the template page at
 * 1280 pixels.
 */
function Editor({ value: initial, ...props }: CodeEditorProps) {
  const [value, setValue] = useState(initial)
  return (
    <div style={{ width: 409 }}>
      <CodeEditor
        aria-label="Template body"
        value={value}
        onChange={setValue}
        completions={completions}
        filters={filters}
        className="h-[36rem]"
        {...props}
      />
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Code editor',
  component: Editor,
  tags: ['CMP-DUI-P-12'],
  args: { value: passwordResetTemplate.body },
} satisfies Meta<typeof Editor>

export default meta
type Story = StoryObj<typeof meta>

export const Template: Story = { name: 'An email template' }

export const ReadOnly: Story = {
  name: 'Read only',
  args: { readOnly: true },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole('textbox', { name: 'Template body' })
  },
}

export const Problem: Story = {
  name: 'A problem on a line',
  args: {
    value: brokenBody,
    diagnostics: [
      {
        line: 5,
        message:
          "Liquid syntax error (line 5): Variable '{{ name }' was not properly terminated with regexp: /\\}\\}/",
      },
    ],
  },
}

/** Typing after `{{` lists the variables; the list opens outside the editor. */
export const SuggestingVariables: Story = {
  name: 'Suggesting variables',
  parameters: { liquorify: { capture: 'viewport' } },
  args: { value: '' },
  play: async ({ canvasElement }) => {
    const editor = await within(canvasElement).findByRole('textbox', { name: 'Template body' })
    await userEvent.click(editor)
    await userEvent.keyboard('Hi {{{{ cus')
    await screen.findByRole('listbox')
    await screen.findByRole('option', { name: /customer/ })
  },
}

/** A dot after a variable lists its fields. */
export const SuggestingFields: Story = {
  name: 'Suggesting fields',
  parameters: { liquorify: { capture: 'viewport' } },
  args: { value: '' },
  play: async ({ canvasElement }) => {
    const editor = await within(canvasElement).findByRole('textbox', { name: 'Template body' })
    await userEvent.click(editor)
    await userEvent.keyboard('Hi {{{{ customer.')
    await screen.findByRole('option', { name: /first_name/ })
  },
}

/** A pipe after a value lists Liquid's filters with those Spree adds, such as `money`. */
export const SuggestingFilters: Story = {
  name: 'Suggesting filters',
  parameters: { liquorify: { capture: 'viewport' } },
  args: { value: '' },
  play: async ({ canvasElement }) => {
    const editor = await within(canvasElement).findByRole('textbox', { name: 'Template body' })
    await userEvent.click(editor)
    await userEvent.keyboard('{{{{ store.name | m')
    await screen.findByRole('option', { name: /money_with_currency/ })
  },
}
