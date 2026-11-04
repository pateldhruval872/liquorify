import type { PermissionRule } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { TaxesTabs } from '../../../../../dashboard/src/components/spree/taxes/taxes-tabs'
import type { StoryRoute } from '../../../decorators/router'
import { storeParameters } from '../../../decorators/store'
import { orderManagerRules, settingsViewerRules } from '../../../fixtures/admin/settings'
import { shellStore } from '../../../fixtures/admin/shell'

const tab = (name: string): StoryRoute => ({
  pattern: `/$storeId/settings/taxes/${name}`,
  path: `/${shellStore.id}/settings/taxes/${name}`,
})

function tabsParameters(route: StoryRoute, rules?: PermissionRule[]) {
  const base = storeParameters(undefined, rules)
  return { ...base, liquorify: { ...base.liquorify, route, column: 'settings' } }
}

// The tabs of the taxes layout (DA-SET-13, DA-SET-14 and DA-SET-15), each its own address.
const meta = {
  title: 'Admin dashboard/Taxes/Taxes tabs',
  component: TaxesTabs,
  tags: ['CMP-DA-G-22'],
  parameters: tabsParameters(tab('categories')),
} satisfies Meta<typeof TaxesTabs>

export default meta
type Story = StoryObj<typeof meta>

export const Categories: Story = {
  play: async () => {
    await screen.findByRole('tab', { name: 'Categories', selected: true })
  },
}

export const Rates: Story = {
  parameters: tabsParameters(tab('rates')),
  play: async () => {
    await screen.findByRole('tab', { name: 'Rates', selected: true })
  },
}

export const ExemptionReasons: Story = {
  name: 'Exemption reasons',
  parameters: tabsParameters(tab('exemption-reasons')),
  play: async () => {
    await screen.findByRole('tab', { name: 'Exemption reasons', selected: true })
  },
}

// Read on settings covers all three, so a settings viewer sees every tab.
export const SettingsViewer: Story = {
  name: 'Settings viewer',
  parameters: tabsParameters(tab('rates'), settingsViewerRules),
  play: async () => {
    await screen.findByRole('tab', { name: 'Rates', selected: true })
  },
}

// A staffer who may read none of them gets no tabs at all.
export const NoneReadable: Story = {
  name: 'None readable',
  parameters: tabsParameters(tab('categories'), orderManagerRules),
}
