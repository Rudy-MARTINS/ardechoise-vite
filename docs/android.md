# Générer et signer l'APK Android

## Configuration du jeu Android

Le projet natif `android/` est créé. `capacitor.config.json` définit l'identifiant `fr.ardechoise.game`, le nom `L'Ardéchoise` et les ressources embarquées dans `dist-android/`.

Le build Android contient uniquement le jeu d'origine et ses images/sons locaux, sans `server.url`. Le mini-site indépendant (`site/`, build `dist-site/`) présente l'application et son téléchargement ; il ne doit pas être copié dans Android.

Les joueurs, cartes et scores restent en mémoire pendant la partie ; le jeu ne conserve aucun état à restaurer depuis une sauvegarde Android. La sauvegarde est désactivée dans le manifeste (`allowBackup` et `fullBackupContent` à `false`). Les règles `data_extraction_rules.xml` excluent également les données des sauvegardes cloud et des transferts entre appareils sur Android 12 et versions suivantes, où `allowBackup` seul peut être insuffisant selon le fabricant.

Le `FileProvider` du modèle Capacitor a été supprimé : le jeu n'utilise ni capture de photo, ni sélection ou partage de fichiers. Si une telle fonctionnalité est ajoutée, prévoir un fournisseur avec des chemins limités à un sous-répertoire dédié, sans exposer toute la racine du stockage externe ou du cache.

Capacitor 7 reste compatible avec Node 20.20 utilisé ici. Les paquets `@capacitor/core`, `@capacitor/android` et `@capacitor/cli` doivent rester sur la même version majeure ; `package-lock.json` verrouille les versions installées. Node 22.12+ convient aussi pour une nouvelle installation.

**La première APK signée, `releases/ardechoise-android-v1.0.0.apk` (environ 12 Mo), est publiée sous le nom `ardechoise.apk` dans la Release `V1`.** Elle utilise l'icône personnalisée et embarque le jeu, ses images/sons et la police Fredoka. Sa signature et la correspondance des 11 fichiers du bundle web ont été vérifiées. Les corrections de sécurité décrites ci-dessous concernent les prochains builds ; elles ne remplacent pas automatiquement l'APK déjà publiée. Les essais sur téléphone et la validation d'une mise à jour signée restent nécessaires avant toute nouvelle diffusion.

## Méthode locale Windows sans Android Studio

### Versions des outils de compilation

Le projet utilise **Gradle 8.14.6** et **Android Gradle Plugin 8.13.2**, avec le JDK 21, les Build-Tools 35.0.0 et le SDK 35 existants. Le SDK minimum reste 23 et Capacitor reste en version 7.6.9. AGP 8.13 exige Gradle 8.13+ et Java 17+ ; le wrapper vérifie le SHA-256 officiel de sa distribution.

`android/build-security.gradle` aligne les classpaths de compilation et les configurations Android Lint du projet et des sous-projets Capacitor. Il impose les versions corrigées de Netty, Bouncy Castle, Commons Compress/Lang, jose4j et JDOM. Ces règles concernent les outils de compilation, pas les dépendances d'exécution du jeu. Lors d'une future mise à jour d'AGP, vérifier le graphe réellement résolu, y compris Lint, et les avis de sécurité avant d'adapter ces versions ; ne pas modifier `node_modules`.

Les builds de validation peuvent utiliser `:app:assembleRelease` sans les variables `ARDECHOISE_KEYSTORE_*`, `ARDECHOISE_KEY_ALIAS` et `ARDECHOISE_KEY_PASSWORD` : ils produisent alors une APK **non signée**, sans ouvrir la clé privée. Cette APK sert à valider la compilation et ne doit pas être distribuée. La procédure de signature ci-dessous reste distincte.

### Limites des correctifs de l'outillage

La distribution officielle Gradle 8.14.6 contient encore Commons Lang 2.6, affecté par CVE-2025-48924 : une entrée très longue à `ClassUtils.getClass` peut provoquer un déni de service. Aucun appel à cette méthode n'a été trouvé dans les bibliothèques de cette distribution examinées. Gradle ne remplace pas cette bibliothèque dans la branche 8.14 car le changement de package vers Lang 3 serait incompatible ; ne pas remplacer manuellement des JAR dans la distribution vérifiée.

Certains outils Lint contiennent également des bibliothèques intégrées ou modifiées par Google/Kotlin, dont un fork privé de Protobuf dans le compilateur Kotlin et JLine. Les contraintes Maven ne remplacent pas ces copies. La récursion non bornée observée dans le parseur Protobuf peut présenter un risque de déni de service sur des métadonnées Kotlin malveillantes ; aucune exploitation dans ce projet Java n'a été démontrée. Ces outils ne sont pas embarqués dans le jeu Android. Une migration future de Lint/AGP doit vérifier ces copies, leur utilisation et la compatibilité du build ; un résultat OSV sans avis sur le graphe Maven ne couvre pas à lui seul les bibliothèques intégrées.

Voir [le suivi des dépendances internes Gradle](https://github.com/gradle/gradle/issues/38600). Les variantes Kotlin signalées par certains scanners doivent être vérifiées contre les plages affectées de l'éditeur : aucune CVE applicable à Kotlin stdlib 2.0.21 n'a été confirmée ici.

À la racine du dépôt, installer les dépendances puis les outils portables :

```powershell
npm ci
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-android-tools.ps1 -AcceptAndroidLicense
```

Le script télécharge le JDK 21 et les outils Android dans `.android-tools/`, ignoré par Git, et vérifie le SHA-256 des archives. Il installe la plateforme API 35, les Build-Tools et Platform-Tools nécessaires. Le paramètre `-AcceptAndroidLicense` accepte les conditions de licence Android SDK pour ces composants ; le retirer permet seulement de préparer les outils jusqu'à cette étape.

Pour la première compilation, créer une clé permanente de signature :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\android-build-local.ps1 -CreateSigningKey -VersionName 1.0.0 -VersionCode 1
```

