# Icône Android de L’Ardéchoise

`app-icon.png` est le visuel maître de l’icône, adapté depuis l’image fournie par l’utilisateur : personnage en pixel art, lunettes de soleil, sweat rouge « Ardéchoise », verre vert et deux cartes JOKER. L’adaptation utilise l’outil intégré `image_gen`, sans CLI de génération d’images. La seule modification demandée est le remplacement du noir extérieur à la bordure arrondie par un fond orange opaque ; le personnage, les cartes, le verre, le texte et la bordure sont conservés.

La sortie PNG de l’outil a été copiée ici sans traitement supplémentaire. `scripts/android-icons.ps1` produit uniquement les ressources Android de l’icône par redimensionnement et centrage avec Windows `System.Drawing`, sans redessiner l’illustration. Il ne modifie ni le jeu ni l’écran de démarrage.

Après création du projet natif avec `npm run android:prepare`, lancer depuis la racine :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/android-icons.ps1
```

Les icônes classiques mesurent 48, 72, 96, 144 et 192 pixels pour les densités mdpi à xxxhdpi. Les calques adaptatifs ont un canevas transparent de 108 dp avec l’illustration centrée sur 60 dp, sur un fond Android `#FF9F1C`. Les noms de ressources restent ceux du template Capacitor : `ic_launcher`, `ic_launcher_round`, `ic_launcher_foreground` et `ic_launcher_background`.

## Prompt exact de l’adaptation

```text
Use case: precise-object-edit. Asset type: Android launcher icon master PNG. Input image 1 is the EDIT TARGET, the user's approved artwork. Adapt this artwork for a square Android app launcher icon, preserving it as closely as possible. Keep exactly the same pixel art character with brown hair and pixel sunglasses, red sweatshirt saying 'Ardéchoise', green lime drink in left hand, two JOKER cards in right hand, bright gold orange sparkling rays, thick cream and orange border. Preserve all text, pose, palette, layout and identity. Output a clean square 1024x1024 flat bitmap icon asset, straight-on, no phone/mockup. Make only this change: replace black outside the rounded orange sticker border with the same warm golden-orange background, so the full square has an opaque warm orange background with the existing sticker intact. Do not redesign or add anything. Keep the complete original rounded square sticker visible with a little surrounding breathing room, no cropping of cards, glass or border. This is icon artwork for the application L'Ardéchoise, not a new logo.
```
