import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build, createServer } from 'vite'

const configFile = fileURLToPath(new URL('../vite.site.config.js', import.meta.url))
const entry = new URL('../site/index.html', import.meta.url)

function policyFrom(html) {
  const meta = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"[^>]*>/)
  assert.ok(meta, 'the transformed page must include a CSP')
  const firstResource = html.search(/<(?:script|link)\b/)
  assert.ok(meta.index < firstResource, 'the CSP must precede executable/style resources')
  return new Map(meta[1].replaceAll('&#39;', "'").split('; ').map(directive => {
    const [name, ...sources] = directive.split(' ')
    return [name, sources]
  }))
}

test('Pages and development-mode builds both enforce the production policy', async () => {
  // A build named "development" still produces distributable files, never a dev policy.
  for (const mode of ['pages', 'development']) {
    const result = await build({ configFile, mode, logLevel: 'silent', build: { write: false } })
    const output = (Array.isArray(result) ? result[0] : result).output
    const html = output.find(file => file.type === 'asset' && file.fileName === 'index.html').source
    const policy = policyFrom(html)
    assert.deepEqual(policy.get('default-src'), ["'none'"])
    assert.deepEqual(policy.get('script-src'), ["'self'"])
    assert.deepEqual(policy.get('style-src'), ["'self'", 'https://fonts.googleapis.com'])
    assert.ok(policy.get('connect-src').includes('https://api.github.com'))
    assert.ok(!policy.get('connect-src').some(source => /^(?:ws|wss):/.test(source)))
    assert.ok(!policy.has('frame-ancestors'), 'frame-ancestors cannot be enforced by a meta CSP')
    assert.ok(!html.includes("'unsafe-eval'"))
  }
})

test('Vite development keeps the CSP compatible with React Refresh and CSS/HMR', async () => {
  const server = await createServer({
    configFile,
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false },
  })
  try {
    const html = await server.transformIndexHtml('/', await readFile(entry, 'utf8'))
    const policy = policyFrom(html)
    assert.ok(policy.get('script-src').includes("'unsafe-inline'"))
    assert.ok(policy.get('style-src').includes("'unsafe-inline'"))
    assert.ok(policy.get('connect-src').includes('ws:'))
    assert.ok(!policy.get('script-src').includes("'unsafe-eval'"))
    assert.ok(html.includes('/@vite/client'))
  } finally {
    await server.close()
  }
})
