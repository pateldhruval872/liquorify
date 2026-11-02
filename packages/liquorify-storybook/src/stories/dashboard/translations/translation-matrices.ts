import type { ResourceTranslations } from '@spree/admin-sdk'
import { clayMug, clayMugTranslations, productTranslations } from '../../../fixtures/admin/catalog'

/** The clay mug in a store that also sells in French, translated into German only. */
export const germanOnly: ResourceTranslations = {
  ...clayMugTranslations,
  supported_locales: ['en', 'de', 'fr'],
  translations: {
    ...clayMugTranslations.translations,
    fr: { translated_field_count: 0 },
  },
}

/** The clay mug before anyone has translated it. */
export const untranslated = productTranslations(clayMug)

/** The clay mug in a store with one language. */
export const oneLanguage: ResourceTranslations = {
  ...untranslated,
  supported_locales: ['en'],
  translations: {},
}
