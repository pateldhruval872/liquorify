import type { AdminUser, PermissionRule, Store, UpdateStatus } from '@spree/admin-sdk'
import {
  AppShell,
  AppShellProvider,
  CommandPaletteProvider,
  PageHeader,
  StoreProvider,
} from '@spree/dashboard-core'
import { DownloadIcon, PlusIcon } from '@spree/dashboard-ui/icons'
import { Button } from '@spree/dashboard-ui/ui/button'
import type { Decorator, Parameters } from '@storybook/react-vite'
import { useRouterState } from '@tanstack/react-router'
import { type ReactNode, useState } from 'react'
import { CommandPalette } from '../../../../../dashboard/src/components/spree/command-palette/command-palette'
import { Notifications } from '../../../../../dashboard/src/components/spree/notifications'
import { ProfileDialog } from '../../../../../dashboard/src/components/spree/profile-dialog'
import { useDashboardCounters } from '../../../../../dashboard/src/hooks/use-dashboard-counters'
import { getAvailableUiLocales } from '../../../../../dashboard/src/i18n-setup'
// The navigation, settings navigation and command palette entries the
// dashboard registers at boot (`packages/dashboard/src/dashboard.tsx`).
import '../../../../../dashboard/src/nav/default'
import '../../../../../dashboard/src/nav/settings'
import '../../../../../dashboard/src/search/create-actions'
import '../../../../../dashboard/src/search/default'
import type { StoryRoute } from '../../../decorators/router'
import { fullAccess } from '../../../fixtures/admin/session'
import { shellStore, twoStoreAdmin } from '../../../fixtures/admin/shell'
import { adminSession } from '../../../mocks/handlers/admin/session'
import { searchResults, shellRequests } from '../../../mocks/handlers/admin/shell'

const UI_LOCALES = getAvailableUiLocales()

/**
 * The admin dashboard's store layout, `routes/_authenticated/$storeId.tsx`,
 * which renders only inside the generated route tree. This is the same tree,
 * line for line: the store, the command palette and the shell's providers,
 * the shell with its notifications bell and profile dialog, and the palette.
 * Every story of a part of the shell shows it in this frame, as every store
 * page does.
 */
function StoreLayout({ storeId, children }: { storeId: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const inSettings = pathname.startsWith(`/${storeId}/settings`)

  return (
    <StoreProvider storeId={storeId}>
      <CommandPaletteProvider>
        <AppShellProvider>
          <StoreShell inSettings={inSettings}>{children}</StoreShell>
        </AppShellProvider>
        <CommandPalette />
      </CommandPaletteProvider>
    </StoreProvider>
  )
}

function StoreShell({ inSettings, children }: { inSettings: boolean; children: ReactNode }) {
  useDashboardCounters()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <AppShell
      inSettings={inSettings}
      uiLocales={UI_LOCALES}
      onEditProfile={() => setProfileOpen(true)}
      notifications={<Notifications />}
    >
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      {children}
    </AppShell>
  )
}

/**
 * A page's own header, standing in for the page the shell frames: the staff
 * page in settings, and otherwise the page the story opens at, named as the
 * dashboard names it.
 */
export function ShellPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // The settings layout's container (`routes/_authenticated/$storeId/settings.tsx`).
  if (pathname.includes('/settings')) {
    return (
      <div className="container mx-auto flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <PageHeader
          title="Staff"
          description="Manage admin teammates and roles"
          docsPath="settings/users"
          actions={
            <Button>
              <PlusIcon className="size-4" />
              Invite teammate
            </Button>
          }
        />
      </div>
    )
  }
  if (pathname === pages.home.path) {
    return <PageHeader title="Dashboard" description="Overview of your store performance" />
  }
  if (pathname === pages.returns.path) return <PageHeader title="Returns" />
  if (pathname === pages.order.path) {
    return <PageHeader title="R1042" description="Placed on 30 September 2026" />
  }
  return (
    <PageHeader
      title="Orders"
      description="Every order placed with your store, and where each one stands."
      docsPath="orders"
      actions={
        <>
          <Button variant="outline">
            <DownloadIcon className="size-4" />
            Export
          </Button>
          <Button>
            <PlusIcon className="size-4" />
            New Order
          </Button>
        </>
      }
    />
  )
}

const storeId = shellStore.id

/** Pages the shell stories open at. */
export const pages = {
  home: { pattern: '/$storeId', path: `/${storeId}` },
  orders: { pattern: '/$storeId/orders', path: `/${storeId}/orders` },
  returns: { pattern: '/$storeId/returns', path: `/${storeId}/returns` },
  order: { pattern: '/$storeId/orders/$orderId', path: `/${storeId}/orders/or_7Fp2Kd9s` },
  staffSettings: { pattern: '/$storeId/settings/staff', path: `/${storeId}/settings/staff` },
} satisfies Record<string, StoryRoute>

/** Renders the story, which is the page, inside the store layout. */
export const withStoreLayout: Decorator = (Story) => (
  <StoreLayout storeId={storeId}>
    <Story />
  </StoreLayout>
)

/**
 * Starts the rail as the merchant last left it, which the sidebar remembers
 * in a cookie, and forgets it afterwards so the next story starts expanded.
 */
export function railLeft(open: boolean) {
  return () => {
    // biome-ignore lint/suspicious/noDocumentCookie: the sidebar keeps its state in this cookie the same way
    document.cookie = `sidebar_state=${open}; path=/`
    return () => {
      // biome-ignore lint/suspicious/noDocumentCookie: as above
      document.cookie = 'sidebar_state=; path=/; max-age=0'
    }
  }
}

interface ShellOptions {
  route?: StoryRoute
  user?: AdminUser
  rules?: PermissionRule[]
  keys?: string[]
  update?: UpdateStatus
  store?: Store
  /** Leaves the theme following the system, as the running dashboard starts. */
  systemTheme?: boolean
}

/**
 * A signed-in admin on a store page, with what the store layout asks for
 * answered. Captured as the window, which the shell fills.
 */
export function shellParameters({
  route = pages.orders,
  user = twoStoreAdmin,
  rules = fullAccess,
  keys,
  update,
  store,
  systemTheme,
}: ShellOptions = {}): Parameters {
  return {
    layout: 'fullscreen',
    liquorify: { signedIn: true, route, capture: 'viewport', systemTheme },
    msw: {
      handlers: {
        session: adminSession(rules, keys, user),
        shell: shellRequests(update, store),
        search: searchResults(),
      },
    },
  }
}
