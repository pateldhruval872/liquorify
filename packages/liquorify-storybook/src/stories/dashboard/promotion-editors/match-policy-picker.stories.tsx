import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { MatchPolicyPicker } from '../../../../../dashboard/src/components/spree/promotion-editors/match-policy-picker'

const productPolicies = [
  { value: 'any', label: 'Any of these products', description: 'Order must contain at least one.' },
  {
    value: 'all',
    label: 'All of these products',
    description: 'Order must contain every product.',
  },
  {
    value: 'none',
    label: 'None of these products',
    description: 'Order must not contain any of them.',
  },
]

const categoryPolicies = [
  {
    value: 'any',
    label: 'Any of these categories',
    description: 'Order must contain a product in at least one.',
  },
  {
    value: 'all',
    label: 'All of these categories',
    description: 'Order must contain a product in every category.',
  },
]

/**
 * The cards a product or category rule's editor chooses its match policy with
 * (DA-PRM-02, DA-PRM-03), with the editors' own labels and descriptions.
 */
const meta = {
  title: 'Admin dashboard/Promotion editors/Match policy picker',
  component: MatchPolicyPicker,
  tags: ['CMP-DA-G-15'],
  args: { policies: productPolicies, value: 'any', onChange: fn() },
} satisfies Meta<typeof MatchPolicyPicker>

export default meta
type Story = StoryObj<typeof meta>

export const ProductPolicies: Story = {
  name: 'A product rule’s policies',
  play: async () => {
    await expect(await screen.findByRole('radio', { name: /Any of these products/ })).toBeChecked()
  },
}

export const NoneChosen: Story = {
  name: 'None of them chosen',
  args: { value: 'none' },
  play: async () => {
    await expect(await screen.findByRole('radio', { name: /None of these products/ })).toBeChecked()
  },
}

export const CategoryPolicies: Story = {
  name: 'A category rule’s policies',
  args: { policies: categoryPolicies, value: 'all' },
  play: async () => {
    await expect(
      await screen.findByRole('radio', { name: /All of these categories/ }),
    ).toBeChecked()
  },
}

export const Choosing: Story = {
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole('radio', { name: /All of these products/ }))
    await expect(args.onChange).toHaveBeenCalledWith('all')
  },
}

export const OwnLabel: Story = {
  name: 'Its own label',
  args: { label: 'Which products must the order hold?' },
  play: async () => {
    await screen.findByText('Which products must the order hold?')
  },
}
