import { RichTextEditor } from '@spree/dashboard-ui/ui/rich-text-editor'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { screen, userEvent } from 'storybook/test'

/**
 * The description editor as Spree draws it by default, at the width and text
 * of the product page's general card (DA-PRD-02, DA-PRD-03). There the media
 * editor adds the image button (`Admin dashboard/Policies/Media rich text
 * editor`). The translations dialog draws the same editor without its border,
 * inside the dialog's table, which the dialog's own stories show.
 */
function Description({
  initial = '',
  disabled,
  withImages,
}: {
  initial?: string
  disabled?: boolean
  withImages?: boolean
}) {
  const [value, setValue] = useState(initial)
  return (
    <div style={{ width: 609 }}>
      <RichTextEditor
        ariaLabel="Description"
        value={value}
        onChange={setValue}
        disabled={disabled}
        onRequestImage={
          withImages
            ? async () => ({ url: '/fixtures/product-clay.png', alt: 'Clay mug' })
            : undefined
        }
      />
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Primitives/Rich text editor',
  component: Description,
  tags: ['CMP-DUI-P-33'],
} satisfies Meta<typeof Description>

export default meta
type Story = StoryObj<typeof meta>

const formatted =
  '<p>A <strong>stoneware</strong> mug, thrown by hand and glazed in <em>clay</em>.</p>' +
  '<ul><li>Holds 350 ml</li><li>Dishwasher safe</li></ul>' +
  '<blockquote><p>Each glaze runs a little differently.</p></blockquote>' +
  '<p>See the <a href="https://shop.example.com/care">care guide</a>.</p>'

export const Empty: Story = {}

export const Formatted: Story = {
  args: { initial: formatted },
}

// Typing into an empty editor; the toolbar marks the format in use.
export const Typing: Story = {
  play: async () => {
    const editor = screen.getByRole('textbox', { name: 'Description' })
    await userEvent.click(editor)
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }))
    await userEvent.type(editor, 'Glazed by hand')
  },
}

export const WithImageButton: Story = {
  name: 'With image button',
  args: { initial: '<p>A stoneware mug, thrown by hand.</p>', withImages: true },
}

export const Disabled: Story = {
  args: { initial: formatted, disabled: true },
}
