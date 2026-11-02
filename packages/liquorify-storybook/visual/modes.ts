/** One way a story is captured: a theme, the colour scheme the browser reports, and a size. */
export interface CaptureMode {
  name: string
  theme: 'light' | 'dark'
  colorScheme: 'light' | 'dark'
  width: number
  height: number
}

/** The dashboard surfaces are captured in both themes at one desktop width (LIQ-010 §8). */
export const modes: CaptureMode[] = [
  { name: 'light', theme: 'light', colorScheme: 'light', width: 1280, height: 800 },
  { name: 'dark', theme: 'dark', colorScheme: 'dark', width: 1280, height: 800 },
]

/**
 * A story tagged `phone` shows a part of the dashboard that exists only below
 * its 768-pixel breakpoint, such as the shell's top bar, so it is captured at a
 * phone's width instead, in both themes.
 */
export const phoneModes: CaptureMode[] = [
  { name: 'phone-light', theme: 'light', colorScheme: 'light', width: 390, height: 844 },
  { name: 'phone-dark', theme: 'dark', colorScheme: 'dark', width: 390, height: 844 },
]
