-- LEGION — la messagerie vivante: temps réel, photos, vocaux, autonomie.
--
-- Beau, 22/09, avec quatre maquettes en pièce jointe: « voilà exactement ce
-- que je te demande de faire. Regarde le design, regarde les boutons,
-- regarde les couleurs, regarde les photos. Je ne veux plus le travail
-- bâclé. » Et: « je peux même pas envoyer des photos, je peux même pas
-- faire de voix ».
--
-- Trois manques mesurés côté base avant de refaire l'écran:
--   1. Les tables Legion n'étaient PAS dans la publication temps réel. Le
--      code s'abonnait, la base ne diffusait rien: une réponse d'agent
--      n'arrivait jamais sans recharger. C'est la première chose à réparer,
--      sinon « les agents répondent » ne se voit pas.
--   2. Aucun endroit où poser une photo ou un vocal.
--   3. Aucun niveau d'autonomie: la maquette en a trois, et c'est une bonne
--      idée — ce n'est pas « allumé / éteint », c'est « allumé jusqu'où ».
--
-- Additif: une publication étendue, une colonne, un rangement, des règles.

-- ---------------------------------------------------------------------------
-- 1. Temps réel
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'legion_messages') then
    alter publication supabase_realtime add table public.legion_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'legion_reactions') then
    alter publication supabase_realtime add table public.legion_reactions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'legion_agents') then
    alter publication supabase_realtime add table public.legion_agents;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Le niveau d'autonomie d'un agent
-- ---------------------------------------------------------------------------
-- supervise: il propose, Beau valide. semi: il agit sur ce qui ne coûte
-- rien et rend compte. autonome: il agit et prévient. L'interrupteur
-- (`actif`) reste au-dessus de tout ça: éteint, aucun niveau ne compte.
alter table public.legion_agents
  add column if not exists autonomie text not null default 'supervise';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'legion_agents_autonomie_check') then
    alter table public.legion_agents
      add constraint legion_agents_autonomie_check check (autonomie in ('supervise', 'semi', 'autonome'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Le rangement des photos et des vocaux
-- ---------------------------------------------------------------------------
-- Un fichier vit sous `<entreprise>/<uuid>.<ext>`. Le premier dossier est
-- l'entreprise: c'est lui qui décide qui peut déposer. Lecture publique par
-- adresse (l'adresse contient un identifiant impossible à deviner), comme
-- les photos de produits et le bucket « chat » de la place de marché.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('legion', 'legion', true, 10485760,
        array['image/jpeg','image/png','image/webp','image/gif','audio/webm','audio/mp4','audio/mpeg','audio/ogg','application/pdf'])
on conflict (id) do nothing;

drop policy if exists legion_depot_membres on storage.objects;
create policy legion_depot_membres on storage.objects for insert to authenticated
  with check (
    bucket_id = 'legion'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and public.legion_est_membre(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists legion_lecture_membres on storage.objects;
create policy legion_lecture_membres on storage.objects for select to authenticated
  using (
    bucket_id = 'legion'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and public.legion_est_membre(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- 4. Ce qu'un message peut porter, noté pour que tout le monde lise pareil
-- ---------------------------------------------------------------------------
-- `legion_messages.meta` (jsonb, existant) reçoit:
--   reponse_a : { id, nom, texte }       — la citation
--   pieces    : [{ type: 'image'|'audio'|'fichier', url, nom, duree }]
--   statut    : 'a_faire'|'en_cours'|'revue'|'fait'   (genre = tache)
--   priorite  : 'basse'|'moyenne'|'haute'|'critique'  (genre = tache)
--   depuis    : id du message dont la tâche est tirée
--   par_ia    : true quand c'est un agent qui a écrit, avec `modele`
comment on column public.legion_messages.meta is
  'reponse_a{id,nom,texte} · pieces[{type,url,nom,duree}] · statut · priorite · depuis · par_ia · modele';

create index if not exists legion_messages_entreprise_date_idx
  on public.legion_messages (entreprise_id, created_at desc);
