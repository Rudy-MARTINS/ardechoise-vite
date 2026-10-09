# L'Ardéchoise

Jeu de cartes entre amis et mini-site officiel de téléchargement Android, en React/Vite. Le jeu reste à sa place d'origine ; le site dédié présente L'Ardéchoise et propose la dernière APK publiée sur GitHub Releases, sans accès au jeu en ligne.

## Développement

Node 20.19+ ou 22.12+ et npm sont nécessaires. Pour une nouvelle installation, utiliser Node 22 ou une version LTS compatible plus récente.

```powershell
npm ci
npm run dev
```

- `http://localhost:5173/` : jeu existant, pour le développement.
- `npm run dev:site` puis `http://localhost:5174/` : mini-site indépendant.

Dans cet aperçu du mini-site, les boutons Android téléchargent l'APK locale de `releases/` lorsque son fichier `.sha256` correspond. Ce service existe uniquement avec `dev:site` : aucune APK n'est copiée dans `site/public/` ou `dist-site/`. Le compteur reste celui de GitHub Releases et ne compte pas ces téléchargements locaux.

Les règles et les phases du jeu sont conservées. Le mini-site utilise le logo et Alex déjà présents dans `public/` et montre uniquement un aperçu CUL SEC.

## Vérifications et builds

```powershell
npm test
npm run lint
npm run build
npm run build:site
npm run build:pages
npm run build:android
```

| Commande | Résultat |
| --- | --- |
| `npm run build` | Jeu d'origine seul dans `dist/` |
| `npm run build:site` | Mini-site seul dans `dist-site/`, pour une racine de domaine |
| `npm run build:pages` | Mini-site seul dans `dist-site/`, avec le préfixe `/ardechoise-vite/` |
| `npm run build:android` | Jeu seul dans `dist-android/`, embarqué localement par Capacitor |
| `npm run preview` | Prévisualisation du build du jeu, pour le développement |
| `npm run preview:site` | Prévisualisation du mini-site sur `http://localhost:4174/` |
| `npm run preview:pages` | Prévisualisation du mini-site sur `http://localhost:4174/ardechoise-vite/` |

Le mini-site a son entrée dans `site/` et sa configuration `vite.site.config.js`. Ses fichiers sont séparés du jeu et seuls ceux de `dist-site/` sont publiés sur GitHub Pages. Le build Android ouvre directement le jeu et embarque ses ressources locales.

Les builds et les commandes `preview:site`/`preview:pages` utilisent uniquement GitHub Releases pour les téléchargements. La première APK doit être publiée dans une release stable pour activer les boutons de ces versions du site.

## Publication

- [GitHub Pages, téléchargements et Releases](docs/publishing.md)
- [Créer, signer et tester l'APK Android](docs/android.md)

Le workflow Pages se lance **manuellement après validation**. Les scripts Android préparent des fichiers locaux ; ils ne publient aucune APK. La première APK locale `releases/ardechoise-android-v1.0.0.apk` est compilée et signée, avec l'icône personnalisée. Sa signature et les ressources embarquées sont vérifiées ; elle doit encore être essayée sur téléphone avant publication.

Après les essais sur téléphone et validation : pousser les sources, publier une release stable `v1.0.0` avec l'APK et son `.sha256`, choisir **GitHub Actions** dans **Settings → Pages → Source**, puis lancer **Actions → Publier le mini-site sur GitHub Pages → Run workflow**. L'adresse attendue est `https://rudy-martins.github.io/ardechoise-vite/`. Les détails sont dans [le guide de publication](docs/publishing.md).

## APK locale avec icône personnalisée

Sous Windows, la méthode portable ne nécessite pas Android Studio :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-android-tools.ps1 -AcceptAndroidLicense
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\android-build-local.ps1 -CreateSigningKey -VersionName 1.0.0 -VersionCode 1
```

Les outils sont placés dans `.android-tools/`, ignoré par Git. La compilation utilise `assets/android/app-icon.png`, adapté depuis l'illustration personnalisée fournie, et génère les icônes avec `scripts/android-icons.ps1`. L'APK signée et son SHA-256 sont préparés dans `releases/`, sans publication automatique.

Pour une mise à jour, relancer `android-build-local.ps1` sans `-CreateSigningKey`, avec un `VersionName` adapté et un `VersionCode` supérieur. La clé permanente et les credentials protégés par le compte Windows sont conservés hors du dépôt dans `%LOCALAPPDATA%\Ardechoise\signing` ; le cache Gradle est également hors OneDrive. Sauvegarder la clé **et** son mot de passe pour pouvoir signer les futures versions, notamment après un changement de PC. Les étapes, la sauvegarde et l'alternative Android Studio sont dans [le guide Android](docs/android.md).

L'aperçu `dev:site` permet déjà de télécharger l'APK locale ; le site public utilise les APK de GitHub Releases. Une APK locale signée doit d'abord être testée sur téléphone avant sa publication.

## Visuels de la vitrine

Le logo original `public/logo.png` est conservé. `site/public/site/logo-cutout.png` en fournit une version détourée pour le fond sombre. `site/public/site/casino-alex.png` met en scène Alex à partir du personnage de `public/alex-croupier.png` ; le téléphone et son unique aperçu CUL SEC sont rendus en HTML/CSS.

Les visuels de la vitrine ne sont pas embarqués dans le build Android. Les [prompts et la provenance des images](docs/art-prompts.md) sont documentés. L'icône Android personnalisée est une ressource séparée dans `assets/android/`.
