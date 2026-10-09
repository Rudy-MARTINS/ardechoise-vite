export const GITHUB_RELEASES_URL = 'https://github.com/Rudy-MARTINS/ardechoise-vite/releases'
export const GITHUB_RELEASES_API = 'https://api.github.com/repos/Rudy-MARTINS/ardechoise-vite/releases'

const PAGE_SIZE = 100
const APK_NAME = /\.apk$/i
const ARCH_SPECIFIC = /(?:^|[-_.])(?:arm64(?:-v8a)?|armeabi(?:-v7a)?|armv7|x86(?:_64)?|aarch64)(?:[-_.]|$)/i

class GitHubReleasesError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'GitHubReleasesError'
    this.code = code
    Object.assign(this, details)
  }
}

function invalidData() {
  return new GitHubReleasesError('invalid-data', 'La réponse de GitHub est incomplète ou invalide.')
}

function trustedApkUrl(value) {
  if (typeof value !== 'string') return null

  try {
    const url = new URL(value)
    const parts = url.pathname.split('/')
    if (
      url.origin !== 'https://github.com' || url.username || url.password || url.search || url.hash ||
      parts.length !== 7 || parts[1].toLowerCase() !== 'rudy-martins' ||
      parts[2].toLowerCase() !== 'ardechoise-vite' || parts[3] !== 'releases' || parts[4] !== 'download' ||
      !parts[5] || !APK_NAME.test(decodeURIComponent(parts[6]))
    ) return null
    return url.href
  } catch {
    return null
  }
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}

function apkPreference(asset) {
  // An architecture-specific APK is unsuitable for a single public Android button.
  // Prefer a universal build, then a generic release build. Debug builds stay off the main button.
  if (/(?:^|[-_.])debug(?:[-_.]|$)/i.test(asset.name)) return null
  if (/(?:^|[-_.])universal(?:[-_.]|$)/i.test(asset.name)) return 0
  if (ARCH_SPECIFIC.test(asset.name)) return null
  return /(?:^|[-_.])release(?:[-_.]|$)/i.test(asset.name) ? 1 : 2
}

/** Count GitHub asset downloads; this is neither a click counter nor an install counter. */
export function summarizeReleases(releases) {
  if (!Array.isArray(releases)) throw invalidData()

  let downloadCount = 0
  const countedAssets = new Set()
  const candidates = []

  for (const release of releases) {
    if (!release || typeof release !== 'object' || typeof release.draft !== 'boolean') throw invalidData()
    if (release.draft || !release.published_at) continue
    if (typeof release.prerelease !== 'boolean' || !Array.isArray(release.assets)) throw invalidData()
    const publishedTime = Date.parse(release.published_at)
    if (!Number.isFinite(publishedTime)) throw invalidData()

    for (const asset of release.assets) {
      if (!asset || typeof asset.name !== 'string') throw invalidData()
      if (!APK_NAME.test(asset.name)) continue
      if (!Number.isSafeInteger(asset.download_count) || asset.download_count < 0) throw invalidData()

      const assetKey = asset.id ?? `${release.id ?? release.tag_name}:${asset.name}`
      if (!countedAssets.has(assetKey)) {
        countedAssets.add(assetKey)
        downloadCount += asset.download_count
        if (!Number.isSafeInteger(downloadCount)) throw invalidData()
      }

      const url = trustedApkUrl(asset.browser_download_url)
      const preference = apkPreference(asset)
      if (!release.prerelease && url && preference !== null && (!asset.state || asset.state === 'uploaded')) {
        candidates.push({
          name: asset.name,
          url,
          tag: release.tag_name ?? '',
          version: release.tag_name ?? release.name ?? '',
          size: Number.isSafeInteger(asset.size) && asset.size >= 0 ? asset.size : null,
          publishedAt: release.published_at,
          publishedTime,
          preference,
          assetId: asset.id ?? 0,
        })
      }
    }
  }

  candidates.sort((left, right) =>
    right.publishedTime - left.publishedTime ||
    compareText(right.tag, left.tag) ||
    left.preference - right.preference ||
    compareText(left.name, right.name) ||
    left.assetId - right.assetId,
  )

  const selected = candidates[0]
  const apk = selected ? {
    name: selected.name,
    url: selected.url,
    tag: selected.tag,
    version: selected.version,
    size: selected.size,
    publishedAt: selected.publishedAt,
  } : null

  return { downloadCount, apk, releasesUrl: GITHUB_RELEASES_URL }
}

function hasNextPage(linkHeader) {
  return typeof linkHeader === 'string' && /(?:^|,)\s*<[^>]+>\s*;\s*rel="next"/.test(linkHeader)
}

function unavailable(error) {
  return {
    status: 'unavailable',
    downloadCount: null,
    apk: null,
    releasesUrl: GITHUB_RELEASES_URL,
    error: {
      code: error.code ?? 'network',
      message: error instanceof GitHubReleasesError ? error.message : 'GitHub est momentanément inaccessible.',
      status: error.status ?? null,
      retryAt: error.retryAt ?? null,
    },
  }
}

/** Fetch all release pages without credentials, tokens, or a server. No partial total is displayed. */
export async function fetchGitHubReleases({ signal, fetchImpl = fetch, timeoutMs = 12000 } = {}) {
  if (signal?.aborted) throw new DOMException('La requête a été annulée.', 'AbortError')

  const controller = new AbortController()
  let timedOut = false
  const cancel = () => controller.abort()
  signal?.addEventListener('abort', cancel, { once: true })
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  try {
    const releases = []
    let page = 1
    let morePages = true

    while (morePages) {
      const response = await fetchImpl(`${GITHUB_RELEASES_API}?per_page=${PAGE_SIZE}&page=${page}`, {
        signal: controller.signal,
        credentials: 'omit',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      if (!response.ok) {
        let message = ''
        if (response.status === 403) {
          try {
            const body = await response.json()
            message = typeof body?.message === 'string' ? body.message : ''
          } catch {
            // HTTP headers still let us distinguish primary limits when the body is unavailable.
          }
        }
        const rateLimited = response.status === 429 ||
          (response.status === 403 && (
            response.headers.get('x-ratelimit-remaining') === '0' || response.headers.get('retry-after') || /rate limit/i.test(message)
          ))
        const reset = Number(response.headers.get('x-ratelimit-reset'))
        const retrySeconds = Number(response.headers.get('retry-after'))
        const retryAt = reset > 0 ? reset * 1000 : retrySeconds > 0 ? Date.now() + retrySeconds * 1000 : null
        throw new GitHubReleasesError(
          rateLimited ? 'rate-limit' : 'http',
          rateLimited ? 'La limite temporaire de requêtes GitHub a été atteinte.' : 'Les versions GitHub sont momentanément indisponibles.',
          { status: response.status, retryAt },
        )
      }

      const data = await response.json()
      if (!Array.isArray(data)) throw invalidData()
      releases.push(...data)
      // Build the next URL ourselves, never follow an arbitrary URL from a response header.
      morePages = hasNextPage(response.headers.get('link')) || data.length === PAGE_SIZE
      page += 1
    }

    if (signal?.aborted) throw new DOMException('La requête a été annulée.', 'AbortError')
    if (timedOut) throw new GitHubReleasesError('timeout', 'GitHub met trop de temps à répondre.')
    return { status: 'ready', ...summarizeReleases(releases), error: null }
  } catch (error) {
    if (signal?.aborted) throw new DOMException('La requête a été annulée.', 'AbortError')
    return unavailable(timedOut ? new GitHubReleasesError('timeout', 'GitHub met trop de temps à répondre.') : error)
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', cancel)
  }
}
