import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, http } from 'msw'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { SellerReturnsLocationCard } from '../../../../../seller-dashboard/src/components/seller-returns-location-card'
import { stockLocations } from '../../../fixtures/seller/settings'
import { seller, sellerReadFailed } from '../../../mocks/handlers/seller/panel'
import { onePage } from '../../../mocks/page'
import { panelParameters } from '../seller-panel'

const [warehouse] = stockLocations
const answering = (locations: typeof stockLocations) => [
  http.get(`${seller}/stock_locations`, () => HttpResponse.json(onePage(locations))),
]
const card = (first = answering(stockLocations), viewport = false) =>
  panelParameters({ column: 'sidebar', viewport, first })

/** Where customer returns are sent: the seller's returns stock location (SP-PRF-01, SP-ONB-01). */
const meta = {
  title: 'Seller panel/Profile/Seller returns location card',
  component: SellerReturnsLocationCard,
  tags: ['CMP-SP-G-03'],
  parameters: card(),
} satisfies Meta<typeof SellerReturnsLocationCard>

export default meta
type Story = StoryObj<typeof meta>

export const WithAddress: Story = {
  name: 'Returns address',
  parameters: card(
    answering([
      {
        ...warehouse,
        address1: '2 Bonded Warehouse Row',
        city: 'Portland',
        zipcode: '97209',
        state_code: 'OR',
        state_name: 'Oregon',
        returns_enabled: true,
      },
    ]),
  ),
}

export const Missing: Story = { name: 'Returns address, missing' }

export const NoLocation: Story = {
  name: 'No stock location yet',
  parameters: card(answering([])),
}

export const Failed: Story = {
  name: 'Could not load',
  parameters: card(sellerReadFailed('stock_locations')),
}

export const InOnboarding: Story = {
  name: 'In the onboarding checklist',
  args: { headless: true },
  parameters: panelParameters({
    page: 'onboarding',
    column: 'inMainCard',
    first: answering(stockLocations),
  }),
}

export const Adding: Story = {
  name: 'Adding the returns address',
  parameters: card(answering(stockLocations), true),
  play: async () => {
    const add = await screen.findByRole('button', { name: /add address/i })
    await waitFor(() => expect(add).toBeEnabled())
    await userEvent.click(add)
    await screen.findByRole('dialog')
  },
}
