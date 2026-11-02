import { useTheme } from '@spree/dashboard-ui'
import { useSyncExternalStore } from 'react'

interface TokenExtension {
  id: string
  source: string
  /** Absent for email values, which are not stylesheet declarations. */
  css?: { light: string; dark?: string }
  form: string
  modes?: { dark: unknown }
  derived?: string
  clippedToSrgb?: number
  clippedToSrgbDark?: number
  representable?: boolean
  note?: string
}

interface Token {
  $type?: string
  $value: unknown
  $description: string
  $extensions: { 'org.liquorify': TokenExtension }
}

export type TokenDocument = Record<string, Record<string, Token> | unknown>

interface Color {
  colorSpace: 'srgb'
  components: number[]
  alpha: number
  hex: string
}

function tokenAt(document: TokenDocument, alias: string): Token | undefined {
  const [group, name] = alias.slice(1, -1).split('.')
  return (document[group] as Record<string, Token> | undefined)?.[name]
}

/** A token's value in one theme, following aliases through the file. */
function valueIn(document: TokenDocument, token: Token, theme: 'light' | 'dark'): unknown {
  const extension = token.$extensions['org.liquorify']
  const value = theme === 'dark' && extension.modes ? extension.modes.dark : token.$value
  if (typeof value === 'string' && value.startsWith('{')) {
    const target = tokenAt(document, value)
    return target ? valueIn(document, target, theme) : value
  }
  return value
}

function isColor(value: unknown): value is Color {
  return typeof value === 'object' && value !== null && 'hex' in value
}

function describe(value: unknown): string {
  if (isColor(value)) return value.hex
  if (Array.isArray(value)) {
    return value.every((part) => typeof part === 'string')
      ? value.join(', ')
      : `${value.length} ${value.length === 1 ? 'layer' : 'layers'}`
  }
  if (typeof value === 'object' && value !== null && 'unit' in value) {
    const { value: amount, unit } = value as { value: number; unit: string }
    return `${amount}${unit}`
  }
  return String(value)
}

function subscribeToRootClass(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

/**
 * The class on the page's root element. The theme provider sets it in an
 * effect that runs after the table's own, so computed values are read again
 * whenever it changes.
 */
function useRootClass() {
  return useSyncExternalStore(subscribeToRootClass, () => document.documentElement.className)
}

/** What the browser computes for a custom property on the page, or nothing when it is not emitted. */
function computedValue(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function Swatch({ background }: { background: string }) {
  return (
    <span
      className="inline-block size-6 shrink-0 rounded border border-border align-middle"
      style={{ background }}
    />
  )
}

function Row({
  document,
  name,
  token,
  theme,
  live: showLive,
}: {
  document: TokenDocument
  name: string
  token: Token
  theme: 'light' | 'dark'
  live: boolean
}) {
  const extension = token.$extensions['org.liquorify']
  const cssName = showLive ? `--${name}` : name
  const fileValue = valueIn(document, token, theme)
  const live = showLive ? computedValue(cssName) : ''
  const declared = extension.css
    ? theme === 'dark' && extension.css.dark
      ? extension.css.dark
      : extension.css.light
    : extension.source

  return (
    <tr className="border-t border-border align-top">
      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{extension.id}</td>
      <td className="py-2 pr-4 font-mono text-xs">{cssName}</td>
      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{declared}</td>
      <td className="py-2 pr-4">
        <span className="flex items-center gap-2 font-mono text-xs">
          {isColor(fileValue) && <Swatch background={fileValue.hex} />}
          {fileValue === null ? extension.note : describe(fileValue)}
          {extension.representable === false && ' (not a Figma variable)'}
        </span>
      </td>
      {showLive && (
        <td className="py-2">
          <span className="flex items-center gap-2 font-mono text-xs">
            {token.$type === 'color' && live && <Swatch background={`var(${cssName})`} />}
            {live || <span className="text-muted-foreground">not emitted</span>}
          </span>
        </td>
      )}
    </tr>
  )
}

/**
 * The tokens of some groups of a token file, with what the file holds beside
 * what the browser computes for the same custom property in the current theme.
 */
export function TokenTable({
  document,
  groups,
  idPattern,
  live = true,
}: {
  document: TokenDocument
  groups?: string[]
  idPattern: RegExp
  /** Whether the values are custom properties the page can compute. Email values are not. */
  live?: boolean
}) {
  const { resolved } = useTheme()
  useRootClass()
  const entries = Object.entries(document).flatMap(([group, tokens]) =>
    group.startsWith('$') || (groups && !groups.includes(group))
      ? []
      : Object.entries(tokens as Record<string, Token>)
          .filter(([, token]) => idPattern.test(token.$extensions['org.liquorify'].id))
          .map(([name, token]) => ({ group, name, token })),
  )

  return (
    <table className="w-full text-left text-sm text-foreground">
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th className="pb-2 font-medium">ID</th>
          <th className="pb-2 font-medium">Token</th>
          <th className="pb-2 font-medium">{live ? 'Stylesheet' : 'Source'}</th>
          <th className="pb-2 font-medium">Token file</th>
          {live && <th className="pb-2 font-medium">Browser</th>}
        </tr>
      </thead>
      <tbody>
        {entries.map(({ group, name, token }) => (
          <Row
            key={`${group}.${name}`}
            document={document}
            name={name}
            token={token}
            theme={resolved}
            live={live}
          />
        ))}
      </tbody>
    </table>
  )
}
