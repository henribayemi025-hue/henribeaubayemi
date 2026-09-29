# 48 — Des agents qui parlent comme des humains (recherche du 29/09)

Demandé par Beau le 29/09 : « vraiment humanise, ils doivent être comme les
humains, lancer des blagues, troller… ne te précipite pas, va sur GitHub et
sur le net regarder les dépôts des gens ».

## Ce qui a été étudié

- **SillyTavern — Character Design** (logiciel libre de personnages) :
  https://docs.sillytavern.app/usage/core-concepts/characterdesign/
  — « Le modèle reprend le style et la longueur du premier message plus que
  de tout le reste » ; des **exemples de dialogue** apprennent la voix ; une
  **note de personnage** injectée en fin de contexte la rappelle.
- **Guides de cartes de personnage** (TavernSprite, 2026) :
  https://tavernsprite.com/blog/how-to-write-sillytavern-character-persona/
  — « 2 à 3 échanges d'exemple apprennent la voix mieux que des paragraphes » ;
  le précis bat le vague (« elle répond par l'humour quand elle est gênée »).
- **Humanizer** (blader, licence MIT) : https://github.com/blader/humanizer
  — 26 tics d'écriture d'IA tirés de la page Wikipédia « Signs of AI
  writing » : « pas X mais Y », listes de trois, vocabulaire gonflé,
  formules de fin, gras décoratif, rappel de ce que le lecteur sait déjà…
- **Humanize AI Writing** (haidrrrry) :
  https://github.com/haidrrrry/humanize-ai-writing — même idée, liste de
  mots interdits.
- **FriendGPT** (Cyber-Gwen) : messages courts, comme on écrit à un ami.
- **Consigne de ChatGPT 4o** (recueils publics de consignes système, ex.
  https://github.com/dontriskit/awesome-ai-system-prompts) : il est dit au
  modèle de **« s'accorder à l'ambiance de l'utilisateur »** (ton, façon
  de parler).

## Ce que Léo en a fait (29/09)

1. **La voix de chaque agent** (migration 0220, `legion-former`) : cinq
   répliques types écrites dans SA personnalité — arrivée en mode copain,
   question sérieuse, taquinerie (il répond du tac au tac par une vanne
   gentille), personne agacée, bonne nouvelle. `legion-repondre` les lui
   montre comme exemples de sa façon de parler.
2. **Les tics d'IA interdits**, en français : « crucial », « essentiel »,
   « un pilier », « un cadre solide », « en effet », « n'hésite pas »,
   « absolument », « pas seulement… mais aussi », listes de trois, gras
   décoratif, résumé final, proposition d'aide finale.
3. **Calque du ton** : familier avec le familier, sérieux avec le sérieux,
   blague avec la blague ; taquin → humour et complicité, jamais romantique
   ni sexuel.
4. **Rappel de style en fin de consigne** (la « note de personnage » de
   SillyTavern).

Ce qui ne bouge pas : la charte (dire vrai ; une IA le dit si on le lui
demande sincèrement).
