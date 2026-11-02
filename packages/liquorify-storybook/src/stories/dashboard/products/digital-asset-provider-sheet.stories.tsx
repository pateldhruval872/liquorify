import type { DigitalAssetProvider } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { delay, type HttpHandler, http } from 'msw'
import { useState } from 'react'
import { expect, screen, userEvent } from 'storybook/test'
import { DigitalAssetProviderSheet } from '../../../../../dashboard/src/components/spree/products/digital-asset-provider-sheet'
import { storeParameters, withStore } from '../../../decorators/store'
import { glazingGuide } from '../../../fixtures/admin/catalog'
import {
  digitalAssetRequests,
  notRegistered,
  pooledProvider,
} from '../../../mocks/handlers/admin/catalog'
import { regionalPool } from './provider-settings'

/**
 * The sheet the Digital files card opens when a source with settings is
 * picked from its Add menu, before the file is created. A source with no
 * settings adds its file at once and never opens it.
 */
function ProviderSheet({ provider }: { provider: DigitalAssetProvider }) {
  const [open, setOpen] = useState(true)
  return (
    <DigitalAssetProviderSheet
      productId={glazingGuide.id}
      provider={open ? provider : null}
      onOpenChange={setOpen}
      onCreated={() => {}}
    />
  )
}

const create = '/api/v3/admin/products/:productId/digital_assets'

/** The sheet over the page, with its create answered by `create` when given, ahead of the usual answer. */
const sheet = (create: HttpHandler[] = []) => {
  const base = storeParameters()
  return {
    liquorify: { ...base.liquorify, capture: 'viewport' },
    msw: {
      handlers: {
        ...base.msw.handlers,
        digitalAssets: [...create, ...digitalAssetRequests([], [pooledProvider])],
      },
    },
  }
}

const meta = {
  title: 'Admin dashboard/Products/Digital asset provider sheet',
  component: ProviderSheet,
  tags: ['CMP-DA-G-14'],
  args: { provider: pooledProvider },
  decorators: [withStore],
  parameters: sheet(),
} satisfies Meta<typeof ProviderSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Settings: Story = {
  name: 'A setting to fill in',
  play: async () => {
    await screen.findByLabelText('pool_name')
  },
}

// Settings with defaults start filled with them.
export const Defaults: Story = {
  name: 'Settings with defaults',
  args: { provider: regionalPool },
  play: async () => {
    await expect(await screen.findByRole('switch', { name: 'auto_revoke' })).not.toBeChecked()
  },
}

export const Adding: Story = {
  parameters: sheet([
    http.post(create, async () => {
      await delay('infinite')
    }),
  ]),
  play: async () => {
    await userEvent.type(await screen.findByLabelText('pool_name'), 'winter-course-keys')
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    await screen.findByRole('button', { name: 'Saving…' })
  },
}

// Spree refuses a source its extension no longer registers, as when the
// extension was removed after the menu loaded. The sheet keeps what was typed.
export const Refused: Story = {
  name: 'Refused by Spree',
  parameters: sheet([http.post(create, notRegistered)]),
  play: async () => {
    await userEvent.type(await screen.findByLabelText('pool_name'), 'winter-course-keys')
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    await screen.findByText('Provider type is not a registered provider')
  },
}
