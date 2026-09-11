# Ouvrir un accès analyste en lecture seule

À quoi ça sert : brancher Power BI (ou n'importe quel outil d'analyse) sur la base
Finjaro **sans pouvoir rien casser**. Le rôle créé ici peut lire, et rien d'autre.

> **À exécuter par Beau uniquement**, dans Supabase → SQL Editor.
> Rien ne s'applique automatiquement : aucun workflow GitHub ne joue les migrations.

## Pourquoi c'est prudent, et pas facultatif

Le projet Supabase `bokwivwizghdlaedczbw` est **partagé avec deux ou trois
applications tierces** qui utilisent le même `auth.users`. Un compte capable
d'écrire, remis à un outil externe, met en jeu bien plus que Finjaro.

D'où trois garde-fous dans le script ci-dessous :

1. le rôle ne reçoit que `SELECT`, jamais `INSERT` / `UPDATE` / `DELETE` ;
2. il ne voit que le schéma `public` : ni `auth`, ni `storage`, ni les
   schémas internes de Supabase ;
3. les tables sensibles sont explicitement retirées (voir la dernière étape).

## 1. Choisir un mot de passe

Remplace `METTRE_UN_MOT_DE_PASSE_ICI` par un mot de passe long, généré au hasard,
qui ne sert **que** pour cet accès. Ne le réutilise nulle part ailleurs.

Transmets-le par un canal différent du lien de connexion : le mot de passe d'un
côté, l'hôte et le nom d'utilisateur de l'autre.

## 2. Le script

```sql
-- Rôle de lecture pour l'analyse (Power BI, requêtes ad hoc).
-- Ne peut que LIRE, et seulement le schéma public.
create role analyste_lecture with login password 'METTRE_UN_MOT_DE_PASSE_ICI';

-- Se connecter à la base, voir le schéma public.
grant connect on database postgres to analyste_lecture;
grant usage on schema public to analyste_lecture;

-- Lire les tables et les vues existantes.
grant select on all tables in schema public to analyste_lecture;
grant select on all sequences in schema public to analyste_lecture;

-- Et celles créées plus tard, sans avoir à repasser ici.
alter default privileges in schema public
  grant select on tables to analyste_lecture;

-- Ceinture et bretelles: aucune écriture, nulle part.
revoke insert, update, delete, truncate on all tables in schema public
  from analyste_lecture;
```

## 3. Retirer ce qui n'a pas à être lu

Les pièces d'identité et les abonnements aux notifications ne servent à aucune
analyse. On les retire nommément.

```sql
revoke all on table public.push_subscriptions from analyste_lecture;
```

Ajoute une ligne par table que tu ne veux pas exposer. Pour voir ce que le rôle
peut lire aujourd'hui :

```sql
select table_name
from information_schema.role_table_grants
where grantee = 'analyste_lecture' and privilege_type = 'SELECT'
order by table_name;
```

## 4. Vérifier que l'écriture est bien refusée

À lancer juste après. La première requête doit renvoyer des lignes,
la seconde doit **échouer**. Si la seconde réussit, ne transmets pas l'accès.

```sql
set local role analyste_lecture;
select count(*) from public.products;          -- doit marcher
insert into public.products (name) values ('x'); -- doit être refusé
```

## 5. Ce qu'on transmet à l'analyste

Dans Supabase → **Project Settings → Database → Connection string**,
onglet **Session pooler** (et pas la connexion directe : le pooler répond en
IPv4, ce dont Power BI Desktop a besoin).

De cette chaîne on tire :

| Champ | Où le lire |
| --- | --- |
| Serveur | l'hôte de la chaîne du pooler |
| Port | celui de la chaîne du pooler |
| Base | `postgres` |
| Utilisateur | `analyste_lecture` |
| Mot de passe | celui choisi à l'étape 1 |
| Chiffrement | activé |

Dans Power BI : **Obtenir les données → Base de données PostgreSQL**, mode
**Import** (pas DirectQuery — le volume est minuscule et l'import évite de taper
sur la base de production à chaque clic).

## Si l'accès doit être coupé

```sql
drop owned by analyste_lecture;
drop role analyste_lecture;
```

Ces deux lignes ne touchent aucune donnée : elles ne suppriment que les droits
du rôle, puis le rôle lui-même.
