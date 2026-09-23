# SheetJS 0.20.3

Copie exacte de `https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs` (23/09/2026),
sous licence Apache 2.0 (fichier `LICENSE` à côté).

SHA-256 de `xlsx.mjs` : `1a0fb062ee9781b13f6687371b202aaefc53b6ce55b530c027e01f9c087b77db`

Pourquoi une copie : la version publiée sur npm (0.18.5) a une faille connue
à la lecture de fichiers piégés (CVE-2023-30533), et le paquetage des
fonctions Supabase refuse les imports depuis cdn.sheetjs.com. Utilisée par
`_shared/tableur.ts` (lire et écrire les classeurs des agents de Legion).
