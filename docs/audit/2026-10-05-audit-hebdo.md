# Audit hebdomadaire — place de marché (05/10/2026)

Fait à la demande de Claudinette, en parallèle de son audit d'Accounting
(c41b394). Production en lecture seule ; aucune écriture en base de production.

## Base de production (bokwivwizghdlaedczbw)

- RLS active sur **142 tables sur 142** du schéma public ; 289 règles d'accès.
- 19 tables ont la RLS sans aucune règle : fermées à tous les clients, lues
  seulement par les fonctions serveur (app_config, app_secrets, journaux…).
  C'est voulu.
- Conseiller Supabase, côté sécurité :
  - 1 « ERROR » : la vue `profiles_public` est en SECURITY DEFINER. Déjà
    traitée (C-0a, 01/10) : l'écriture est fermée aux visiteurs, et la lecture
    des noms publics est voulue.
  - 36 fonctions SECURITY DEFINER exécutables sans compte. Toutes sont dans la
    liste blanche de 0229 : déclencheurs, contrôles d'appartenance, commande
    sans compte, suivi de commande. `legion_jeton_travail_valide` reste ouverte
    pour le Worker de l'atelier, déjà suivie sous m-6.
  - Protection contre les mots de passe compromis (HaveIBeenPwned) toujours
    désactivée : M-3, un interrupteur à actionner par Beau. Concerne aussi
    Accounting.
  - pg_net et pg_trgm installées dans `public` : connu, sans risque immédiat.
- Base de test (qiyvoaljqmbfldephobp) : `finia_members_guard` alignée ce
  matin sur la production. Empreinte identique (md5 sans commentaires). Le
  membre retiré ne peut plus se remettre « actif ».

## Code (branche staging)

- 373 tests sur 373, compilation sans erreur (05/10 02h36).

## Trouvé cette semaine

| Gravité | Constat | État |
| --- | --- | --- |
| 🔴 | Coût des agents passés par OpenAI jamais compté (ai_usage muet depuis le 03/10 08h47) : le plafond du mois est aveugle | Correctif dans docs/en-attente/cout-openai-agents.patch ; routine de passes supplémentaires en pause |
| 🔴 | 64 photos « AVIF » qui sont en réalité des PNG sans compression (jusqu'à 2,5 Mo) : première cause des pages produit « Poor » | Envoi corrigé sur staging (877b258) ; recompression des 64 photos sur le mot de Beau |
| 🟠 | legion-visuel et legion-portrait n'appellent que des modèles d'image arrêtés par Google | docs/en-attente/modeles-image-google.patch |
| 🟠 | Crédits prépayés Google épuisés (402) depuis le 03/10 | Recharge = Beau |
| 🟡 | Stockage à 58,7 % du gratuit, +40 Mo en 7 jours | ≈ 10 semaines de marge |
