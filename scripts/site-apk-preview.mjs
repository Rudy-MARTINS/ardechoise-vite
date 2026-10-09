import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const prefix = '/__apk-preview/'
const apkName = /^ardechoise-android-v(\d+)\.(\d+)\.(\d+)\.apk$/

async function latestApk(directory) {
  let files
  try {
    files = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }

  const candidates = files.filter(file => file.isFile() && apkName.test(file.name))
    .map(file => ({ name: file.name, version: file.name.match(apkName).slice(1).map(Number) }))
    .sort((left, right) => right.version[0] - left.version[0] || right.version[1] - left.version[1] || right.version[2] - left.version[2])
  const selected = candidates[0]
  if (!selected) return null

  const [bytes, checksum] = await Promise.all([
    readFile(resolve(directory, selected.name)),
    readFile(resolve(directory, `${selected.name}.sha256`), 'utf8'),
  ])
  const expected = checksum.trim().match(/^([a-f\d]{64})(?:[ \t]+\*?(.+))?$/i)
  const actual = createHash('sha256').update(bytes).digest('hex')
  if (!expected || expected[1].toLowerCase() !== actual || (expected[2] && expected[2] !== selected.name)) {
    throw new Error('L’empreinte SHA-256 de l’APK locale est incorrecte.')
  }

  const version = selected.version.join('.')
  return {
    bytes,
    apk: { name: selected.name, url: `${prefix}${selected.name}`, tag: `v${version}`, version, source: 'preview', size: bytes.length },
  }
}

export function siteApkPreview(projectRoot) {
  const directory = resolve(projectRoot, 'releases')

  return {
    name: 'site-apk-preview',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = (request.url ?? '').split('?')[0]
        if (!pathname.startsWith(prefix)) return next()

        const metadataRequest = pathname === `${prefix}latest.json`
        const allowedMethods = metadataRequest ? ['GET'] : ['GET', 'HEAD']
        response.setHeader('Cache-Control', 'no-store')
        response.setHeader('X-Content-Type-Options', 'nosniff')
        if (!allowedMethods.includes(request.method)) {
          response.writeHead(405, { Allow: allowedMethods.join(', ') })
          return response.end()
        }

        // Only the latest validated filename is served, never a request-supplied path.
        let local = null
        if (metadataRequest || apkName.test(pathname.slice(prefix.length))) {
          try {
            local = await latestApk(directory)
          } catch (error) {
            server.config.logger.warn(`Aperçu APK indisponible : ${error.code === 'ENOENT' ? 'APK ou fichier SHA-256 manquant.' : error.message}`)
          }
        }

        if (metadataRequest) {
          response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          return response.end(JSON.stringify({ apk: local?.apk ?? null }))
        }
        if (!local || pathname !== local.apk.url) {
          response.writeHead(404)
          return response.end()
        }

        response.writeHead(200, {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': `attachment; filename="${local.apk.name}"`,
          'Content-Length': local.bytes.length,
        })
        response.end(request.method === 'HEAD' ? undefined : local.bytes)
      })
    },
  }
}
