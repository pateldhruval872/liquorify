/** One way a story is captured: a theme, the colour scheme the browser reports, and a width. */
export interface CaptureMode {
  name: string
  theme: 'light' | 'dark'
  colorScheme: 'light' | 'dark'
  width: number
}

/** The dashboard surfaces are captured in both themes at one desktop width (LIQ-010 §8). */
export const modes: CaptureMode[] = [
  { name: 'light', theme: 'light', colorScheme: 'light', width: 1280 },
  { name: 'dark', theme: 'dark', colorScheme: 'dark', width: 1280 },
]
