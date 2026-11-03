import type { ResourceTranslations } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { HttpHandler } from 'msw'
import { screen } from 'storybook/test'
import { ResourceTranslationsCard } from '../../../../../dashboard/src/components/spree/translations/resource-translations-card'
import { withStore } from '../../../decorators/store'
import { clayMug } from '../../../fixtures/admin/catalog'
import {
  translationRequests,
  translationsFailed,
  translationsHeld,
} from '../../../mocks/handlers/admin/catalog'
import { productParameters } from '../../dashboard-core/products/product-form'
import { germanOnly, oneLanguage, untranslated } from './translation-matrices'

/**
 * The Translations card on a product's page (DA-PRD-03): how many of the
 * store's other languages the product is translated into, and the button
 * that opens the editor. The categories and collections pages hold the same
 * card in part 2.
 */
function TranslationsCard() {
  return <ResourceTranslationsCard resourceType="product" resourceId={clayMug.id} />
}

const card = (translations: HttpHandler[] = translationRequests()) =>
  productParameters({ handlers: { translations } })

const meta = {
  title: 'Admin dashboard/Translations/Resource translations card',
  component: TranslationsCard,
  tags: ['CMP-DA-G-23'],
  decorators: [withStore],
  parameters: card(),
} satisfies Meta<typeof TranslationsCard>

export default meta
type Story = StoryObj<typeof meta>

const matrix = (translations: ResourceTranslations) => card(translationRequests(translations))

export const Translated: Story = {
  play: async () => {
    await screen.findByText('1 of 1 locales translated')
  },
}

export const PartlyTranslated: Story = {
  name: 'Partly translated',
  parameters: matrix(germanOnly),
  play: async () => {
    await screen.findByText('1 of 2 locales translated')
  },
}

export const NotTranslated: Story = {
  name: 'Not translated',
  parameters: matrix(untranslated),
  play: async () => {
    await screen.findByText('0 of 1 locales translated')
  },
}

export const OneLanguage: Story = {
  name: 'A store with one language',
  parameters: matrix(oneLanguage),
  play: async () => {
    await screen.findByText(/^Add more locales to your store/)
  },
}

// Until the matrix arrives the card has no other languages to count, so it
// shows the one-language message without its button. This looks like a Spree
// defect: the message is wrong for a store that has other languages.
export const Loading: Story = {
  parameters: card(translationsHeld),
  play: async () => {
    await screen.findByText(/^Add more locales to your store/)
  },
}

// A matrix that fails to load reads the same way.
export const FailedToLoad: Story = {
  name: 'Failed to load',
  parameters: card(translationsFailed),
  play: async () => {
    await screen.findByText(/^Add more locales to your store/)
  },
}
