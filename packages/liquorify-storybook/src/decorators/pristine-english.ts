import coreEnglish from '@spree/dashboard-core/locales/en.json'
import adminEnglish from '../../../dashboard/src/locales/en.json'
import sellerEnglish from '../../../seller-dashboard/src/locales/en.json'

// Copies taken before either panel's translations load. i18next merges a
// bundle into the store by reference, so once both panels have loaded, the
// imported files themselves hold the other panel's keys.
export const pristineEnglish = {
  core: structuredClone(coreEnglish),
  admin: structuredClone(adminEnglish),
  seller: structuredClone(sellerEnglish),
}
