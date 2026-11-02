import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent } from 'storybook/test'
import { ApronSheet } from './apron-sheet'

const olive = 'Color: Olive, Size: M'

/**
 * The grid's cells, one column of each: read-only text, text, a whole number
 * (amber below five, as the inventory grid asks), money with the currency's
 * symbol, a decimal, two fixed choices (one with the carton's size beside its
 * name) and a switch. A cell edits on double-click or Enter, shows the
 * admin's own decimal mark, and a switch toggles with Space.
 */
const meta = {
  title: 'Dashboard UI/Composed/Data grid/Cells',
  component: ApronSheet,
  tags: ['CMP-DUI-C-13'],
  parameters: { liquorify: { column: 'page' } },
} satisfies Meta<typeof ApronSheet>

export default meta
type Story = StoryObj<typeof meta>

export const EveryKind: Story = {
  name: 'Every kind',
}

export const TextEditing: Story = {
  name: 'Text, editing',
  play: async () => {
    await userEvent.dblClick(screen.getByLabelText(`SKU — ${olive}`))
    await userEvent.keyboard('APRON-OLIVE-M')
    await expect(screen.getByLabelText(`SKU — ${olive}`)).toHaveValue('APRON-OLIVE-M')
  },
}

export const NumberEditing: Story = {
  name: 'Whole number, editing',
  play: async () => {
    await userEvent.dblClick(screen.getByLabelText('On hand — Color: Olive, Size: L'))
    await userEvent.keyboard('12')
    await expect(screen.getByLabelText('On hand — Color: Olive, Size: L')).toHaveValue('12')
  },
}

export const MoneyEditing: Story = {
  name: 'Money, editing',
  play: async () => {
    await userEvent.dblClick(screen.getByLabelText(`Price for ${olive}`))
    await userEvent.keyboard('45.50')
    await expect(screen.getByLabelText(`Price for ${olive}`)).toHaveValue('45.50')
  },
}

export const CommaDecimalMark: Story = {
  name: 'Comma decimal mark',
  args: { decimal: ',' },
  play: async () => {
    await expect(screen.getByLabelText(`Price for ${olive}`)).toHaveValue('42,00')
  },
}

export const ChoiceOpen: Story = {
  name: 'Choice, open',
  parameters: { liquorify: { column: 'page', capture: 'viewport' } },
  play: async () => {
    await userEvent.click(screen.getByLabelText(`Carton — ${olive}`))
    await screen.findByRole('option', { name: /Shipping carton/ })
  },
}

export const SwitchToggled: Story = {
  name: 'Switch, toggled with Space',
  play: async () => {
    await userEvent.click(screen.getByLabelText(`Weight — ${olive}`))
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    await userEvent.keyboard(' ')
    await expect(
      screen.getByRole('switch', { name: `Available for pre-order — ${olive}` }),
    ).toBeChecked()
  },
}
