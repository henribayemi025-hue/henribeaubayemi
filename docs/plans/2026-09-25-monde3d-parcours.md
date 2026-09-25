# Monde 3D — le parcours rejoué automatiquement (lot 3.1, 25/09)

Beau : « sans planter ni bug », « triple vérifié ». Avant d'ajouter quoi que
ce soit au monde, un parcours complet est rejoué par un script
(`parcours-3d.mjs`, Playwright sur la page d'essai `essai-monde.html`) : à
chaque étape, une capture d'écran, les erreurs de page, le coût de 30 pas de
simulation et les images par seconde observées.

Le rendu du harnais est logiciel (SwiftShader, pas de carte graphique) : les
images par seconde sont **relatives** entre étapes, pas celles d'un vrai
téléphone ou ordinateur. Le coût de simulation (ms pour 30 pas) est, lui,
fidèle : c'est le calcul, pas le dessin.

## Les 25 étapes

hall → marche → réception (salut) → ascenseur → étage Produit → salle de
réunion → atelier → retour au hall → dehors → voiture (démarrer, virage,
nitro, course, descendre) → hélicoptère (décoller, atterrir) → chez les
agents (maisons) → bateau (partir, descendre en mer) → nage → plongée →
sortie de l'eau → hall de nuit → pluie → changement de caméra.

## Résultat du 25/09 (3ᵉ passage, après corrections)

| Étape | ms / 30 pas | images/s (relatif) | Note |
| --- | --- | --- | --- |
| hall, marche, réception, ascenseur | 17–23 | 0,2–0,6 | ville chargée derrière les vitres : la partie la plus lourde |
| étage, réunion, atelier | 18–25 | 0,1–0,2 | |
| dehors, voiture, course | 21–28 | 0,6–0,8 | |
| hélicoptère | 18–19 | 0,2–0,8 | |
| maisons, bateau, nage, plongée | 17–28 | 3,2–3,7 | dix fois plus léger que la ville |
| hall de nuit, pluie | 17–18 | 0,6–1,8 | |

**0 erreur de page** sur les 25 étapes. Le calcul d'un pas coûte moins d'une
milliseconde : ce qui rame, c'est le dessin de la ville, pas la logique.

## Bugs trouvés et corrigés le jour même

1. **Enfermé dans l'hélicoptère.** Changer de lieu (aller « chez les agents »)
   en plein vol laissait le joueur dans un hélicoptère invisible : plus de
   bateau, plus de nage. → `quitterVehicule()` : on se pose de force avant
   de changer de lieu, et dès qu'on n'est plus en ville.
2. **La caméra traversait les immeubles.** Contre une tour, on voyait la
   façade de l'intérieur. → la caméra se rapproche du véhicule jusqu'à sortir
   du bloc (`horsDesMurs`), en voiture comme en hélicoptère.
3. (harnais) Le premier passage cassait à mi-course : Vite recharge la page
   dès qu'un fichier de `public/` change, et la traduction du catalogue y
   écrivait toutes les minutes. → la traduction écrit dans le bac et copie à
   la fin.

## Ce qui reste observé, pas encore corrigé

- La voiture démarre lentement au harnais (6–12 km/h après 4 s) et s'arrête
  net au premier véhicule de la circulation devant elle : normal (elle ne
  rentre pas dans le bus), mais il faudrait un klaxon et un dépassement.
- Les passants traversent les voitures : corrigé dans le lot 3.3 (ils sont
  bousculés et se fâchent).

## Comment rejouer

```
# page d'essai : npx vite --port 4195 (déjà lancée dans la session)
cd <bac> && node parcours-3d.mjs          # ordinateur, 1280 × 800
MOBILE=1 node parcours-3d.mjs             # téléphone, 390 × 844
```

Pendant un passage, ne pas modifier `src/` ni `public/` : la page se
recharge et le passage s'interrompt.
