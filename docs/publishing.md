# Publier le mini-site et les versions Android

## Un site dédié au téléchargement

Le build GitHub Pages prépare :

```text
dist-site/index.html  → mini-site de présentation et téléchargement
dist-site/assets/     → bundles de la vitrine
```

Pour ce dépôt, l'adresse attendue est `https://rudy-martins.github.io/ardechoise-vite/`.

Le jeu conserve son entrée d'origine à la racine du projet et son build `dist/`. Il n'est pas embarqué dans le mini-site ni publié par ce workflow. La vitrine présente le jeu et l'APK ; elle ne propose pas de jeu en ligne.

`npm run build:pages` utilise `vite.site.config.js` et définit le préfixe `/ardechoise-vite/` pour les liens et ressources. Pour un autre nom de dépôt ou un domaine personnalisé, ajuster le `base` du mode `pages` de cette configuration avant publication.

## Prévisualiser avant validation

Pour ouvrir la vitrine existante avec le téléchargement de l'APK locale :

```powershell
npm run dev:site
```

Ouvrir `http://localhost:5174/`. Les boutons Android servent l'APK présente dans `releases/` si son `.sha256` correspond au fichier. Ce téléchargement passe par le serveur de développement uniquement : l'APK n'est copiée ni dans `site/public/`, ni dans `dist-site/`. Le compteur affiche toujours les statistiques réelles de GitHub et ne compte pas les téléchargements de cet aperçu.

Pour vérifier la version qui sera publiée sur Pages :

```powershell
npm ci
npm test
npm run lint
npm run build:pages
npm run preview:pages
```

Ouvrir `http://localhost:4174/ardechoise-vite/`. Les builds et `preview:pages` utilisent uniquement les APK de GitHub Releases ; l'APK locale n'y est pas servie. Vérifier le mini-site en portrait, paysage et desktop : navigation, boutons Android, aperçu CUL SEC, images, compteur et absence de débordement horizontal. Le bouton télécharge une APK stable publique lorsqu'elle est disponible et reste désactivé sinon. Le lien « Consulter les versions » est distinct du téléchargement. La vitrine ne contient aucun accès au jeu en ligne.

Pour le build hors Pages, utiliser `npm run build:site` puis `npm run preview:site` sur `http://localhost:4174/` ; cette prévisualisation utilise également GitHub Releases uniquement.

Les fichiers publics proviennent uniquement de `dist-site/`. `dist/` reste le build du jeu et `dist-android/` est réservé à Capacitor.

## Publier sur GitHub Pages après validation

Le workflow `.github/workflows/pages.yml` est uniquement déclenché par `workflow_dispatch`. Un push ou une pull request ne publie rien.

Après les essais de l'APK sur téléphone, la relecture des fichiers et validation de la publication :

1. Pousser les sources validées sur la branche choisie. Le workflow doit être présent sur la branche par défaut pour apparaître dans l'interface Actions.
2. Publier une release stable `v1.0.0` sur le commit de l'APK testée, avec `ardechoise-android-v1.0.0.apk` et son `.sha256` en pièces jointes, selon la procédure ci-dessous.
3. Dans **Settings → Pages → Build and deployment → Source**, choisir **GitHub Actions**.
4. Dans **Actions → Publier le mini-site sur GitHub Pages → Run workflow**, sélectionner la branche validée et lancer manuellement. Le workflow vérifie le code, construit la vitrine et publie uniquement `dist-site/`.
5. Attendre les jobs `build` puis `deploy`, puis ouvrir `https://rudy-martins.github.io/ardechoise-vite/` et contrôler le téléchargement depuis le site public.

L'environnement de déploiement est `github-pages`. Une règle de branche ou de validation de cet environnement peut compléter le lancement manuel si souhaité. Aucun déclenchement ni réglage GitHub n'a été effectué dans le cadre de la préparation locale.

## Publier une APK testée sur GitHub Releases

**Une APK locale signée est disponible : `releases/ardechoise-android-v1.0.0.apk`.** Elle se télécharge depuis l'aperçu `dev:site`, mais doit encore être installée et essayée sur téléphone avant publication. Aucune APK n'a été envoyée sur GitHub Releases ; les builds et prévisualisations de production conservent donc leur bouton « APK bientôt disponible ». La génération, la signature et les essais sont documentés dans [android.md](android.md).

Suivre d'abord [la génération, la signature et les essais Android](android.md). Le fichier public doit être **l'APK release signée qui a été testée**.

Après validation de cette version :

1. Créer un tag de version, par exemple `v1.0.0`, sur le commit utilisé pour construire l'APK.
2. Dans GitHub **Releases → Draft a new release**, choisir ce tag, un titre et des notes : modifications, version Android testée, commit, versionCode et résultat des essais.
3. Joindre `ardechoise-android-v1.0.0.apk` et son fichier `.sha256` depuis `releases/`. Ne joindre ni clé de signature, ni APK debug, ni APK non testée.
4. Conserver le brouillon le temps de relire les fichiers et les notes ; publier comme release stable après validation et la définir comme dernière version.
5. Tester le téléchargement depuis le mini-site, comparer le SHA-256 et confirmer l'installation du fichier téléchargé.

Conserver les anciennes releases pour l'historique et le compteur cumulé. Chaque nouvelle APK conserve `fr.ardechoise.game`, la même clé et un `versionCode` supérieur. Le nom d'asset doit se terminer par `.apk` pour être reconnu.

Le site public sélectionne la dernière release stable contenant effectivement une APK ; une version plus récente sans APK ou une préversion ne remplace pas ce téléchargement. Une nouvelle release ne nécessite pas de modifier le lien dans le code ni de republier la vitrine. Avant la première APK stable publique, le bouton des builds de production reste désactivé et affiche « APK bientôt disponible ». La FAQ contient un lien séparé pour consulter les Releases.

## Compteur public sans backend

La source est l'API REST publique des Releases du dépôt `Rudy-MARTINS/ardechoise-vite`. Les assets APK exposent le champ `download_count` ; le site additionne ces valeurs sur toutes les versions publiques, y compris les préversions. Les brouillons ne sont pas accessibles via cette requête publique.

Ce nombre indique des **téléchargements de fichiers** mesurés par GitHub : il ne mesure ni installations ni utilisateurs uniques. Un clic sur le bouton n'est jamais ajouté localement au compteur.

En l'absence d'APK, le compteur vaut zéro. En cas d'indisponibilité, d'erreur réseau ou de limite de l'API publique, le mini-site affiche un état indisponible et conserve un accès aux Releases. Il n'affiche pas un nombre inventé et n'embarque aucun token GitHub dans le navigateur.

Pour vérifier après une publication, consulter les assets sur l'API ou les statistiques de release GitHub, puis comparer avec le compteur du site.

## Références officielles

- [Configurer GitHub Pages avec GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Workflow Pages et permissions de déploiement](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Créer et gérer les Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [API REST des Releases](https://docs.github.com/en/rest/releases/releases)
- [API des assets et download_count](https://docs.github.com/en/rest/releases/assets)
