import { access, copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const android = path.join(root, 'android')

function run(command, args, cwd = android) {
  // Secrets stay in the inherited environment, never in command arguments.
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env })
  if (result.error || result.status !== 0) throw new Error('Une commande Android a échoué ; consulter sa sortie.')
}

async function main() {
  const required = [
    'ARDECHOISE_KEYSTORE_PATH',
    'ARDECHOISE_KEYSTORE_PASSWORD',
    'ARDECHOISE_KEY_ALIAS',
    'ARDECHOISE_KEY_PASSWORD',
    'ARDECHOISE_VERSION_CODE',
    'ARDECHOISE_VERSION_NAME',
    'JAVA_HOME',
    'ANDROID_HOME',
  ]
  const missing = required.filter((name) => !process.env[name])
  if (missing.length) throw new Error(`Variables manquantes : ${missing.join(', ')}. Voir docs/android.md.`)

  const versionCode = Number(process.env.ARDECHOISE_VERSION_CODE)
  const version = process.env.ARDECHOISE_VERSION_NAME
  if (!/^[1-9]\d*$/.test(process.env.ARDECHOISE_VERSION_CODE) || !Number.isSafeInteger(versionCode) || versionCode > 2100000000) {
    throw new Error('ARDECHOISE_VERSION_CODE doit être un entier positif, inférieur ou égal à 2100000000.')
  }
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('ARDECHOISE_VERSION_NAME doit suivre le format 1.0.0.')
  }
  if (!path.isAbsolute(process.env.ARDECHOISE_KEYSTORE_PATH)) {
    throw new Error('ARDECHOISE_KEYSTORE_PATH doit être un chemin absolu vers la clé privée conservée hors du dépôt.')
  }
  const keyPath = path.resolve(process.env.ARDECHOISE_KEYSTORE_PATH)
  const relativeKey = path.relative(root, keyPath)
  if (!relativeKey.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeKey)) {
    throw new Error('Conserver la clé privée de signature hors du dépôt.')
  }
  await access(keyPath)
  await access(path.join(android, 'app', 'ardechoise.release.gradle'))
  const gradle = await readFile(path.join(android, 'app', 'build.gradle'), 'utf8')
  if (!gradle.includes("apply from: 'ardechoise.release.gradle'")) {
    throw new Error('Configuration de signature non appliquée : relancer npm run android:prepare.')
  }
  const java = path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
  await access(java)
  const javaVersion = spawnSync(java, ['-version'], { encoding: 'utf8', env: process.env })
  if (javaVersion.status !== 0 || !/version "21(?:\.|"|-)/.test(`${javaVersion.stdout}${javaVersion.stderr}`)) {
    throw new Error('JAVA_HOME doit désigner un JDK 21 compatible avec le projet Android Capacitor 7.')
  }
  const buildTools = path.join(process.env.ANDROID_HOME, 'build-tools')
  const toolVersions = (await readdir(buildTools, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d+\.\d+\.\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  if (!toolVersions.length) throw new Error('Android SDK Build-Tools manquants : installer les outils via Android Studio.')
  const signer = path.join(buildTools, toolVersions[0], 'lib', 'apksigner.jar')
  await access(signer)
  if (process.argv.includes('--check')) {
    console.log('Configuration de signature disponible ; aucune APK construite ou publiée.')
    return
  }

  if (process.platform === 'win32') {
    run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'gradlew.bat assembleRelease --no-daemon'])
  } else {
    run('./gradlew', ['assembleRelease', '--no-daemon'])
  }
  const apk = path.join(android, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
  await access(apk)
  run(java, ['-jar', signer, 'verify', '--verbose', '--print-certs', apk])
  const releaseDirectory = path.join(root, 'releases')
  await mkdir(releaseDirectory, { recursive: true })
  const artifactName = `ardechoise-android-v${version}.apk`
  await copyFile(apk, path.join(releaseDirectory, artifactName))
  const digest = createHash('sha256').update(await readFile(apk)).digest('hex')
  await writeFile(path.join(releaseDirectory, `${artifactName}.sha256`), `${digest}  ${artifactName}\n`, 'utf8')
  console.log(`APK signée préparée : releases/${artifactName}`)
  console.log('Tester cette APK sur téléphone avant toute publication. Aucun fichier envoyé sur GitHub.')
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
