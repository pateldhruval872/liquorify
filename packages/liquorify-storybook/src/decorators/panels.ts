// Both panels boot the way their entry modules do: the admin dashboard
// registers the Admin API client and its translations as side effects, and the
// seller panel builds its client when asked. The framework holds one client and
// one set of English strings at a time, so each story re-applies its panel's.
import { getApiClient, i18n, type PanelApiClient, setApiClient } from '@spree/dashboard-core'
// Must come before either panel's translations load (see that file).
import { pristineEnglish } from './pristine-english'
import '../../../dashboard/src/api-client-setup'
import '../../../dashboard/src/i18n-setup'
import { createSellerApiClient } from '../../../seller-dashboard/src/api-client'
import '../../../seller-dashboard/src/i18n'

// Module bodies run after every import above, so the admin client is the one
// registered here, until the seller client replaces it.
const adminClient = getApiClient()
createSellerApiClient()
const sellerClient = getApiClient()

export type Panel = 'admin' | 'seller'

const panels: Record<Panel, { client: PanelApiClient; english: Record<string, unknown> }> = {
  admin: { client: adminClient, english: pristineEnglish.admin },
  seller: { client: sellerClient, english: pristineEnglish.seller },
}

let active: Panel | null = null

/**
 * Registers a panel's API client and gives it the English strings that panel
 * has at boot: the framework's, with its own laid over them. The bundle is
 * rebuilt rather than merged, so a key only the other panel defines reads as
 * a missing key here, as it does in the running panel (G-115).
 */
export function applyPanel(panel: Panel): void {
  if (i18n.language !== 'en') void i18n.changeLanguage('en')
  if (active === panel) return

  setApiClient(panels[panel].client)
  i18n.removeResourceBundle('en', 'translation')
  i18n.addResourceBundle('en', 'translation', structuredClone(pristineEnglish.core), true, true)
  i18n.addResourceBundle('en', 'translation', structuredClone(panels[panel].english), true, true)
  active = panel
}
