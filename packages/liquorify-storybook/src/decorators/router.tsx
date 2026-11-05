import type { Decorator, Loader } from '@storybook/react-vite'
import {
  type AnyRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useRouterState,
} from '@tanstack/react-router'
import { createContext, type ReactNode, useContext } from 'react'

/** Where a story's component sits, through `parameters.liquorify.route`. */
export interface StoryRoute {
  /**
   * The route the component is rendered under, such as `/$storeId/products/$productId`.
   * A pattern starting `/_authenticated/` is the dashboard's route id, for a
   * component that reads its route by that id.
   */
  pattern: string
  /** The address the story opens at, such as `/store_9Fh2Lq4c/products/prod_1`. */
  path: string
  /**
   * Names the address a link the story follows opens, in place of the page,
   * for a story about where a control leads. Otherwise that address renders
   * nothing.
   */
  showDestination?: boolean
}

const StoryElement = createContext<ReactNode>(null)

function StoryAtRoute() {
  return useContext(StoryElement)
}

function Destination() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return <p className="text-sm">Opened {pathname}</p>
}

/**
 * Builds an in-memory router before the story renders, so the first render
 * already has its route matched. Any other address, such as a link the story
 * follows, renders nothing.
 */
export const routerLoader: Loader = async (context) => {
  const route: StoryRoute | undefined = context.parameters.liquorify?.route
  if (!route) return {}

  const rootRoute = createRootRoute()
  // A component that reads its route by the dashboard's own route id, such as
  // `/_authenticated/$storeId/products/categories/$categoryId`, needs the
  // signed-in layout's pathless route above it, as in the dashboard.
  const layoutPrefix = '/_authenticated/'
  const underLayout = route.pattern.startsWith(layoutPrefix)
  const layoutRoute = underLayout
    ? createRoute({ getParentRoute: () => rootRoute, id: '_authenticated', component: Outlet })
    : null
  // A component can also read the store's own route, `/_authenticated/$storeId`,
  // from deeper down, so a page under a store gets that route above it too.
  const storePrefix = `${layoutPrefix}$storeId/`
  const storeRoute =
    layoutRoute && route.pattern.startsWith(storePrefix)
      ? createRoute({ getParentRoute: () => layoutRoute, path: '$storeId', component: Outlet })
      : null
  const storyRoute = storeRoute
    ? createRoute({
        getParentRoute: () => storeRoute,
        path: route.pattern.slice(storePrefix.length - 1),
        component: StoryAtRoute,
      })
    : layoutRoute
      ? createRoute({
          getParentRoute: () => layoutRoute,
          path: route.pattern.slice(layoutPrefix.length - 1),
          component: StoryAtRoute,
        })
      : createRoute({
          getParentRoute: () => rootRoute,
          path: route.pattern,
          component: StoryAtRoute,
        })
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      layoutRoute
        ? layoutRoute.addChildren([storeRoute ? storeRoute.addChildren([storyRoute]) : storyRoute])
        : storyRoute,
      createRoute({
        getParentRoute: () => rootRoute,
        path: '$',
        component: route.showDestination ? Destination : () => null,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: [route.path] }),
  })
  await router.load()
  return { router }
}

export const withRouter: Decorator = (Story, context) => {
  const router: AnyRouter | undefined = context.loaded.router
  if (!router) return <Story />

  return (
    <StoryElement.Provider value={<Story />}>
      <RouterProvider router={router} />
    </StoryElement.Provider>
  )
}
