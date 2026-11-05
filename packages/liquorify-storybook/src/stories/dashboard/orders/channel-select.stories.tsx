import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, http } from 'msw'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { screen, userEvent } from 'storybook/test'
import { ChannelSelect } from '../../../../../dashboard/src/components/spree/channel-select'
import { storeParameters, withStore } from '../../../decorators/store'
import { channels } from '../../../fixtures/admin/settings'
import { onePage } from '../../../mocks/page'

/**
 * A picker for one of the store's sales channels, as the new order page
 * (DA-ORD-03) offers it when the store has more than one, and as reports
 * offer it with "All channels" first.
 */
function Picker({ initial = '', home = false }: { initial?: string; home?: boolean }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initial)
  // The home page's report filter is a small trigger with "All channels"
  // first; the new order page's fills its card and names the store's default.
  return home ? (
    <ChannelSelect
      allOption
      triggerSize="sm"
      triggerClassName="min-w-40"
      value={value}
      onChange={setValue}
    />
  ) : (
    <ChannelSelect
      value={value}
      onChange={setValue}
      placeholder={t('admin.fields.order.channel.placeholder')}
    />
  )
}

const base = storeParameters()
const parameters = (viewport = false, column: 'inSidebarCard' | undefined = 'inSidebarCard') => ({
  liquorify: {
    ...base.liquorify,
    ...(column && { column }),
    ...(viewport && { capture: 'viewport' }),
  },
  msw: {
    handlers: {
      ...base.msw.handlers,
      channels: [http.get('/api/v3/admin/channels', () => HttpResponse.json(onePage(channels)))],
    },
  },
})

const meta = {
  title: 'Admin dashboard/Orders/Channel select',
  component: Picker,
  tags: ['CMP-DA-G-24'],
  decorators: [withStore],
  parameters: parameters(),
} satisfies Meta<typeof Picker>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async () => {
    await screen.findByText('Use store default')
  },
}

export const Chosen: Story = { args: { initial: channels[1].id } }

export const Open: Story = {
  parameters: parameters(true),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'Wholesale' })
  },
}

export const AllChannels: Story = {
  name: 'With all channels',
  args: { home: true, initial: 'all' },
  parameters: parameters(true, undefined),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'All channels' })
  },
}
