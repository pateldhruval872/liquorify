import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { FIXTURE_NOW } from '../src/fixtures/clock'
import { modes, phoneModes } from './modes'

interface IndexEntry {
  id: string
  title: string
  name: string
  type: 'story' | 'docs'
  tags?: string[]
}

const index: { entries: Record<string, IndexEntry> } = JSON.parse(
  readFileSync(new URL('../storybook-static/index.json', import.meta.url), 'utf8'),
)
const stories = Object.values(index.entries).filter((entry) => entry.type === 'story')

/**
 * Images allowed more counted pixels than the configuration's 25, by story ID
 * and mode. Sampled CI runners shaded the ends of these stories' rounded option
 * chip borders slightly differently from the references, by up to 38 counted
 * pixels. Recorded, with the owner's approval, in
 * liquorify/verification/2026-11-02-fb-19-chip-screenshot-allowance.md. The
 * threshold is unchanged, and every other image keeps 25.
 */
const pixelAllowances: Readonly<Record<string, number>> = {
  'dashboard-core-product-form-variants-section--seeded-from-type/dark': 60,
  'dashboard-core-product-form-variants-options-builder--awaiting-values/dark': 60,
}
for (const key of Object.keys(pixelAllowances)) {
  const [id, modeName] = key.split('/')
  if (!stories.some((story) => story.id === id) || !modes.some((mode) => mode.name === modeName)) {
    throw new Error(`The pixel allowance for ${key} names no captured story and mode`)
  }
}

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

function findFile(directory: string, suffix: string): string | undefined {
  if (!existsSync(directory)) return undefined
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isFile() && entry.name.endsWith(suffix)) return entryPath
    if (entry.isDirectory()) {
      const found = findFile(entryPath, suffix)
      if (found) return found
    }
  }
  return undefined
}

/**
 * Writes to the log where a failed comparison differs, for anyone who cannot
 * download CI's failure images: the processor, the box holding the changed
 * pixels, how many changed and by how much, the 40-pixel squares where most
 * changed, and both images cropped around the busiest square as PNG data,
 * 320 by 200 pixels.
 */
