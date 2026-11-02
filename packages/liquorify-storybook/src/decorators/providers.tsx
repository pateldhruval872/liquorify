import {
  AuthProvider,
  PermissionProvider,
  queryClient,
  TenantProvider,
} from '@spree/dashboard-core'
import { ConfirmProvider, ThemeProvider, TooltipProvider, useTheme } from '@spree/dashboard-ui'
import type { Decorator } from '@storybook/react-vite'
import { QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useEffect } from 'react'
import { applyPanel, type Panel } from './panels'

/**
 * What a story asks of its surroundings, through `parameters.liquorify`.
 *
 * `panel` picks the API client and wording (the admin dashboard's unless the
 * story is a seller panel component). `signedIn` mounts the real auth and
 * permission providers, which read the session through the mocked API.
 */
export interface StoryNeeds {
  panel?: Panel
  signedIn?: boolean
  /** The seller the panel acts for, as the seller panel's route layout sets it. */
  sellerId?: string
  /**
   * The store whose pages the component sits on, as the admin dashboard's
   * store route sets it. Queries made below that route are keyed by the store,
   * apart from the signed-in admin's own permissions, which load above every
   * store; without it the role sheet's permission catalog and those
   * permissions share one cache entry.
   */
  storeId?: string
  /** The page column a component fills on its screen, for components that take their container's width. */
  column?: Column
  /**
   * Leaves the theme on "System", where the running dashboard starts, so the
   * browser's colour scheme decides it rather than the toolbar. The visual
   * check reports the colour scheme of each capture's theme, so both still
   * agree there; for the account menu, whose theme control shows the choice.
   */
  systemTheme?: boolean
}

/**
 * The width of each page column in the running panels, measured at the
 * 1280-pixel capture width: a page's main column, and a settings page beside
 * its settings menu.
 */
export const columnWidths = { page: 965, settings: 890 } as const

export type Column = keyof typeof columnWidths

function ThemeFromToolbar({ theme }: { theme: 'light' | 'dark' | 'system' }) {
  const { setMode } = useTheme()
  useEffect(() => setMode(theme), [theme, setMode])
  return null
}

let lastStoryId: string | null = null

/**
 * Spree's own providers, in the order each panel mounts them
 * (`packages/dashboard/src/dashboard.tsx`, `packages/seller-dashboard/src/seller-dashboard.tsx`).
 */
export const withPanelProviders: Decorator = (Story, context) => {
  const needs: StoryNeeds = context.parameters.liquorify ?? {}
  const panel = needs.panel ?? 'admin'
  applyPanel(panel)

  // The panels share one query client; a new story starts with nothing cached.
  if (context.id !== lastStoryId) {
    queryClient.clear()
    lastStoryId = context.id
  }

  const theme = needs.systemTheme ? 'system' : context.globals.theme === 'dark' ? 'dark' : 'light'
  const signedIn = (children: ReactNode) =>
    needs.signedIn ? (
      <AuthProvider>
        <PermissionProvider>{children}</PermissionProvider>
      </AuthProvider>
    ) : (
      children
    )
  const tenantId = needs.sellerId ?? needs.storeId
  const tenant = (children: ReactNode) =>
    tenantId ? <TenantProvider id={tenantId}>{children}</TenantProvider> : children
  const chrome = (children: ReactNode) => (
    <TooltipProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </TooltipProvider>
  )
  const story = tenant(
    needs.column ? (
      <div data-story-column={needs.column} style={{ width: columnWidths[needs.column] }}>
        <Story />
      </div>
    ) : (
      <Story />
    ),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemeFromToolbar theme={theme} />
        {panel === 'admin' ? signedIn(chrome(story)) : chrome(signedIn(story))}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
