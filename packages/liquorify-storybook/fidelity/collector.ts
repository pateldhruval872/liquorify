import { createServer, type Server } from 'node:http'
import { gunzipSync } from 'node:zlib'

const KINDS = ['unspecified', 'internal', 'server', 'client', 'producer', 'consumer']

/** One span as it reached the collector, without its attribute values. */
export interface Span {
  service: string
  scope: string
  trace: string
  id: string
  parent: string
  name: string
  kind: string
  attributeKeys: string[]
  links: { trace: string; id: string }[]
}

/** The fields of one protobuf message: OTLP's export body, decoded without a schema library. */
function fieldsOf(buffer: Buffer) {
  const fields: { field: number; value: Buffer | bigint }[] = []
  let offset = 0
  const varint = () => {
    let result = 0n
    let shift = 0n
    for (;;) {
      const byte = buffer[offset++]
      result |= BigInt(byte & 0x7f) << shift
      if (byte < 0x80) return result
      shift += 7n
    }
  }
  while (offset < buffer.length) {
    const key = Number(varint())
    const wire = key & 7
    const field = key >> 3
    if (wire === 0) fields.push({ field, value: varint() })
    else if (wire === 1 || wire === 5) {
      const size = wire === 1 ? 8 : 4
      fields.push({ field, value: buffer.subarray(offset, offset + size) })
      offset += size
    } else if (wire === 2) {
      const size = Number(varint())
      fields.push({ field, value: buffer.subarray(offset, offset + size) })
      offset += size
    } else throw new Error(`Unexpected protobuf wire type ${wire}`)
  }
  return fields
}

const messages = (buffer: Buffer, field: number) =>
  fieldsOf(buffer)
    .filter((entry) => entry.field === field && Buffer.isBuffer(entry.value))
    .map((entry) => entry.value as Buffer)
const text = (buffer: Buffer, field: number) => messages(buffer, field)[0]?.toString('utf8') ?? ''
const hex = (buffer: Buffer, field: number) => messages(buffer, field)[0]?.toString('hex') ?? ''

function spansIn(body: Buffer): Span[] {
  return messages(body, 1).flatMap((resourceSpans) => {
    const resource = messages(resourceSpans, 1)[0] ?? Buffer.alloc(0)
    const service =
      messages(resource, 1)
        .filter((attribute) => text(attribute, 1) === 'service.name')
        .map((attribute) => text(messages(attribute, 2)[0] ?? Buffer.alloc(0), 1))[0] ?? ''
    return messages(resourceSpans, 2).flatMap((scopeSpans) => {
      const scope = text(messages(scopeSpans, 1)[0] ?? Buffer.alloc(0), 1)
      return messages(scopeSpans, 2).map((span) => ({
        service,
        scope,
        trace: hex(span, 1),
        id: hex(span, 2),
        parent: hex(span, 4),
        name: text(span, 5),
        kind:
          KINDS[Number(fieldsOf(span).find((entry) => entry.field === 6)?.value ?? 0n)] ??
          'unspecified',
        attributeKeys: messages(span, 9).map((attribute) => text(attribute, 1)),
        links: messages(span, 13).map((link) => ({ trace: hex(link, 1), id: hex(link, 2) })),
      }))
    })
  })
}

/**
 * A local OpenTelemetry collector: it takes the OTLP exports a server sends
 * over HTTP and keeps the spans in memory.
 */
export class Collector {
  readonly spans: Span[] = []
  readonly exports: { path: string; encoding: string | null; bytes: number }[] = []
  private server: Server

  constructor(readonly port = 4318) {
    this.server = createServer((incoming, answer) => {
      const chunks: Buffer[] = []
      incoming.on('data', (chunk: Buffer) => chunks.push(chunk))
      incoming.on('end', () => {
        const raw = Buffer.concat(chunks)
        const encoding = incoming.headers['content-encoding'] ?? null
        const body = encoding === 'gzip' ? gunzipSync(raw) : raw
        this.exports.push({ path: incoming.url ?? '', encoding, bytes: body.length })
        if (incoming.url === '/v1/traces') this.spans.push(...spansIn(body))
        answer.writeHead(200, { 'Content-Type': 'application/x-protobuf' }).end()
      })
    })
  }

  start() {
    return new Promise<void>((resolve) => this.server.listen(this.port, resolve))
  }

  stop() {
    return new Promise<void>((resolve) => this.server.close(() => resolve()))
  }
}
