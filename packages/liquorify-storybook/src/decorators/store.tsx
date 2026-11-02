import type { PermissionRule, Store } from '@spree/admin-sdk'
import { StoreProvider } from '@spree/dashboard-core'
import type { Decorator } from '@storybook/react-vite'
import { fullAccess } from '../fixtures/admin/session'
import { shellStore } from '../fixtures/admin/shell'
import { adminSession } from '../mocks/handlers/admin/session'
import { storeRequest } from '../mocks/handlers/admin/settings'

/**
 * Places a component inside the admin dashboard's store, as the store layout
 * does for every store page, so it reads the store's currencies, languages,
 * default country and setup tasks.
 */
export const withStore: Decorator = (Story) => (
  <StoreProvider storeId={shellStore.id}>
    <Story />
  </StoreProvider>
)

/**
 * A signed-in admin in the store, with the session and the store answered.
 * The store provider reads the session, so the story is signed in.
 */
export function storeParameters(store: Store = shellStore, rules: PermissionRule[] = fullAccess) {
  return {
    liquorify: { signedIn: true, storeId: shellStore.id },
    msw: { handlers: { session: adminSession(rules), store: storeRequest(store) } },
  }
}
