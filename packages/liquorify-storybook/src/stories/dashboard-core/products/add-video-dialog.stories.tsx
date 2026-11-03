import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { AddVideoDialog } from '../../../../../dashboard-core/src/products/add-video-dialog'

// The media card's "Add video link" dialog, which takes a YouTube or Vimeo link.
const meta = {
  title: 'Dashboard core/Product form/Add video dialog',
  component: AddVideoDialog,
  tags: ['CMP-CORE-PF-01'],
  args: { open: true, onOpenChange: fn(), onAdd: fn() },
  parameters: { liquorify: { capture: 'viewport' } },
} satisfies Meta<typeof AddVideoDialog>

export default meta
type Story = StoryObj<typeof meta>

const field = () => screen.findByLabelText('Video link')

export const Empty: Story = {
  play: async () => {
    await field()
  },
}

export const Typed: Story = {
  play: async () => {
    await userEvent.type(await field(), 'https://vimeo.com/76979871')
  },
}

// A link from neither provider, refused when the field loses focus.
export const Unsupported: Story = {
  play: async () => {
    await userEvent.type(await field(), 'https://example.com/clay-mug.mp4')
    await userEvent.tab()
    await screen.findByText('Enter a YouTube or Vimeo link.')
  },
}
