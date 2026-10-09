import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchGitHubReleases, GITHUB_RELEASES_API, GITHUB_RELEASES_URL, summarizeReleases } from './githubReleases.js'

function asset(name, count, id = name, overrides = {}) {
  return {
    id,
    name,
    download_count: count,
    browser_download_url: `${GITHUB_RELEASES_URL}/download/v1/${encodeURIComponent(name)}`,
    state: 'uploaded',
    size: 1234,
    ...overrides,
  }
}

function release(tag, date, assets = [], overrides = {}) {
  return { id: tag, tag_name: tag, draft: false, prerelease: false, published_at: date, assets, ...overrides }
}

function response(body, status = 200, headers = {}) {
  return { ok: status >= 200 && status < 300, status, headers: new Headers(headers), json: async () => body }
}

test('counts APK downloads across stable and prerelease versions, excluding drafts and other formats', () => {
  const result = summarizeReleases([
    release('v1', '2026-01-01T00:00:00Z', [asset('app.apk', 10, 1), asset('source.zip', 800, 2)]),
    release('v2-beta', '2026-02-01T00:00:00Z', [asset('preview.APK', 7, 3)], { prerelease: true }),
    release('draft', '2026-03-01T00:00:00Z', [asset('secret.apk', 90, 4)], { draft: true }),
    release('unpublished', null, [asset('unpublished.apk', 80, 5)]),
  ])
  assert.equal(result.downloadCount, 17)
  assert.equal(result.apk.tag, 'v1')
  assert.equal(result.apk.name, 'app.apk')
})

test('an empty real release response means zero downloads and no APK', async () => {
  const result = await fetchGitHubReleases({ fetchImpl: async () => response([]) })
  assert.equal(result.status, 'ready')
  assert.equal(result.downloadCount, 0)
  assert.equal(result.apk, null)
  assert.equal(result.error, null)
  assert.equal(result.releasesUrl, GITHUB_RELEASES_URL)
})

test('selects the most recently published stable APK even when responses are unsorted or newer releases have no APK', () => {
  const result = summarizeReleases([
    release('v3', '2026-03-01T00:00:00Z', [asset('readme.txt', 99)]),
    release('v1', '2026-01-01T00:00:00Z', [asset('old.apk', 1)]),
    release('v4-beta', '2026-04-01T00:00:00Z', [asset('beta.apk', 3)], { prerelease: true }),
    release('v2', '2026-02-01T00:00:00Z', [asset('current.apk', 2)]),
  ])
  assert.equal(result.apk.tag, 'v2')
  assert.equal(result.apk.name, 'current.apk')
  assert.equal(result.downloadCount, 6)
})

test('prefers a universal stable build deterministically and avoids architecture-only or debug builds on the main button', () => {
  const builds = [asset('app-release.apk', 2), asset('app-universal.apk', 3), asset('app-arm64-v8a.apk', 4), asset('app-debug.apk', 5)]
  const current = release('v2', '2026-02-01T00:00:00Z', builds)
  assert.equal(summarizeReleases([current]).apk.name, 'app-universal.apk')
  assert.equal(summarizeReleases([{ ...current, assets: [...builds].reverse() }]).apk.name, 'app-universal.apk')
  const restricted = summarizeReleases([{ ...current, assets: builds.slice(2) }])
  assert.equal(restricted.apk, null)
  assert.equal(restricted.downloadCount, 9)
})

test('does not expose APK download links outside the exact GitHub repository', () => {
  const unsafeUrls = [
    'https://example.com/app.apk',
    'https://github.com.evil.test/Rudy-MARTINS/ardechoise-vite/releases/download/v1/app.apk',
    'https://github.com/someone/other/releases/download/v1/app.apk',
    'https://user:password@github.com/Rudy-MARTINS/ardechoise-vite/releases/download/v1/app.apk',
    'http://github.com/Rudy-MARTINS/ardechoise-vite/releases/download/v1/app.apk',
    'javascript:alert(1)',
  ]
  for (const url of unsafeUrls) {
    const result = summarizeReleases([release('v1', '2026-01-01T00:00:00Z', [asset('app.apk', 4, 1, { browser_download_url: url })])])
    assert.equal(result.apk, null)
    assert.equal(result.downloadCount, 4)
  }
})

test('duplicate release entries caused by pagination do not double count APK assets', () => {
  const published = release('v1', '2026-01-01T00:00:00Z', [asset('app.apk', 12, 101)])
  assert.equal(summarizeReleases([published, published]).downloadCount, 12)
})

test('invalid APK counters never become a misleading zero', () => {
  for (const count of [null, undefined, -1, '4', 1.5]) {
    assert.throws(() => summarizeReleases([release('v1', '2026-01-01T00:00:00Z', [asset('app.apk', count)])]), /incomplète ou invalide/)
  }
})

