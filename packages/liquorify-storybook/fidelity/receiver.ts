import { createServer, type IncomingHttpHeaders, type Server } from 'node:http'

/** One request the receiver took, as it arrived. */
export interface Received {
  method: string
  path: string
  query: URLSearchParams
  headers: IncomingHttpHeaders
  body: string
  at: number
}

/**
 * A local HTTP server standing in for whatever Spree or the browser calls
 * outside the store: an OAuth client's callback, or a webhook endpoint. It
 * records every request in memory and answers each with `status`, which a
 * test may change. It listens on both IPv4 and IPv6 where the machine has
 * IPv6, because the browser and Rails may resolve `localhost` either way.
 *
 * What it records stays in memory: codes, signatures and payloads are read by
 * the test that started it and never written out by it.
 */
export class Receiver {
  readonly received: Received[] = []
  status = 200
  private server: Server

  constructor(readonly port: number) {
    this.server = createServer((req, res) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', () => {
        const url = new URL(req.url ?? '/', 'http://receiver')
        this.received.push({
          method: req.method ?? 'GET',
          path: url.pathname,
          query: url.searchParams,
          headers: req.headers,
          body: Buffer.concat(chunks).toString('utf8'),
          at: Date.now(),
        })
        res.writeHead(this.status, { 'Content-Type': 'text/plain' })
        res.end(this.status < 400 ? 'Received' : 'Refused by the test receiver')
      })
    })
  }

  async start() {
    try {
      await this.listen('::')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EAFNOSUPPORT') throw error
      await this.listen('0.0.0.0')
    }
  }

  private listen(host: string) {
    return new Promise<void>((resolve, reject) => {
      this.server.once('error', reject)
      this.server.listen({ port: this.port, host, ipv6Only: false }, () => {
        this.server.off('error', reject)
        resolve()
      })
    })
  }

  stop() {
    return new Promise<void>((resolve) => this.server.close(() => resolve()))
  }

  /** Waits until a request matching `match` has arrived since `after`, and returns it. */
  async next(match: (item: Received) => boolean, timeout = 30_000, after = 0) {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      const found = this.received.find((item) => item.at >= after && match(item))
      if (found) return found
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    throw new Error(`The receiver on ${this.port} took no matching request in ${timeout} ms`)
  }
}