Pour les versions suivantes, conserver cette clé et augmenter le `VersionCode` :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\android-build-local.ps1 -VersionName 1.0.1 -VersionCode 2
```

Le script configure les chemins du JDK/SDK, construit le jeu, synchronise Capacitor, génère les icônes, compile l'APK release et vérifie sa signature avec `apksigner`. Il prépare les fichiers suivants, sans les publier :

```text
releases/ardechoise-android-v1.0.0.apk
releases/ardechoise-android-v1.0.0.apk.sha256
```

Le nom suit `VersionName`. `releases/` est ignoré par Git. Le cache Gradle est placé dans `%LOCALAPPDATA%\Ardechoise\gradle`, hors du dossier OneDrive, pour éviter les conflits de synchronisation pendant la compilation.

## Icône personnalisée

`assets/android/app-icon.png` est la version adaptée de l'illustration fournie par l'utilisateur : personnage en pixel art, lunettes, cartes Joker et cocktail sur fond orange. Le fond a été adapté avec imagegen pour l'icône d'application.

`scripts/android-icons.ps1` génère les icônes du lanceur pour les différentes densités Android, ainsi que les ressources adaptatives sur fond orange. Le script de compilation locale l'exécute automatiquement. Après une modification de l'image source, on peut aussi le lancer seul :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\android-icons.ps1
```

Les images du jeu et l'écran de démarrage restent ceux du projet. Les ressources natives générées dans `android/app/src/main/res/` peuvent être conservées dans Git.

## Conserver la clé et son mot de passe

La compilation locale conserve la signature hors du dépôt :

```text
%LOCALAPPDATA%\Ardechoise\signing\ardechoise-release.jks
%LOCALAPPDATA%\Ardechoise\signing\signing.credential.xml
```

L'alias est `ardechoise`. Le mot de passe aléatoire est protégé par DPAPI dans le fichier de credentials : il peut être relu avec le même compte Windows sur cette machine. Le script ne l'affiche pas et transmet les secrets aux outils par des variables d'environnement temporaires. Il refuse de remplacer une clé existante.

**Sauvegarder la clé et son mot de passe est indispensable.** Les mises à jour doivent garder le même identifiant Android et la même clé de signature. Conserver une copie privée du `.jks` et le mot de passe dans un gestionnaire de mots de passe ou un support sécurisé ; ni l'un ni l'autre ne doit être ajouté à Git.

La seule copie du fichier `signing.credential.xml` ne suffit pas pour changer de PC ou de compte Windows : sa protection DPAPI est liée à l'environnement d'origine. Avant une migration, récupérer le mot de passe depuis une session PowerShell locale avec ce compte (`Import-Clixml`, puis `GetNetworkCredential().Password`) et l'enregistrer manuellement dans le coffre sécurisé. Faire cette opération localement, sans partager le mot de passe ou la sortie de la commande dans un chat, une capture ou un journal. Sur la nouvelle machine, utiliser la même clé et la méthode de signature manuelle ci-dessous.

## Alternative avec Android Studio

