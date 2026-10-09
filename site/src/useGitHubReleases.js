import { useEffect, useState } from 'react'
import { fetchGitHubReleases, GITHUB_RELEASES_URL } from './githubReleases.js'

export function useGitHubReleases() {
  const [releases, setReleases] = useState(() => ({
    status: 'loading',
    downloadCount: null,
    apk: null,
    releasesUrl: GITHUB_RELEASES_URL,
    error: null,
  }))

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    // Deferring until the microtask avoids starting the discarded Strict Mode request.
    Promise.resolve().then(async () => {
      if (!active) return
      try {
        const result = await fetchGitHubReleases({ signal: controller.signal })
        if (active) setReleases(result)
      } catch (error) {
        if (active && error.name !== 'AbortError') {
          setReleases({
            status: 'unavailable',
            downloadCount: null,
            apk: null,
            releasesUrl: GITHUB_RELEASES_URL,
            error: { code: 'network', message: 'GitHub est momentanément inaccessible.' },
          })
        }
      }
    })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  return releases
}

export default useGitHubReleases
