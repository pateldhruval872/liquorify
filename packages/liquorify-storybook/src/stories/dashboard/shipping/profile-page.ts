import type { DeliveryProfile, PermissionRule } from '@spree/admin-sdk'
import type { HttpHandler } from 'msw'
import type { Column } from '../../../decorators/providers'
import type { StoryRoute } from '../../../decorators/router'
import { storeParameters } from '../../../decorators/store'
import { generalProfile } from '../../../fixtures/admin/delivery'
import { shellStore } from '../../../fixtures/admin/shell'
import { profilePageRequests } from '../../../mocks/handlers/admin/delivery'

/** A delivery profile's page (DA-SET-17), with the method sheet's search when one is open. */
export function profileRoute(profile: DeliveryProfile = generalProfile, search = ''): StoryRoute {
  return {
    pattern: '/$storeId/settings/delivery-profiles/$profileId',
    path: `/${shellStore.id}/settings/delivery-profiles/${profile.id}${search}`,
  }
}

interface ProfileOptions {
  route?: StoryRoute
  rules?: PermissionRule[]
  column?: Column
  /** A sheet or dialog is open, rendered outside the story against the window's edge. */
  viewport?: boolean
  /** Answers before the store's records, for a held or refused request. */
  first?: HttpHandler[]
  requests?: ReturnType<typeof profilePageRequests>
}

/** A signed-in admin on a profile page, with every record the page and its sheets read. */
export function profileParameters({
  route = profileRoute(),
  rules,
  column,
  viewport = false,
  first = [],
  requests = profilePageRequests(),
}: ProfileOptions = {}) {
  const base = storeParameters(undefined, rules)
  return {
    liquorify: {
      ...base.liquorify,
      route,
      ...(column && { column }),
      ...(viewport && { capture: 'viewport' }),
    },
    // `first` leads, so the key keeps its place when a story's handlers
    // are merged over the meta's, and its answers win.
    msw: { handlers: { first, ...base.msw.handlers, ...requests } },
  }
}
