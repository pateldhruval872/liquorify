import { createConnection, createServer } from 'node:net'

/**
 * The browser-test server builds the links of its stored files (photos, logos,
 * labels) for port 3000, which the dummy app's `config/environments/test.rb`
 * names, while the stack serves on 3010. This forwards 3000 to the stack, so a
 * stored file's link opens in the browser as it would on a configured server.
 * It changes nothing Spree answers.
 *
 *   node fidelity/file-links.mjs [from=3000] [to=3010]
 */
const [from = '3000', to = '3010'] = process.argv.slice(2)

createServer((client) => {
  const upstream = createConnection({ host: '127.0.0.1', port: Number(to) })
  client.pipe(upstream).pipe(client)
  const close = () => {
    client.destroy()
    upstream.destroy()
  }
  client.on('error', close)
  upstream.on('error', close)
}).listen(Number(from), '127.0.0.1', () => console.log(`file links: ${from} -> ${to}`))
