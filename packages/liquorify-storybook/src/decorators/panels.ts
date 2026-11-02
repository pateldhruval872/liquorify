// Both panels boot the way their entry modules do: the admin dashboard
// registers the Admin API client and its translations as side effects, and the
// seller panel builds its client when asked. The framework holds one client and
// one set of English strings at a time, so each story re-applies its panel's.
import { getApiClient, i18n, type PanelApiClient, setApiClient } from '@spree/dashboard-core'
import coreEnglish from '@spree/dashboard-core/locales/en.json'
import '../../../dashboard/src/api-client-setup'
import '../../../dashboard/src/i18n-setup'
import adminEnglish from '../../../dashboard/src/locales/en.json'
import { createSellerApiClient } from '../../../seller-dashboard/src/api-client'
import '../../../seller-dashboard/src/i18n'
import sellerEnglish from '../../../seller-dashboard/src/locales/en.json'

// Module bodies run after every import above, so the admin client is the one
// registered here, until the seller client replaces it.
const adminClient = getApiClient()
createSellerApiClient()
const sellerClient = getApiClient()

export type Panel = 'admin' | 'seller'

const panels: Record<Panel, { client: PanelApiClient; english: Record<string, unknown> }> = {
  admin: { client: adminClient, english: adminEnglish },
  seller: { client: sellerClient, english: sellerEnglish },
}

let active: Panel | null = null

/**
 * Registers a panel's API client and lays its English strings over the
 * framework's, as that panel does at boot. A few keys differ between the
 * panels, so the last one applied must be the story's own.
 */
export function applyPanel(panel: Panel): void {
  if (i18n.language !== 'en') void i18n.changeLanguage('en')
  if (active === panel) return

  setApiClient(panels[panel].client)
  i18n.addResourceBundle('en', 'translation', coreEnglish, true, true)
  i18n.addResourceBundle('en', 'translation', panels[panel].english, true, true)
  active = panel
}
