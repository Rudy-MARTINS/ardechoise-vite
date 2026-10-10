# L’Ardéchoise — visuels du mini-site

Les deux visuels ont été créés avec l’outil intégré `image_gen`, sans CLI ni traitement programmatique des images. Les fichiers d’origine du jeu sont conservés.

## Logo détouré

- Fichier livré : `site/public/site/logo-cutout.png`
- Source officielle utilisée comme cible de détourage : `public/logo.png` (deux chopes, texte ARDÉCHOISE).
- La sortie originale de l’outil est conservée dans `site/public/site/logo-cutout.png`.
- Fond transparent demandé ; copie de la sortie sans modification.

### Prompt exact

```text
Use case: background-extraction
Asset type: official existing logo cutout for a website, PNG with genuine transparent alpha.
Input image 1 is the EDIT TARGET: the existing official ARDÉCHOISE logo artwork.
Primary request: remove only the soft blurred beige/brown rectangular background around the existing centered logo. Keep the existing two clinking amber beer mugs, white foam, golden sparks, local golden glow, dark red outlines/shadows and all typography exactly as supplied.
Text invariant: "ARDÉCHOISE", with the accent on É, exact letter shapes and spacing from the original artwork. This is an extraction of existing pixels, not a new logo design.
Composition/framing: tightly bound transparent canvas with modest padding around all visible artwork and its local glow. Maintain the artwork's original proportions.
Constraints: preserve the original illustration and exact lettering, preserve white/yellow foam and highlights, preserve the mugs' interior glass color, smooth clean anti-aliased outline. The outside of the artwork must have genuinely transparent alpha, including corners.
Avoid: beige box, black background, checkerboard baked into the pixels, new font, altered spelling, new elements, redesigned logo.
```

## Casino avec Alex

- Fichier livré : `site/public/site/casino-alex.png`
- Source d’identité/style : `public/alex-croupier.png`, personnage pixel art officiel du jeu. La bordure de la carte et son texte ne sont pas inclus dans le nouveau visuel.
- La sortie originale de l’outil est conservée dans `site/public/site/casino-alex.png`.
- Illustration paysage seule, sans interface, téléphone, slogan ni logo : les éléments interactifs et le téléphone du mini-site sont ajoutés en HTML/CSS.
- Composition : Alex au centre droit, zone sombre à gauche pour le contenu, table au bas de l’image. Le CSS adapte le recadrage à chaque format et place le téléphone plus bas en portrait pour laisser le visage d’Alex visible.

### Prompt exact

```text
Use case: compositing
Asset type: standalone wide illustrated casino background for an official mobile game landing page, landscape 1536 by 1024 or larger.
Input image 1: identity/style reference for ALEX, the existing pixel art card dealer. Use only the CHARACTER within this reference, exclude the card border, orange patterned background and the words "Tirer une carte".
Primary request: a beautiful warm, dark retro casino interior with this same Alex pixel character welcoming the visitor from behind a red and deep green felt card table. Match the official character faithfully: distinct black and dark olive pixel hair sweeping over his eye, black over-ear headset and microphone, golden orange square pixel face, cheerful expression, white shirt sleeves, black vest, red bow tie, white shirt motif, small golden buttons, holding two playing cards. Alex remains visibly crisp pixel art, with large intentional square pixel edges, while the warm casino environment is a richly detailed cinematic illustration. One hand opens in welcome, the other holds the cards. This is the established Alex identity, not a replacement character.
Scene/backdrop: cozy dark wood casino lounge, amber hanging pendant lamps, soft distant bottle shelves, warm orange rim lights, deep brown and charcoal shadows. No readable signage. Foreground curved polished wood card table, red felt main surface, deep green inner edge, a few playing cards, tasteful red and green poker chip stacks, one or two detailed amber beer mugs with foam. No people in foreground.
Composition/framing: wide landscape. Alex is a mid-size waist-up dealer at x about 65 percent, y about 58 percent, occupying about one quarter of the image width. His head and hands remain clearly framed, not clipped. Keep the far right 15 percent restrained so a live HTML phone mockup can overlay there. Keep the LEFT HALF dark and visually quiet for a separate HTML logo and copy. Leave top left especially quiet and dark. Table spans lower quarter. Important dealer/card/table elements inside center-right safe zone for mobile cropping.
Lighting/mood: charming, playful, welcoming, amber glow, vivid but restrained orange highlights, rich contrast and clear focal point.
Constraints: only ONE Alex, faithful pixel character reference, no logos, no text, no UI, no phone or tablet, no screenshot, no landing page layout baked into this image, no giant title. This is purely standalone artwork for web.
Avoid: realistic human dealer, 3D human character, vector simplification, blurred Alex pixel art, unreadable extra pseudo-text, crowd of foreground people, modern bright white casino, excessive lens flare.
```
