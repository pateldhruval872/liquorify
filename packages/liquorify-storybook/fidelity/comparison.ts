import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { paintOut } from './developers'

/**
 * The diagnostic comparison's parts, for a batch that keeps its cases in a
 * file of its own: each story beside the same component on Spree's running
 * screen, in the same browser, with both sides' computed styles. They are
 * `compare.spec.ts`'s, which keeps its own copy until it moves to this file.
 *
 * `FIDELITY_STORYBOOK_URL` sets where the built Storybook is served, port
 * 6007 by default, so a second checkout can serve it elsewhere.
 */

export const STORYBOOK = process.env.FIDELITY_STORYBOOK_URL ?? 'http://localhost:6007'
const results = new URL('./results/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

/** The styles compared on every element, chosen to catch a wrong token, size or variant. */
const properties = [
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-bottom-width',
  'border-bottom-color',
  'border-top-left-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'height',
  'box-shadow',
  'opacity',
  'gap',
]

type Styles = Record<string, Record<string, string>>

declare global {
  interface Window {
    __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } }
  }
}

/**
 * The computed styles of the target and everything inside it, one entry for
 * each distinct element (tag, classes and slot), so the same part on both sides
 * is compared however many rows the data gives it.
 */
async function collectStyles(target: Locator): Promise<Styles> {
  return target.evaluate((root, names) => {
    const styles: Record<string, Record<string, string>> = {}
    const visit = (element: Element) => {
      const key = [
        element.tagName.toLowerCase(),
        element.getAttribute('data-slot') ?? '',
        element.getAttribute('class') ?? '',
      ].join('|')
      if (!styles[key]) {
        const computed = getComputedStyle(element)
        styles[key] = Object.fromEntries(
          names.map((name) => [name, computed.getPropertyValue(name)]),
        )
      }
      for (const child of element.children) visit(child)
    }
    visit(root)
    return styles
  }, properties)
}

function compareStyles(screen: Styles, story: Styles) {
  const differences: { element: string; property: string; screen: string; story: string }[] = []
  for (const [element, values] of Object.entries(screen)) {
    const other = story[element]
    if (!other) continue
    for (const property of properties) {
      if (values[property] !== other[property]) {
        differences.push({ element, property, screen: values[property], story: other[property] })
      }
    }
  }
  return {
    compared: Object.keys(screen).filter((element) => element in story).length,
    onlyOnScreen: Object.keys(screen).filter((element) => !(element in story)),
    onlyInStory: Object.keys(story).filter((element) => !(element in screen)),
    differences,
  }
}

export async function openStory(page: Page, id: string, theme: 'light' | 'dark', held = false) {
  await page.goto(`${STORYBOOK}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
  await page.waitForFunction(() =>
    ['completed', 'finished', 'afterEach'].includes(
      window.__STORYBOOK_PREVIEW__?.currentRender?.phase ?? '',
    ),
  )
  await page.evaluate(() => document.fonts.ready)
  // A story that holds a request open never lets the network go quiet.
  if (!held) await page.waitForLoadState('networkidle')
}

async function sideBySide(page: Page, screen: Buffer, story: Buffer, path: string) {
  const image = (buffer: Buffer) => `data:image/png;base64,${buffer.toString('base64')}`
  await page.setContent(`
    <body style="margin:0;font:14px sans-serif;display:flex;gap:16px;padding:16px;background:#ddd;width:max-content">
      <figure style="margin:0"><figcaption>Running screen</figcaption><img src="${image(screen)}"></figure>
      <figure style="margin:0"><figcaption>Story</figcaption><img src="${image(story)}"></figure>
    </body>`)
  await page.screenshot({ path, fullPage: true })
}

export interface Case {
  /** LIQ-009 inventory ID. */
  id: string
  /** What is compared, for the results folder. */
  name: string
  /** The story's ID in the built Storybook. */
  story: string
  /** Opens the running screen and returns the component there. */
  screen: (page: Page) => Promise<Locator>
  /** The component in the story. */
  inStory: (page: Page) => Promise<Locator> | Locator
  /** Captures the window instead of the component, for popups. */
  viewport?: boolean
  /** Opens both sides in a window this size, for a component taller than the default. */
  window?: { width: number; height: number }
  /** The story holds a request open, to show what loads. */
  held?: boolean
  /** Elements painted out of both images, because they show a secret. */
  paintedOut?: string
  /** Removes or restores what the case changed through the running screen. */
  after?: () => Promise<void>
}

export async function adminPage(page: Page, path: string) {
  const session = await login(page)
  await page.goto(`/${session.store_id}${path}`)
  await page.waitForLoadState('networkidle')
}

/** Registers each case in light and dark, saving both images side by side with their styles. */
export function compareCases(cases: Case[]) {
  for (const theme of ['light', 'dark'] as const) {
    for (const item of cases) {
      test(`${item.id} ${item.name} ${theme}`, async ({ page, browser }) => {
        const folder = `${results}${item.name}/`
        mkdirSync(folder, { recursive: true })
        if (item.window) await page.setViewportSize(item.window)
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
        const hidden = item.paintedOut ? { style: paintOut(item.paintedOut) } : {}
        try {
          const onScreen = await item.screen(page)
          await expect(onScreen).toBeVisible({ timeout: 20_000 })
          await page.waitForTimeout(500)
          // Styles first: a value painted out for the screenshot fades back
          // afterwards, and its colours would be read halfway.
          const screenStyles = await collectStyles(onScreen)
          const screenImage = await (item.viewport ? page : onScreen).screenshot(hidden)
          const screenWidth = (await onScreen.boundingBox())?.width

          const storyPage = await browser.newPage({
            viewport: item.window ?? { width: 1280, height: 800 },
          })
          await storyPage.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
          await openStory(storyPage, item.story, theme, item.held)
          const inStory = await item.inStory(storyPage)
          await expect(inStory).toBeVisible()
          await storyPage.waitForTimeout(500)
          const storyStyles = await collectStyles(inStory)
          const storyImage = await (item.viewport ? storyPage : inStory).screenshot(hidden)
          const storyWidth = (await inStory.boundingBox())?.width

          writeFileSync(`${folder}${theme}-screen.png`, screenImage)
          writeFileSync(`${folder}${theme}-story.png`, storyImage)
          await sideBySide(storyPage, screenImage, storyImage, `${folder}${theme}-side-by-side.png`)
          writeFileSync(
            `${folder}${theme}-styles.json`,
            JSON.stringify(
              {
                id: item.id,
                story: item.story,
                theme,
                revision,
                screenWidth,
                storyWidth,
                ...compareStyles(screenStyles, storyStyles),
                styles: { screen: screenStyles, story: storyStyles },
              },
              null,
              2,
            ),
          )
          await storyPage.close()
        } finally {
          await item.after?.()
        }
      })
    }
  }
}
