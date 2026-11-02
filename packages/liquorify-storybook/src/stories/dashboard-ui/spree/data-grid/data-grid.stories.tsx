import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent } from 'storybook/test'
import { ApronSheet, fillHandle } from './apron-sheet'

/**
 * The spreadsheet Spree's product page edits stock, prices and variant fields
 * in (DA-PRD-02, DA-PRD-03), shown with every kind of cell. Clicking a cell
 * selects it, the arrow keys move the selection, and double-click or Enter
 * edits. A grid with more columns than its box scrolls inside it with the
 * column headings pinned, as the bulk variant editor's does.
 */
const meta = {
  title: 'Dashboard UI/Composed/Data grid/Data grid',
  component: ApronSheet,
  tags: ['CMP-DUI-C-14'],
  parameters: { liquorify: { column: 'page' } },
} satisfies Meta<typeof ApronSheet>

export default meta
type Story = StoryObj<typeof meta>

export const WithASectionHeader: Story = {
  name: 'With a section header',
}

export const WithoutSectionHeaders: Story = {
  name: 'Without section headers',
  args: { grouped: false },
}

/**
 * Spree's grid means Shift with an arrow key to widen the selection, but the
 * cell it moves to takes the focus and resets the selection to itself, so the
 * selection moves instead. Recorded as a possible Spree defect, to confirm on
 * the running screens; only a fill handle drag selects a range.
 */
export const ShiftAndArrowKeys: Story = {
  name: 'Shift and the arrow keys',
  play: async ({ canvasElement }) => {
    await userEvent.click(screen.getByLabelText('SKU — Color: Olive, Size: M'))
    await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{ArrowRight}{ArrowRight}{/Shift}')
    await expect(screen.getByLabelText('Price for Color: Slate, Size: M')).toHaveFocus()
    await expect(fillHandle(canvasElement)).not.toBeNull()
  },
}

export const WiderThanItsBox: Story = {
  name: 'Wider than its box',
  args: { scrollable: true, className: 'min-w-[1560px]' },
  play: async ({ canvasElement }) => {
    const scroller = canvasElement.querySelector('.themed-scrollbar') as HTMLElement
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth)
  },
}

export const PinnedHeadings: Story = {
  name: 'Scrolled, with the headings pinned',
  args: { scrollable: true, frameClassName: 'h-40' },
  play: async ({ canvasElement }) => {
    const scroller = canvasElement.querySelector('.themed-scrollbar') as HTMLElement
    scroller.scrollTop = 60
    await expect(scroller.scrollTop).toBeGreaterThan(0)
  },
}