async function describeDifference(page: Page, outputDir: string) {
  const actual = findFile(outputDir, '-actual.png')
  const expected = findFile(outputDir, '-expected.png')
  if (!actual || !expected) return
  const processor =
    readFileSync('/proc/cpuinfo', 'utf8').match(/^model name\s*:\s*(.+)$/m)?.[1] ?? 'unknown'
  const probe = await page.context().newPage()
  const summary = await probe.evaluate(
    async ([actualData, expectedData]) => {
      const load = (data: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.onerror = reject
          image.src = `data:image/png;base64,${data}`
        })
      const canvasOf = (image: HTMLImageElement) => {
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        canvas.getContext('2d')?.drawImage(image, 0, 0)
        return canvas
      }
      const [actualImage, expectedImage] = await Promise.all([load(actualData), load(expectedData)])
      const width = Math.min(actualImage.width, expectedImage.width)
      const height = Math.min(actualImage.height, expectedImage.height)
      const actualCanvas = canvasOf(actualImage)
      const expectedCanvas = canvasOf(expectedImage)
      const a = actualCanvas.getContext('2d')?.getImageData(0, 0, width, height).data
      const e = expectedCanvas.getContext('2d')?.getImageData(0, 0, width, height).data
      if (!a || !e) return 'the images could not be read'
      let changed = 0
      let largest = 0
      let left = width
      let top = height
      let right = -1
      let bottom = -1
      const columns = Math.ceil(width / 40)
      const squares = new Map<number, number>()
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const offset = (y * width + x) * 4
          const delta = Math.max(
            Math.abs(a[offset] - e[offset]),
            Math.abs(a[offset + 1] - e[offset + 1]),
            Math.abs(a[offset + 2] - e[offset + 2]),
            Math.abs(a[offset + 3] - e[offset + 3]),
          )
          if (delta === 0) continue
          changed += 1
          largest = Math.max(largest, delta)
          left = Math.min(left, x)
          top = Math.min(top, y)
          right = Math.max(right, x)
          bottom = Math.max(bottom, y)
          const square = Math.floor(y / 40) * columns + Math.floor(x / 40)
          squares.set(square, (squares.get(square) ?? 0) + 1)
        }
      }
      if (changed === 0) return `${width} by ${height}, no pixel changed`
      const busiest = [...squares.entries()].sort((first, second) => second[1] - first[1])
      const square = (entry: [number, number]) =>
        `x ${(entry[0] % columns) * 40}, y ${Math.floor(entry[0] / columns) * 40}: ${entry[1]}`
      const [first] = busiest[0]
      const cropWidth = Math.min(320, width)
      const cropHeight = Math.min(200, height)
      const centreX = (first % columns) * 40 + 20
      const centreY = Math.floor(first / columns) * 40 + 20
      const cropLeft = Math.min(Math.max(0, centreX - 160), width - cropWidth)
      const cropTop = Math.min(Math.max(0, centreY - 100), height - cropHeight)
      const crop = (source: HTMLCanvasElement) => {
        const canvas = document.createElement('canvas')
        canvas.width = cropWidth
        canvas.height = cropHeight
        canvas
          .getContext('2d')
          ?.drawImage(source, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
        return canvas.toDataURL('image/png')
      }
      return [
        `${width} by ${height}; ${changed} pixels changed, by up to ${largest} of 255, between x ${left} to ${right} and y ${top} to ${bottom}`,
        `busiest squares, ${busiest.slice(0, 6).map(square).join('; ')}`,
        `crop from x ${cropLeft}, y ${cropTop}`,
        `actual ${crop(actualCanvas)}`,
        `expected ${crop(expectedCanvas)}`,
      ].join('\n')
    },
    [readFileSync(actual).toString('base64'), readFileSync(expected).toString('base64')],
  )
  await probe.close()
  console.log(`The images differ, on ${processor}: ${summary}`)
}

for (const story of stories) {
  for (const mode of story.tags?.includes('phone') ? phoneModes : modes) {
    test(`${story.title} / ${story.name} / ${mode.name}`, async ({ page, baseURL }, testInfo) => {
      const outside: string[] = []
      const open = new Set<unknown>()
      let lastRequestChange = Date.now()
      page.on('request', (request) => {
        open.add(request)
        lastRequestChange = Date.now()
        const url = new URL(request.url())
        if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== baseURL) {
          outside.push(request.url())
        }
      })
      const settled = (request: unknown) => {
        open.delete(request)
        lastRequestChange = Date.now()
      }
      page.on('requestfinished', settled)
      page.on('requestfailed', settled)
      await page.context().route(
        (url) => url.origin !== baseURL && !['data:', 'blob:'].includes(url.protocol),
        (route) => route.abort(),
      )

      await page.addInitScript(recordStoryFailures)
      await page.setViewportSize({ width: mode.width, height: mode.height })
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
      // In the pinned image Playwright now and then never counts a page that
      // holds a frame as idle, with no request open (the media preview's
      // external video, about one run in five). After ten seconds the check
      // settles for what idle means: no request open for half a second.
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() =>
        expect
          .poll(() => open.size === 0 && Date.now() - lastRequestChange >= 500, {
            timeout: 10_000,
          })
          .toBe(true),
      )

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
      const allowance = pixelAllowances[`${story.id}/${mode.name}`]
      try {
        await expect(target).toHaveScreenshot(name, allowance ? { maxDiffPixels: allowance } : {})
      } catch (error) {
        await describeDifference(page, testInfo.outputDir).catch(() => undefined)
        throw error
      }

      expect(outside, 'no request left the local Storybook server').toEqual([])
    })
  }
}
