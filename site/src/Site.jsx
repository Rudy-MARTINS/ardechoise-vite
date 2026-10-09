import { useEffect, useRef, useState } from 'react'
import { publicAsset } from './publicAsset.js'
import useGitHubReleases from './useGitHubReleases.js'
import useApkDownload from './useApkDownload.js'
import Icon from './Icon.jsx'
import CulSecPreview from './CulSecPreview.jsx'

const features = [
  { icon: 'beer', title: 'Règles simples', text: 'Des cartes, des choix… et c’est parti.' },
  { icon: 'users', title: 'Entre amis', text: 'De 2 à 10 joueurs autour du même écran.' },
  { icon: 'zap', title: 'Place aux défis', text: 'Un peu d’audace, beaucoup de rires.' },
  { icon: 'heart', title: '100 % gratuit', text: 'Sans pub et sans inscription.' },
]

export default function Site() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuToggleRef = useRef(null)
  const { status, downloadCount, apk: releasedApk, releasesUrl } = useGitHubReleases()
  const apk = useApkDownload(releasedApk)
  const apkAvailable = Boolean(apk?.url)
  const downloadLabel = status === 'loading'
    ? 'Recherche de l’APK…'
    : status === 'unavailable'
      ? 'Téléchargement indisponible'
      : 'APK bientôt disponible'
  const headerDownloadLabel = status === 'loading'
    ? 'Recherche de l’APK…'
    : status === 'unavailable'
      ? 'APK indisponible'
      : 'APK bientôt disponible'
  const apkStatus = apkAvailable
    ? `APK Android · ${apk.tag} · Gratuit · Sans pub`
    : status === 'loading'
      ? 'Recherche de la dernière version Android…'
      : status === 'unavailable'
        ? 'La disponibilité de l’APK n’a pas pu être vérifiée. Vous pouvez consulter les versions sur GitHub Releases.'
        : 'Aucune APK stable disponible pour le moment. Le téléchargement sera activé dès sa publication.'

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
        menuToggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <div className="site">
      <a className="site-skip" href="#contenu">Aller au contenu</a>
      <header className="site-header">
        <div className="site-header__inner">
          <a href="#accueil" className="site-brand" aria-label="L’Ardéchoise, accueil">
            <img src={publicAsset('site/logo-cutout.png')} alt="" width="120" height="80" />
            <span>L’Ardéchoise</span>
          </a>
          <button ref={menuToggleRef} className="site-menu-toggle" aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(open => !open)}>
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
          <nav id="site-navigation" className={menuOpen ? 'site-nav site-nav--open' : 'site-nav'} aria-label="Navigation principale">
            <a href="#accueil" onClick={() => setMenuOpen(false)}>Accueil</a>
            <a href="#le-jeu" onClick={() => setMenuOpen(false)}>Le jeu</a>
            <a href="#apercu" onClick={() => setMenuOpen(false)}>Aperçu</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          </nav>
          {apkAvailable ? (
            <a className="site-button site-button--gold site-header__download" href={apk.url} download={apk.name} target="_blank" rel="noopener noreferrer" aria-describedby="apk-status">
              <Icon name="android" /> Télécharger l’APK
            </a>
          ) : (
            <button type="button" className="site-button site-button--gold site-header__download" disabled aria-describedby="apk-status">
              <Icon name="android" /> {headerDownloadLabel}
            </button>
          )}
        </div>
      </header>

      <main id="contenu">
        <section className="site-hero" id="accueil" aria-labelledby="site-title">
          <img className="site-hero__scene" src={publicAsset('site/casino-alex.png')} alt="Alex, le croupier pixel art de L’Ardéchoise, vous accueille à sa table de cartes." width="1536" height="1024" fetchPriority="high" />
          <div className="site-hero__shade" aria-hidden="true" />
          <div className="site-hero__inner">
            <div className="site-hero__copy">
              <p className="site-eyebrow"><span /> LE JEU DE CARTES ENTRE AMIS</p>
              <h1 id="site-title"><img src={publicAsset('site/logo-cutout.png')} alt="L’Ardéchoise" width="480" height="320" /></h1>
              <blockquote>
                <p>« Pour les gens qu’on pas peur<br className="site-quote-break" /> de boire… de l’eau »</p>
                <cite>« Dans 20 - 30 ans y en aura plus » — JCVD</cite>
              </blockquote>
              <div className="site-hero__actions">
                {apkAvailable ? (
                  <a className="site-button site-button--gold" href={apk.url} download={apk.name} target="_blank" rel="noopener noreferrer" aria-describedby="apk-status">
                    <Icon name="android" /> Télécharger pour Android
                  </a>
                ) : (
                  <button type="button" className="site-button site-button--gold" disabled aria-describedby="apk-status">
                    <Icon name="android" /> {downloadLabel}
                  </button>
                )}
              </div>
              <p className="site-apk-status" id="apk-status" role="status">{apkStatus}</p>
              <a className="site-download-count" href={releasesUrl} target="_blank" rel="noopener noreferrer" aria-live="polite">
                <Icon name="download" />
                {status === 'ready' ? <><strong>{new Intl.NumberFormat('fr-FR').format(downloadCount)}</strong> téléchargement{downloadCount > 1 ? 's' : ''} d’APK</> : status === 'loading' ? 'Chargement du compteur…' : 'Compteur momentanément indisponible'}
                <span>sur GitHub Releases</span>
              </a>
            </div>
            <div className="site-hero__visual"><CulSecPreview /></div>
          </div>
        </section>

        <section className="site-features site-container" id="le-jeu" aria-label="Le jeu en quelques mots">
          {features.map(feature => <article key={feature.title}><Icon name={feature.icon} /><h2>{feature.title}</h2><p>{feature.text}</p></article>)}
        </section>

        <section className="site-faq site-container" id="faq" aria-labelledby="faq-title">
          <div className="site-faq__intro">
            <p className="site-eyebrow">AVANT DE TIRER UNE CARTE</p>
            <h2 id="faq-title">Deux ou trois petites questions.</h2>
            <p>Les réponses, sans gâcher les surprises du jeu.</p>
          </div>
          <div className="site-faq__questions">
            <details><summary>Il faut être combien pour jouer ?</summary><p>De 2 à 10 joueurs. Entrez vos prénoms, rassemblez-vous autour du même écran, puis lancez la partie.</p></details>
            <details>
              <summary>Comment télécharger la version Android ?</summary>
              <p>{apkAvailable
                ? apk.source === 'preview'
                  ? 'Le bouton Android télécharge directement la version disponible dans cet aperçu local. Le compteur conserve les téléchargements mesurés sur GitHub Releases.'
                  : 'Le bouton Android télécharge directement la dernière APK stable publiée sur GitHub Releases.'
                : status === 'ready'
                  ? 'Aucune APK stable disponible pour le moment. Le bouton de téléchargement sera activé dès sa publication.'
                  : status === 'loading'
                    ? 'La disponibilité de la dernière APK Android est en cours de vérification.'
                    : 'La disponibilité de l’APK n’a pas pu être vérifiée. Le téléchargement est temporairement indisponible sur cette page.'}</p>
              <p>Après le téléchargement, Android peut demander d’autoriser l’installation depuis votre navigateur.</p>
              <p>Sur GitHub Releases : <a href={releasesUrl} target="_blank" rel="noopener noreferrer">Consulter les versions</a>.</p>
            </details>
            <details><summary>À quoi correspond le compteur ?</summary><p>Il additionne les téléchargements des fichiers APK publiés sur GitHub Releases, toutes versions confondues. Il ne compte pas les clics sur cette page et ne représente pas le nombre d’installations.</p></details>
          </div>
        </section>
      </main>

      <footer className="site-footer site-container">
        <a className="site-brand site-brand--footer" href="#accueil"><span>L’Ardéchoise</span></a>
        <p>Une table. Des amis. Des cartes.</p>
        <a href="https://github.com/Rudy-MARTINS/ardechoise-vite" target="_blank" rel="noopener noreferrer">Le projet sur GitHub <Icon name="arrow" /></a>
      </footer>
    </div>
  )
}