Installer [Android Studio](https://developer.android.com/studio), au minimum **Narwhal 3 Feature Drop (2025.1.3)** ou une version ultérieure compatible avec AGP 8.13. Dans **Tools → SDK Manager**, installer la plateforme Android 15/API 35, les Build-Tools et Platform-Tools. Sélectionner un JDK 21 dans **Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK**. Un Android Studio plus récent peut proposer un autre JDK : vérifier la version utilisée par Gradle.

Depuis la racine du dépôt :

```powershell
npm ci
npm run android:prepare
npm run android:open
```

`android:prepare` construit le jeu dans `dist-android/`, crée `android/` s'il est absent, ajoute une configuration Gradle de signature sans secret et exécute `cap sync android`. Relancer cette commande après une modification du jeu. La configuration gérée est `android/app/ardechoise.release.gradle`, appliquée depuis `build.gradle` ; elle lit les informations de signature dans l'environnement.

Pour une signature créée manuellement, utiliser **Build → Generate Signed App Bundle or APK → APK**. Garder la clé hors du dépôt. Si une clé existe déjà dans `%LOCALAPPDATA%\Ardechoise\signing`, réutiliser cette clé plutôt que d'en créer une nouvelle.

Les scripts de release peuvent également utiliser cette signature avec un JDK et SDK installés ailleurs. Dans un terminal PowerShell dédié, adapter les chemins et saisir les mots de passe à l'invite :

```powershell
$env:JAVA_HOME = 'C:\chemin\vers\jdk-21'
$env:ANDROID_HOME = 'C:\chemin\vers\Android\Sdk'
$env:GRADLE_USER_HOME = Join-Path $env:LOCALAPPDATA 'Ardechoise\gradle'
$env:ARDECHOISE_KEYSTORE_PATH = 'C:\chemin-prive\ardechoise-release.jks'
$env:ARDECHOISE_KEY_ALIAS = 'ardechoise'
$taskStoreSecret = Read-Host 'Mot de passe du coffre' -AsSecureString
$env:ARDECHOISE_KEYSTORE_PASSWORD = [System.Net.NetworkCredential]::new('', $taskStoreSecret).Password
$taskKeySecret = Read-Host 'Mot de passe de la clé' -AsSecureString
$env:ARDECHOISE_KEY_PASSWORD = [System.Net.NetworkCredential]::new('', $taskKeySecret).Password
$env:ARDECHOISE_VERSION_NAME = '1.0.0'
$env:ARDECHOISE_VERSION_CODE = '1'
npm run android:apk
```

Fermer le terminal après la compilation. Le script refuse une clé placée dans le dépôt ; les mots de passe ne doivent pas être copiés dans les fichiers du projet ni passés en arguments de commande.

## Vérifications et dépannage

Avant de préparer une version à diffuser :

```powershell
npm test
npm run lint
```

Pour vérifier seulement la configuration, sans compilation native :

```powershell
npm run build:android
node scripts/android-project.mjs --check
node scripts/android-release.mjs --check
```

La dernière commande nécessite un environnement JDK/SDK et de signature configuré. En cas de `SDK location not found`, vérifier `ANDROID_HOME` ou laisser Android Studio créer `android/local.properties`. En cas d'erreur Java/Gradle, comparer le JDK du terminal et celui de l'IDE. Si une image ou un son est absent, relancer `android:prepare` et vérifier le build Android plutôt que le build Pages.

## Tester l'APK exacte avant publication

Installer l'APK release préparée sur un vrai téléphone, par transfert du fichier et ouverture sur Android, ou avec les outils portables :

```powershell
& '.\.android-tools\sdk\platform-tools\adb.exe' install -r .\releases\ardechoise-android-v1.0.0.apk
```

Une installation debug utilise une autre clé ; Android peut refuser son remplacement par la release. Désinstaller cette version debug avant le premier essai release. Pour une mise à jour publique, tester au contraire l'installation par-dessus la précédente release avec la même clé, sans désinstallation.

Vérifier :

1. Démarrage, icône personnalisée, logo/images, saisie et suppression des joueurs.
2. Partie complète : choix, cartes, gorgées données/reçues, bouton Cartes, fautes, CUL SEC et récapitulatif.
3. Sons, dont HARDCORE ; retour après fermeture et mise en veille.
4. Portrait, paysage et changement d'orientation pendant une partie.
5. Jeu et ressources disponibles en mode avion après installation.
6. Installation d'une mise à jour signée avec la même clé, par-dessus la version précédente.

Noter le téléphone, la version Android, la version du jeu, le commit et le SHA-256 dans les notes de release. La signature vérifiée et le SHA-256 ne remplacent pas ces essais. Publier seulement après les essais et validation ; la procédure GitHub est dans [publishing.md](publishing.md).

## Références officielles

- [Environnement Capacitor 7](https://capacitorjs.com/docs/v7/getting-started/environment-setup)
- [JDK et SDK de Capacitor 7](https://capacitorjs.com/docs/v7/updating/7-0)
- [Compatibilité Android Gradle Plugin 8.13](https://developer.android.com/build/releases/agp-8-13-0-release-notes)
- [Correctifs de Gradle 8.14.6](https://docs.gradle.org/8.14.6/release-notes.html)
- [Signature des applications Android](https://developer.android.com/studio/publish/app-signing)
- [Sauvegardes et règles d'extraction Android](https://developer.android.com/identity/data/autobackup)
- [Limiter les chemins d'un FileProvider](https://developer.android.com/privacy-and-security/risks/file-providers)
- [Vérification avec apksigner](https://developer.android.com/tools/apksigner)