test('fetches every release page while keeping requests on the fixed public endpoint and omitting credentials', async () => {
  const requests = []
  const pages = [
    response([release('v2', '2026-02-01T00:00:00Z', [asset('new.apk', 8)])], 200, {
      link: '<https://example.com/untrusted?page=2>; rel="next", <https://example.com/untrusted?page=2>; rel="last"',
    }),
    response([release('v1', '2026-01-01T00:00:00Z', [asset('old.apk', 5)])]),
  ]
  const result = await fetchGitHubReleases({ fetchImpl: async (url, options) => {
    requests.push({ url, options })
    return pages[requests.length - 1]
  } })
  assert.equal(result.status, 'ready')
  assert.equal(result.downloadCount, 13)
  assert.equal(result.apk.name, 'new.apk')
  assert.deepEqual(requests.map(({ url }) => url), [
    `${GITHUB_RELEASES_API}?per_page=100&page=1`,
    `${GITHUB_RELEASES_API}?per_page=100&page=2`,
  ])
  assert.equal(requests[0].options.credentials, 'omit')
  assert.equal(requests[0].options.headers.Authorization, undefined)
  assert.ok(requests[0].options.signal instanceof AbortSignal)
})

test('a full page without an exposed Link header is followed by another page', async () => {
  let calls = 0
  const page = Array.from({ length: 100 }, (_, index) => release(`v${index}`, '2026-01-01T00:00:00Z', [asset(`${index}.apk`, 1)]))
  const result = await fetchGitHubReleases({ fetchImpl: async () => response(++calls === 1 ? page : []) })
  assert.equal(calls, 2)
  assert.equal(result.downloadCount, 100)
})

test('a later page failure discards the incomplete total and keeps the releases fallback', async () => {
  let calls = 0
  const result = await fetchGitHubReleases({ fetchImpl: async () => ++calls === 1
    ? response([release('v1', '2026-01-01T00:00:00Z', [asset('app.apk', 20)])], 200, { link: '<https://api.github.com/page2>; rel="next"' })
    : response({}, 503) })
  assert.equal(result.status, 'unavailable')
  assert.equal(result.downloadCount, null)
  assert.equal(result.apk, null)
  assert.equal(result.error.code, 'http')
  assert.equal(result.releasesUrl, GITHUB_RELEASES_URL)
})

test('GitHub rate limits are reported explicitly with a retry time, never as zero downloads', async () => {
  const result = await fetchGitHubReleases({ fetchImpl: async () => response({}, 403, {
    'x-ratelimit-remaining': '0',
    'x-ratelimit-reset': '1800000000',
  }) })
  assert.equal(result.status, 'unavailable')
  assert.equal(result.downloadCount, null)
  assert.equal(result.error.code, 'rate-limit')
  assert.equal(result.error.retryAt, 1800000000000)
  const throttled = await fetchGitHubReleases({ fetchImpl: async () => response({}, 429) })
  assert.equal(throttled.error.code, 'rate-limit')
  const secondary = await fetchGitHubReleases({ fetchImpl: async () => response({ message: 'You have exceeded a secondary rate limit.' }, 403) })
  assert.equal(secondary.error.code, 'rate-limit')
})

test('network errors and malformed API data keep the count unavailable', async () => {
  const offline = await fetchGitHubReleases({ fetchImpl: async () => { throw new TypeError('Failed to fetch') } })
  assert.equal(offline.status, 'unavailable')
  assert.equal(offline.downloadCount, null)
  assert.equal(offline.error.code, 'network')
  const malformed = await fetchGitHubReleases({ fetchImpl: async () => response({ unexpected: true }) })
  assert.equal(malformed.downloadCount, null)
  assert.equal(malformed.error.code, 'invalid-data')
})

test('abort propagates and cancels the underlying fetch so an unmounted hook cannot update', async () => {
  const controller = new AbortController()
  let requestSignal
  const request = fetchGitHubReleases({ signal: controller.signal, fetchImpl: async (_url, options) => {
    requestSignal = options.signal
    return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }))
  } })
  controller.abort()
  await assert.rejects(request, { name: 'AbortError' })
  assert.equal(requestSignal.aborted, true)
  await assert.rejects(fetchGitHubReleases({ signal: controller.signal, fetchImpl: async () => { throw new Error('must not fetch') } }), { name: 'AbortError' })
})

test('a stalled API request times out to unavailable instead of leaving the counter loading', async () => {
  const result = await fetchGitHubReleases({ timeoutMs: 5, fetchImpl: async (_url, { signal }) =>
    new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })) })
  assert.equal(result.status, 'unavailable')
  assert.equal(result.downloadCount, null)
  assert.equal(result.error.code, 'timeout')
})
