import type { Page } from '@playwright/test'

/**
 * Waits for every animation that ends, such as a dialog's fade-in, to finish,
 * so a screenshot shows where the screen settles. Looping animations, like a
 * spinner's, and those driven by scrolling, like the rail's scroll fades, never
 * end and are left running.
 */
export async function animationsFinished(page: Page) {
  // A transition starts a frame after its element appears, so two frames pass first.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  )
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== 'running' ||
          animation.timeline !== document.timeline ||
          animation.effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY,
      ),
  )
}
