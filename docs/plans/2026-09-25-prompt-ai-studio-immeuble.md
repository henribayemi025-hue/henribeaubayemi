# Prompt à coller dans Google AI Studio (mode « Build ») : l'immeuble de Léo

_25/09/2026. Demande de Beau : « fais le prompt pour Google AI Studio pour
qu'elle me génère comment ça se présente l'immeuble », avec de belles icônes
pour les connecteurs. Beau renvoie le code obtenu ; Claude en reprend les
couleurs, la mise en page et les gestes. Les données d'exemple et les photos
du prototype ne sont jamais reprises telles quelles (règle : rien d'inventé
dans ce qui est visible)._

---

```
Crée une application web React + Tailwind, un seul écran interactif, en français. Le nom de l'écran est « L'immeuble ».

CONTEXTE
Léo est une plateforme où n'importe qui, partout dans le monde, crée une entreprise d'agents d'intelligence artificielle. Chaque agent a un nom, un visage, un poste, un département, un chef et un grade (stagiaire, junior, confirmé, directeur). Les agents prennent des tâches, rendent des livrables, se confient du travail, tiennent des réunions, apprennent des compétences et codent dans un « atelier de code ». « L'immeuble » montre l'entreprise en coupe, comme une maison de poupée, la nuit, avec des agents vivants.

STYLE (obligatoire)
- Nuit chaleureuse, pas froide. Couleurs exactes : fond #0B1120, panneaux #121A2B, cartes #1A2337, survol #222D45, traits #2A3550, texte #EDF1F8, texte secondaire #93A1B8, laiton #E3A857, laiton clair #F2C98A, turquoise #5FC8C0, terracotta #C25E38, succès #34D399, alerte #FB7185.
- Grands titres élégants avec une police à empattements (Fraunces ou Playfair Display), le reste en Inter.
- Détails soignés : fenêtres qui s'allument en laiton, reflets doux, ombres légères, petites animations fluides (pas de clignotement agressif).
- Icônes : Lucide pour l'interface. Pour les connecteurs, les VRAIS logos de marque via Simple Icons (https://cdn.simpleicons.org/<nom>) : Notion, GitHub, Google Drive, Gmail, Google Calendar, Slack, Canva, Figma, Stripe, Supabase, Vercel, WhatsApp. Chaque logo dans une pastille ronde, avec sa couleur de marque.
- Aucune photo de banque d'images. Les visages sont des avatars dessinés (initiales sur un disque coloré, ou un petit personnage illustré en SVG).
- Doit être beau à 390 px de large (téléphone) ET sur un grand écran de 1440 px. Sur téléphone, l'immeuble se fait défiler verticalement et les panneaux s'ouvrent en feuille depuis le bas.
- Respecte « réduire les animations » (prefers-reduced-motion).

DONNÉES
Mets toutes les données d'exemple dans UN seul objet JSON en haut du fichier (entreprise, départements, agents avec leur état, fil d'activité, connecteurs), pour que je puisse les remplacer par de vraies données. Écris bien « Données d'exemple » en petit en bas de l'écran. Exemple d'entreprise : une marketplace de voitures d'occasion, 12 agents, 4 départements (Direction, Produit, Développement, Marketing).
États possibles d'un agent : « travaille », « a une tâche », « en réunion », « à l'Institut », « à l'atelier de code », « disponible », « en veille ».

CE QUE L'ÉCRAN CONTIENT
1. L'immeuble en coupe (au centre)
   - Sur le toit : l'Institut (une verrière), où s'assoient les agents qui apprennent.
   - Un étage par département, la Direction en haut. Chaque agent à son bureau avec son avatar ; l'écran de son ordinateur s'allume et une petite bulle dit ce qu'il fait quand il travaille. En veille : bureau dans la pénombre.
   - Rez-de-chaussée : l'accueil (les nouvelles recrues entrent par la porte avec un badge « nouveau »), la salle de réunion (les agents en réunion y sont assis autour d'une table), l'atelier de code (un grand écran où défilent des lignes de code quand un agent y travaille).
   - Ciel de nuit avec étoiles et lune ; ville discrète en arrière-plan.
2. Un personnage que l'utilisateur dirige
   - Un petit visiteur (l'utilisateur) qu'on déplace au clic ou au doigt : il marche jusqu'à l'endroit touché, prend l'ascenseur entre les étages. Arrivé près d'un agent, une bulle « Parler » apparaît.
3. La fiche d'un agent (clic sur un agent)
   - D'abord la fiche : avatar, nom, poste, grade, chef, compétences (puces), droits (« Lecture seule » ou « Peut modifier »).
   - Puis un bouton « Voir comment il travaille » qui ouvre un second panneau : sa tâche en cours et depuis quand, le modèle d'IA utilisé, ses sources (liens), ses chiffres du jour (messages, livrables, coût), ses 5 derniers messages.
4. Le fil « En direct » (à droite sur grand écran, en bas sur téléphone)
   - Des lignes qui défilent doucement : « Awa confie une tâche à Idris », « Idris a rendu les tests », « Réunion : 3 agents votent », « Nour est bloqué sur… ». Chaque ligne a l'avatar, une icône du genre d'événement et l'heure.
5. L'accueil qui présente l'entreprise
   - Clic sur la réception : une carte « Bienvenue chez … » avec le projet de l'entreprise, le nombre d'agents par département, et un bouton « Visite guidée » qui fait défiler l'immeuble étage par étage.
6. L'organigramme
   - Un bouton bascule l'immeuble en organigramme vivant : le directeur en haut, les chefs, leurs équipes, avec les mêmes pastilles d'état.
7. Les connecteurs
   - Une barre ou un tiroir « Connecteurs » avec les logos de marque cités plus haut, un état « branché / à brancher », et un bouton « Brancher ».
8. Une petite barre d'en-tête : nom de l'entreprise, compteur « X agents au travail maintenant », bouton « Recruter » (ouvre une fenêtre qui propose un poste, avec « Confirmer »).

INTERACTIONS
- Tout est cliquable et donne un retour (survol, pression).
- Transitions douces entre les vues (immeuble ↔ organigramme).
- Les agents qui « travaillent » ont une petite animation discrète (frappe au clavier, écran qui scintille). Ceux « en veille » ne bougent pas.

À ÉVITER
- Pas de pays ni de monnaie par défaut : la devise des coûts vient d'un champ « devise » des données, jamais écrite en dur dans le code.
- Pas de copie de l'art ou des noms d'un jeu existant (Les Sims, etc.).
- Pas de texte en anglais visible.

Livre un code propre, découpé en composants (Immeuble, Etage, Bureau, Agent, Visiteur, FicheAgent, CommentIlTravaille, FilDirect, Accueil, Organigramme, Connecteurs, EnTete).
```

---

## Ce qu'on fera de ce que Google AI Studio produit
- Beau renvoie le code (ou le lien de partage) ; Claude lit tout avant de
  reprendre quoi que ce soit.
- On reprend : couleurs, mise en page, gestes, animations, icônes de marque.
- On ne reprend pas : les données d'exemple (remplacées par les vraies de
  Léo), les photos, tout texte qui annoncerait un chiffre non mesuré.
- Le découpage en composants suit celui qui existe déjà
  (`src/screens/legion/parties/Immeuble.jsx`).
