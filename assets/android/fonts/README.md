# Police Android hors ligne

Fredoka est embarquée uniquement dans le build Android. Le jeu web et ses fichiers source restent inchangés.

Le fichier variable officiel a été téléchargé le 10 octobre 2026 depuis le dépôt Google Fonts, sans modification, puis renommé `Fredoka-variable.ttf` pour simplifier son URL locale. Il couvre les graisses 300–700 et conserve la largeur par défaut. La licence SIL Open Font License 1.1 est fournie dans `OFL.txt` et copiée avec la police dans le bundle Android.

Sources officielles :

- [Fredoka dans Google Fonts](https://github.com/google/fonts/tree/main/ofl/fredoka)
- [Fichier TrueType variable](https://raw.githubusercontent.com/google/fonts/main/ofl/fredoka/Fredoka%5Bwdth%2Cwght%5D.ttf)
- [Licence OFL](https://raw.githubusercontent.com/google/fonts/main/ofl/fredoka/OFL.txt)

Empreintes SHA-256 des fichiers intégrés :

```text
2ba02e68b152868aef9ba28e24b3648c7d457fe6f25c761f2c2c53fb61a73fc8  Fredoka-variable.ttf
5c9e7eee5c6b25f4b05b8d53b2e470ea4962f9ced742d044a98f7d95d1375bab  OFL.txt
```

`vite.android.config.js` retire les liens Google Fonts du HTML Android et injecte une déclaration `@font-face` locale. Aucune requête aux serveurs de polices Google n'est nécessaire dans l'APK.
