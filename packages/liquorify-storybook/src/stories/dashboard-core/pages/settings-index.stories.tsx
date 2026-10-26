import { SettingsIndexPage } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import type { StoryRoute } from '../../../decorators/router'
import { orderManagerRules, settingsViewerRules } from '../../../fixtures/admin/settings'
import { shellStore } from '../../../fixtures/admin/shell'
import { shellParameters, withStoreLayout } from '../../dashboard/shell/store-layout'

const settingsIndex = {
  pattern: '/$storeId/settings',
  path: `/${shellStore.id}/settings`,
} satisfies StoryRoute

/** The settings area's container (`routes/_authenticated/$storeId/settings.tsx`) around the page. */
function SettingsIndex() {
  return (
    <div className="container mx-auto flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <SettingsIndexPage tenantId={shellStore.id} />
    </div>
  )
}

// The settings landing page (DA-SET-01), in the store layout as the dashboard renders it.
const meta = {
  title: 'Dashboard core/Pages/Settings index',
  component: SettingsIndex,
  tags: ['CMP-CORE-PG-02'],
  decorators: [withStoreLayout],
  parameters: shellParameters({ route: settingsIndex }),
} satisfies Meta<typeof SettingsIndex>

export default meta
type Story = StoryObj<typeof meta>

const cards = async () => within(await screen.findByRole('main'))

// An admin sees a card for every settings page. The settings menu beside the
// cards links to the same pages, so a card is found by its description too.
export const EveryCard: Story = {
  name: 'Every card',
  play: async () => {
    await (await cards()).findByRole('link', { name: /^Policies Terms/ })
  },
}

// Read on settings and write on nothing: the cards for the settings scope's pages.
export const SettingsViewer: Story = {
  name: 'Settings viewer',
  parameters: shellParameters({ route: settingsIndex, rules: settingsViewerRules }),
  play: async () => {
    await (await cards()).findByRole('link', { name: /^Markets Countries/ })
  },
}

// The order manager template holds no settings scope.
export const OrderManager: Story = {
  name: 'Order manager',
  parameters: shellParameters({ route: settingsIndex, rules: orderManagerRules }),
  play: async () => {
    await screen.findByRole('heading', { name: 'Settings' })
  },
}

// Below 1024 pixels the settings menu is gone, so the page carries its own search.
export const OnAPhone: Story = {
  name: 'On a phone',
  tags: ['phone'],
  play: async () => {
    await (await cards()).findByRole('link', { name: /Policies/ })
  },
}

export const OnAPhoneFound: Story = {
  name: 'On a phone, searched',
  tags: ['phone'],
  play: async () => {
    const page = await cards()
    await userEvent.type(await page.findByRole('searchbox', { name: 'Search settings' }), 'tax')
    await page.findByRole('link', { name: /Taxes/ })
  },
}

export const OnAPhoneNothingFound: Story = {
  name: 'On a phone, nothing found',
  tags: ['phone'],
  play: async () => {
    const page = await cards()
    await userEvent.type(await page.findByRole('searchbox', { name: 'Search settings' }), 'zzz')
    await page.findByText('No settings match “zzz”.')
  },
}
