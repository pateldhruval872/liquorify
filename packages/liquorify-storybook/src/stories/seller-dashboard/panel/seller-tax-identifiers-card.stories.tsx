import type { TaxIdentifier } from '@spree/seller-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, http } from 'msw'
import { screen, userEvent } from 'storybook/test'
import { SellerTaxIdentifiersCard } from '../../../../../seller-dashboard/src/components/seller-tax-identifiers-card'
import { seller, sellerReadHeld } from '../../../mocks/handlers/seller/panel'
import { panelParameters } from '../seller-panel'

const registrations: TaxIdentifier[] = [
  {
    id: 'taxid_5Kw2Pq8Lm3',
    kind: 'us_ein',
    value: '12-3456789',
    validation_status: 'unsupported',
    validated_at: null,
  },
  {
    id: 'taxid_9Lq4Wd7Hn2',
    kind: 'eu_vat',
    value: 'IE6388047V',
    validation_status: 'verified',
    validated_at: '2026-09-28T10:00:00.000Z',
  },
]
const listing = (identifiers: TaxIdentifier[]) => [
  http.get(`${seller}/tax_identifiers`, () => HttpResponse.json({ data: identifiers })),
]
const card = (first = listing(registrations), viewport = false) =>
  panelParameters({ column: 'sidebar', viewport, first })

/** The seller's own tax registrations (SP-PRF-01). */
const meta = {
  title: 'Seller panel/Profile/Seller tax identifiers card',
  component: SellerTaxIdentifiersCard,
  tags: ['CMP-SP-G-03'],
  parameters: card(),
} satisfies Meta<typeof SellerTaxIdentifiersCard>

export default meta
type Story = StoryObj<typeof meta>

export const Registered: Story = { name: 'Two registrations' }

export const Empty: Story = { name: 'None yet', parameters: card(listing([])) }

export const Loading: Story = { parameters: card(sellerReadHeld('tax_identifiers')) }

export const Adding: Story = {
  name: 'Adding a registration',
  parameters: card(listing([]), true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /add/i }))
    await screen.findByRole('dialog')
  },
}
