import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { FIXTURE_NOW } from '../src/fixtures/clock'
import { modes } from './modes'

interface IndexEntry {
  id: string
  title: string
  name: string
  type: 'story' | 'docs'
}

const index: { entries: Record<string, IndexEntry> } = JSON.parse(
  readFileSync(new URL('../storybook-static/index.json', import.meta.url), 'utf8'),
)
const stories = Object.values(index.entries).filter((entry) => entry.type === 'story')

declare global {
  interface Window {
    __STORYBOOK_PREVIEW__?: {
      currentRender?: { phase?: string; story?: { parameters?: Record<string, any> } }
    }
    __storyFailures?: string[]
  }
}

/**
 * Records every failure Storybook reports for the story. A play function that
 * throws still ends in the `finished` phase, so the phase alone would let a
 * story whose steps failed be captured as if it had reached its state. The
 * preview assigns its event channel to a global as it boots; the recorder
 * subscribes the moment it does, before any story renders.
 */
function recordStoryFailures() {
  const failures: string[] = []
  window.__storyFailures = failures
  let channel: { on: (event: string, listener: (detail: unknown) => void) => void } | undefined
  Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', {
    configurable: true,
    get: () => channel,
    set: (value) => {
      channel = value
      for (const event of [
        'storyErrored',
        'storyThrewException',
        'playFunctionThrewException',
        'unhandledErrorsWhilePlaying',
      ]) {
        value.on(event, (detail: unknown) => {
          const message =
            detail && typeof detail === 'object' && 'message' in detail
              ? String(detail.message)
              : JSON.stringify(detail)
          failures.push(`${event}: ${message.split('\n')[0]}`)
        })
      }
    },
  })
}

const screenshotOptions = { animations: 'disabled', caret: 'hide', scale: 'css' } as const

/**
 * A screenshot once two in a row are identical, as Playwright's own
 * comparison waits for.
 */
async function stableScreenshot(target: Page | Locator): Promise<Buffer> {
  let previous = await target.screenshot(screenshotOptions)
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const current = await target.screenshot(screenshotOptions)
    if (current.equals(previous)) return current
    previous = current
  }
  throw new Error('The story kept changing between screenshots')
}

for (const story of stories) {
  for (const mode of modes) {
    test(`${story.title} / ${story.name} / ${mode.name}`, async ({ page, baseURL }, testInfo) => {
      const outside: string[] = []
      page.on('request', (request) => {
        const url = new URL(request.url())
        if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== baseURL) {
          outside.push(request.url())
        }
      })
      await page.context().route(
        (url) => url.origin !== baseURL && !['data:', 'blob:'].includes(url.protocol),
        (route) => route.abort(),
      )

      await page.addInitScript(recordStoryFailures)
      await page.setViewportSize({ width: mode.width, height: 800 })
      await page.emulateMedia({ colorScheme: mode.colorScheme, reducedMotion: 'reduce' })
      await page.clock.setFixedTime(FIXTURE_NOW)
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${mode.theme}`)

      // Storybook has rendered the story and run its play function, or failed.
      await page.waitForFunction(() =>
        ['completed', 'finished', 'afterEach', 'errored', 'aborted'].includes(
          window.__STORYBOOK_PREVIEW__?.currentRender?.phase ?? '',
        ),
      )
      const phase = await page.evaluate(() => window.__STORYBOOK_PREVIEW__?.currentRender?.phase)
      expect(phase, 'the story rendered without an error').not.toMatch(/errored|aborted/)
      const failures = await page.evaluate(() => window.__storyFailures ?? [])
      expect(failures, 'the story and its play function ran without an error').toEqual([])
      await page.evaluate(() => document.fonts.ready)
      await page.waitForLoadState('networkidle')

      // A popup renders outside the story's root, so its story captures the viewport.
      const { capture, layout } = await page.evaluate(() => {
        const parameters = window.__STORYBOOK_PREVIEW__?.currentRender?.story?.parameters
        return { capture: parameters?.liquorify?.capture, layout: parameters?.layout }
      })
      // A focus ring or shadow paints up to a few pixels past the root, so the
      // root is captured with room around it, taken from the padded layout's
      // own padding without moving the story.
      if (capture !== 'viewport' && layout === 'padded') {
        await page.addStyleTag({ content: '#storybook-root { margin: -8px; padding: 8px; }' })
      }
      const target = capture === 'viewport' ? page : page.locator('#storybook-root')
      const name = [story.id, `${mode.name}.png`]

      // Playwright writes nothing for a missing reference when it may not
      // update references, as in CI, so the image is saved for a person to
      // review and copy into the repository in a pull request.
      const reference = testInfo.snapshotPath(...name)
      if (testInfo.config.updateSnapshots === 'none' && !existsSync(reference)) {
        const proposed = testInfo.outputPath('proposed', ...name)
        mkdirSync(path.dirname(proposed), { recursive: true })
        writeFileSync(proposed, await stableScreenshot(target))
        await testInfo.attach('proposed reference', { path: proposed, contentType: 'image/png' })
        throw new Error(`No reference image yet for ${name.join('/')}; a proposed one is attached`)
      }
      await expect(target).toHaveScreenshot(name)

      expect(outside, 'no request left the local Storybook server').toEqual([])
    })
  }
}
