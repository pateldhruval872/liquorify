import type { PermissionRule } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { HttpHandler } from 'msw'
import { screen, userEvent, within } from 'storybook/test'
import { OrderRoutingRulesSection } from '../../../../../dashboard/src/components/spree/order-routing-rules-section'
import { storeParameters, withStore } from '../../../decorators/store'
import {
  extensionRoutingRule,
  extensionRuleType,
  overriddenChannel,
  routingRules,
  routingRuleTypes,
  settingsViewerRules,
} from '../../../fixtures/admin/settings'
import { routingRuleRequests, routingRulesHeld } from '../../../mocks/handlers/admin/settings'

/** A channel's rules and the kinds that can be added, signed in with the given rules. */
function rulesParameters(requests: HttpHandler[], rules?: PermissionRule[]) {
  const base = storeParameters(undefined, rules)
  return { ...base, msw: { handlers: { ...base.msw.handlers, routing: requests } } }
}

// The order routing rules at the foot of a channel's sheet (DA-SET-08), as
// wide as the sheet's form and in its smaller text.
const meta = {
  title: 'Admin dashboard/Channels/Order routing rules section',
  component: OrderRoutingRulesSection,
  tags: ['CMP-DA-G-24'],
  args: { channelId: overriddenChannel.id },
  decorators: [
    (Story) => (
      <div className="w-[566px] text-sm">
        <Story />
      </div>
    ),
    withStore,
  ],
  parameters: rulesParameters(routingRuleRequests()),
} satisfies Meta<typeof OrderRoutingRulesSection>

export default meta
type Story = StoryObj<typeof meta>

// A row's buttons wait for the signed-in admin's permissions, which arrive after the rules.
const row = async (name: string) =>
  within((await screen.findByText(name)).closest('li') as HTMLElement)

// Spree's three kinds in order, the last switched off. Every kind is in use, so none can be added.
export const Rules: Story = {
  play: async () => {
    await screen.findByText('Default location')
  },
}

export const None: Story = {
  parameters: rulesParameters(routingRuleRequests([])),
  play: async () => {
    await screen.findByText(/No routing rules/)
  },
}

export const Loading: Story = { parameters: rulesParameters(routingRulesHeld) }

// One kind left to add.
export const AddPicker: Story = {
  name: 'Adding a rule',
  parameters: rulesParameters(routingRuleRequests(routingRules.slice(0, 2))),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add rule' }))
    await screen.findByText('Add a routing rule')
  },
}

// A kind an extension registers, with a setting of its own to configure.
export const RuleSettings: Story = {
  name: 'Rule settings',
  parameters: rulesParameters(
    routingRuleRequests([extensionRoutingRule], [...routingRuleTypes, extensionRuleType]),
  ),
  play: async () => {
    const rule = await row('Nearest location')
    await userEvent.click(await rule.findByRole('button', { name: 'Edit rule settings' }))
    await screen.findByDisplayValue('80')
  },
}

export const DeleteConfirmation: Story = {
  name: 'Delete confirmation',
  parameters: { liquorify: { capture: 'viewport' } },
  play: async () => {
    const rule = await row('Minimize splits')
    await userEvent.click(await rule.findByRole('button', { name: 'Delete' }))
    await screen.findByRole('heading', { name: 'Delete routing rule?' })
  },
}

// Read on settings and write on nothing: no handles, switches that cannot change, nothing to add or delete.
export const SettingsViewer: Story = {
  name: 'Settings viewer',
  parameters: rulesParameters(routingRuleRequests(routingRules.slice(0, 2)), settingsViewerRules),
  play: async () => {
    await screen.findByText('Minimize splits')
  },
}
