import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { ApronSheet, dragFillHandle, fillHandle } from './apron-sheet'

const price = (label: string) => screen.getByLabelText(`Price for ${label}`)

/**
 * The small square the grid draws at the far corner of the selection.
 * Dragging it down a column copies the first selected cell's value into the
 * cells it passes, and the range it covers is shaded while it moves. Spree
 * draws it only for text, money and decimal cells: whole-number, choice and
 * switch cells give the grid no element to measure, so selecting a stock count
 * shows no handle, though Mod+D still fills down. That is recorded as a
 * possible Spree defect, to confirm on the running inventory grid. The handle
 * is hidden while a cell is being edited.
 */
const meta = {
  title: 'Dashboard UI/Composed/Data grid/Fill handle',
  component: ApronSheet,
  tags: ['CMP-DUI-C-15'],
  parameters: { liquorify: { column: 'page' } },
} satisfies Meta<typeof ApronSheet>

export default meta
type Story = StoryObj<typeof meta>

// Spree places the handle when it draws it and again on a resize or scroll.
// The story's grid can still be settling when the cell is clicked, which left
// the handle beside the cell rather than on its corner, so the story resizes
// once and waits for the handle to reach the corner, where the running grid
// draws it.
export const OnASelectedCell: Story = {
  name: 'On a selected cell',
  play: async ({ canvasElement }) => {
    await userEvent.click(price('Color: Olive, Size: M'))
    window.dispatchEvent(new Event('resize'))
    await waitFor(() => {
      const handle = fillHandle(canvasElement)?.getBoundingClientRect()
      const cell = price('Color: Olive, Size: M').closest('td')?.getBoundingClientRect()
      expect(handle && cell && Math.abs(handle.left + 4 - cell.right)).toBeLessThan(1)
      expect(handle && cell && Math.abs(handle.top + 4 - cell.bottom)).toBeLessThan(1)
    })
  },
}

export const Dragging: Story = {
  name: 'Dragging down',
  play: async ({ canvasElement }) => {
    await userEvent.click(price('Color: Olive, Size: M'))
    const handle = fillHandle(canvasElement) as HTMLElement
    await dragFillHandle(handle, price('Color: Slate, Size: L'), false)
  },
}

export const FilledDown: Story = {
  name: 'Filled down',
  play: async ({ canvasElement }) => {
    await userEvent.click(price('Color: Olive, Size: M'))
    const handle = fillHandle(canvasElement) as HTMLElement
    await dragFillHandle(handle, price('Color: Slate, Size: L'))
    await waitFor(() => expect(price('Color: Slate, Size: L')).toHaveValue('42.00'))
  },
}

export const NotOnAStockCount: Story = {
  name: 'Not drawn on a stock count',
  play: async ({ canvasElement }) => {
    await userEvent.click(screen.getByLabelText('On hand — Color: Olive, Size: M'))
    await expect(fillHandle(canvasElement)).toBeNull()
  },
}

export const HiddenWhileEditing: Story = {
  name: 'Hidden while editing',
  play: async ({ canvasElement }) => {
    await userEvent.dblClick(price('Color: Olive, Size: M'))
    await expect(fillHandle(canvasElement)).toBeNull()
  },
}
