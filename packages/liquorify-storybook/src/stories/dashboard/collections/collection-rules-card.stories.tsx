import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent } from 'storybook/test'
import { CollectionRulesCard } from '../../../../../dashboard/src/components/spree/collections/collection-rules-card'
import { withStore } from '../../../decorators/store'
import { newArrivals, summerEdit } from '../../../fixtures/admin/merchandising'
import { CollectionFormFor, collectionParameters } from './collection-form'

/**
 * How a collection's products are chosen (DA-PRD-11): by hand, or by rules
 * that Spree applies for it. The rule kinds come from Spree, so a kind an
 * extension adds appears here too; Spree registers three.
 */
const meta = {
  title: 'Admin dashboard/Collections/Collection rules card',
  tags: ['CMP-DA-G-04'],
  decorators: [withStore],
  parameters: collectionParameters({ collection: newArrivals }),
  render: () => (
    <CollectionFormFor collection={newArrivals}>
      {(form) => <CollectionRulesCard form={form} />}
    </CollectionFormFor>
  ),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const byHand = () => (
  <CollectionFormFor collection={summerEdit}>
    {(form) => <CollectionRulesCard form={form} />}
  </CollectionFormFor>
)

export const ByHand: Story = {
  name: 'By hand',
  render: byHand,
  play: async () => {
    await expect(
      await screen.findByRole('switch', { name: 'Set members automatically from rules' }),
    ).not.toBeChecked()
  },
}

export const Rules: Story = {
  play: async () => {
    await screen.findByText('Recently published')
    await screen.findByText('is not equal to')
    await expect(screen.getByDisplayValue('30')).toBeVisible()
  },
}

// Turning rules on starts one rule of the first kind Spree lists.
export const TurningOnRules: Story = {
  name: 'Turning on rules',
  render: byHand,
  play: async () => {
    await userEvent.click(
      await screen.findByRole('switch', { name: 'Set members automatically from rules' }),
    )
    await screen.findByText('On sale')
    await screen.findByText('all conditions')
  },
}

export const AddingRule: Story = {
  name: 'Adding a rule',
  play: async () => {
    await screen.findByText('Recently published')
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    await expect(screen.getAllByRole('button', { name: 'Remove rule' })).toHaveLength(3)
  },
}

export const RemovingRule: Story = {
  name: 'Removing a rule',
  play: async () => {
    await screen.findByText('Recently published')
    await userEvent.click(screen.getAllByRole('button', { name: 'Remove rule' })[1])
    await expect(screen.queryByText('On sale')).toBeNull()
  },
}

export const ChoosingKind: Story = {
  name: 'Choosing a kind',
  parameters: collectionParameters({ collection: newArrivals, viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByText('Recently published'))
    await screen.findByRole('option', { name: 'Tag' })
  },
}

export const ChoosingMatch: Story = {
  name: 'Choosing all or any',
  parameters: collectionParameters({ collection: newArrivals, viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByText('all conditions'))
    await screen.findByRole('option', { name: 'any condition' })
  },
}

const withoutDays = {
  ...newArrivals,
  rules: newArrivals.rules?.map((rule, index) => (index === 0 ? { ...rule, value: null } : rule)),
}

// A rule left without a value is refused before Save.
export const ValueMissing: Story = {
  name: 'Value missing',
  render: () => (
    <CollectionFormFor collection={withoutDays} validate>
      {(form) => <CollectionRulesCard form={form} />}
    </CollectionFormFor>
  ),
  play: async () => {
    const [days] = await screen.findAllByPlaceholderText('Value')
    await expect(days).toHaveAttribute('aria-invalid', 'true')
  },
}
