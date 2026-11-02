import type { Decorator, Loader } from '@storybook/react-vite'
import {
  type AnyRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { createContext, type ReactNode, useContext } from 'react'

/** Where a story's component sits, through `parameters.liquorify.route`. */
export interface StoryRoute {
  /** The route the component is rendered under, such as `/$storeId/products/$productId`. */
  pattern: string
  /** The address the story opens at, such as `/store_9Fh2Lq4c/products/prod_1`. */
  path: string
}

const StoryElement = createContext<ReactNode>(null)

function StoryAtRoute() {
  return useContext(StoryElement)
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
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({
        getParentRoute: () => rootRoute,
        path: route.pattern,
        component: StoryAtRoute,
      }),
      createRoute({ getParentRoute: () => rootRoute, path: '$', component: () => null }),
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
