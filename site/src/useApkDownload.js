import { useEffect, useState } from 'react'

export default function useApkDownload(releasedApk) {
  const [previewApk, setPreviewApk] = useState(null)

  useEffect(() => {
    if (!import.meta.env.DEV) return

    const controller = new AbortController()
    let active = true
    Promise.resolve().then(async () => {
      if (!active) return
      try {
        const response = await fetch('/__apk-preview/latest.json', {
          signal: controller.signal,
          credentials: 'omit',
          cache: 'no-store',
        })
        if (!response.ok) return
        const { apk } = await response.json()
        if (active && apk && /^ardechoise-android-v\d+\.\d+\.\d+\.apk$/.test(apk.name) &&
          apk.url === `/__apk-preview/${apk.name}`) {
          setPreviewApk(apk)
        }
      } catch {
        // Without a local APK the site keeps its normal GitHub download behavior.
      }
    })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  return previewApk ?? releasedApk
}
