-- Deux agents de plus, et d'abord ce qui existait deja.
--
-- Beau: « déploie tous les autres agents ». Avant d'en écrire un seul, j'ai
-- relu ce qui tourne — et deux des trois que je lui avais décrits existaient
-- déjà: `remind_empty_shops` (0046) relance les boutiques qui n'ont jamais
-- rien publié, `stale_orders` (0050) réveille les commandes qui dorment,
-- `report_unmet_demand` (0049) dit chaque lundi ce que les gens cherchent
-- sans le trouver. Les redéployer aurait fait deux messages pour un.
--
-- Restent deux vrais trous, tous les deux constatés cette semaine.

-- ---------------------------------------------------------------------------
-- 1) Les photos envoyées qui n'ont jamais donné un article.
--
-- Noir a envoyé 18 photos le 25/08 à 16h58 et sa boutique est restée vide.
-- Merveille, 0 fichier en 17 jours à cause d'un bug de navigateur. Personne
-- ne l'a su avant que Beau ne le signale — `remind_empty_shops` ne voit que
-- les boutiques SANS article, pas celles dont le travail s'est perdu entre
-- l'envoi de la photo et la création de la fiche.
--
-- C'est le moment précis où une vendeuse abandonne: elle a fait l'effort, et
-- elle ne voit rien.
alter table public.shops
  add column if not exists photos_orphelines_relance_at timestamptz;

comment on column public.shops.photos_orphelines_relance_at is
  'Dernière relance « tes photos t''attendent ». Une par semaine au plus.';

create or replace function public.relancer_photos_orphelines()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  b record;
  admin_id uuid;
begin
  select (value #>> '{}')::uuid into admin_id from public.app_config where key = 'admin_user_id';

  for b in
    select s.id, s.owner_id, s.name, count(*) as n, max(o.created_at) as derniere
      from storage.objects o
      join public.shops s on s.owner_id::text = split_part(o.name, '/', 1)
     where o.bucket_id = 'products'
       and o.name not like '%\_thumb%'
       -- Douze heures: le temps d'une session normale. En dessous, on
       -- relancerait quelqu'un encore en train de remplir sa fiche.
       and o.created_at < now() - interval '12 hours'
       -- Quatorze jours: au-dela, ce n'est plus du travail en cours mais du
       -- residu laisse par des fiches modifiees ou supprimees. Sans ce
       -- garde-fou, la relance annoncait « 1578 photo(s) t'attendent » a une
       -- boutique qui publie normalement: faux, et decourageant.
       and o.created_at > now() - interval '14 days'
       and s.status = 'active'
       and (s.photos_orphelines_relance_at is null
            or s.photos_orphelines_relance_at < now() - interval '7 days')
       and not exists (
         select 1 from public.products p
          where p.shop_id = s.id and o.name = any(p.images)
       )
     group by s.id, s.owner_id, s.name
     -- Et surtout: rien de publie DEPUIS. Une vendeuse qui a continue a
     -- travailler apres n'est pas bloquee, elle a juste ecarte ces photos-la.
     having not exists (
       select 1 from public.products p
        where p.shop_id = s.id and p.created_at > max(o.created_at)
     )
  loop
    if b.n > 200 then
      -- Trop pour etre un oubli: c'est un usage qui remplit le stockage
      -- (32 Mo le 04/08, 463 Mo le 25/08). Beau tranche — accompagner, ou
      -- faire le menage. On n'ecrit rien a la vendeuse: « 1538 photos
      -- t'attendent » est ingerable pour elle.
      if admin_id is not null then
        insert into public.notifications (user_id, type, title, body, data)
        values (
          admin_id,
          'photos_orphelines_admin',
          b.n || ' photos jamais publiées — ' || b.name,
          'Cette boutique a envoyé ' || b.n || ' photos en deux semaines sans les '
            || 'rattacher à un article. C''est du stockage consommé pour rien. '
            || 'À regarder avec elle avant de relancer.',
          jsonb_build_object('shop_id', b.id, 'count', b.n)
        );
      end if;
    else
      insert into public.notifications (user_id, type, title, body, data)
      values (
        b.owner_id,
        'photos_orphelines',
        b.n || ' photo(s) t''attendent',
        'Tu as envoyé ' || b.n || ' photo(s) qui ne sont rattachées à aucun article. '
          || 'Ouvre « Ajouter en masse »: elles sont là, en haut de l''écran. '
          || 'Il ne reste qu''un nom et un prix à mettre.',
        jsonb_build_object('count', b.n, 'route', '/vendor/products/bulk')
      );
    end if;
    update public.shops set photos_orphelines_relance_at = now() where id = b.id;
  end loop;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- 2) La revue du lundi: Finjaro regardé comme une cliente le regarde.
--
-- Beau: « ça remarque qu'il y a une catégorie qui n'est pas bien ». C'est
-- exactement ce qu'il a fait lui-même en ouvrant « Mode Femme » et en y
-- trouvant des casques de chantier — sauf que là, personne n'attend qu'il
-- tombe dessus.
--
-- Un seul message, et seulement s'il y a quelque chose à dire. Un rapport
-- qui arrive chaque lundi même quand tout va bien finit par ne plus être lu.
create or replace function public.revue_plateforme()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  admin_id uuid;
  rayons_vides int;
  boutiques_vides int;
  sans_logo int;
  sans_nom int;
  sans_photo int;
  corps text := '';
begin
  select (value #>> '{}')::uuid into admin_id from public.app_config where key = 'admin_user_id';
  if admin_id is null then return; end if;

  -- Un rayon sans rien dedans: la cliente qui l'ouvre tombe sur du vide et
  -- en conclut que Finjaro est vide.
  select count(*) into rayons_vides
    from public.categories c
   where c.kind = 'PRODUCT' and c.parent_id is null
     and not exists (
       select 1 from public.products p
        join public.categories e on e.id = p.category
        where p.is_active and coalesce(e.parent_id, p.category) = c.id
     );

  select count(*) into boutiques_vides
    from public.shops s
   where s.status = 'active'
     and not exists (select 1 from public.products p where p.shop_id = s.id and p.is_active);

  select count(*) into sans_logo
    from public.shops s
   where s.status = 'active' and (s.avatar_url is null or s.avatar_url = '');

  -- Un nom qui ne dit rien: « Baby 1 » à « Baby 63 ». La cliente qui cherche
  -- « robe » ne les trouvera jamais. Même règle que l'écran vendeuse.
  select count(*) into sans_nom from (
    select p.id
      from public.products p
     where p.is_active
       and (
         lower(regexp_replace(p.name, '[^[:alpha:] ]', '', 'g')) ~
           '^\s*(produit|article|photo|image|bebe|b[ée]b[ée]|baby|robe|ensemble|paire|lot|set|tenue|habit|truc|divers|autre)(s)?(\s+(de|du|des|la|le|les|un|une|et|pour|bebe|b[ée]b[ée]|enfant|femme|homme))*\s*$'
         -- Trois articles ou plus au meme nom une fois le numero retire:
         -- c'est la signature du nom commun d'« Appliquer a tous ».
         or (select count(*) from public.products q
              where q.shop_id = p.shop_id and q.is_active
                and lower(btrim(regexp_replace(q.name, '[0-9]+$', '')))
                  = lower(btrim(regexp_replace(p.name, '[0-9]+$', '')))) >= 3
       )
  ) t;

  select count(*) into sans_photo
    from public.products p
   where p.is_active and (p.images is null or cardinality(p.images) = 0);

  if rayons_vides  > 0 then corps := corps || rayons_vides  || ' rayon(s) sans aucun article. '; end if;
  if boutiques_vides > 0 then corps := corps || boutiques_vides || ' boutique(s) en ligne sans un seul article. '; end if;
  if sans_logo     > 0 then corps := corps || sans_logo     || ' boutique(s) sans logo. '; end if;
  if sans_nom      > 0 then corps := corps || sans_nom      || ' article(s) dont le nom ne dit rien à une cliente. '; end if;
  if sans_photo    > 0 then corps := corps || sans_photo    || ' article(s) en ligne sans photo. '; end if;

  if corps = '' then return; end if;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    admin_id,
    'revue_plateforme',
    'La revue du lundi',
    corps || 'Le détail est dans la console d''administration.',
    jsonb_build_object(
      'rayons_vides', rayons_vides, 'boutiques_vides', boutiques_vides,
      'sans_logo', sans_logo, 'sans_nom', sans_nom, 'sans_photo', sans_photo
    )
  );
end;
$fn$;

-- Les photos orphelines: une fois par jour suffit — la relance elle-même
-- n'est envoyée qu'une fois par semaine et par boutique.
select cron.schedule('finjaro-photos-orphelines', '0 7 * * *',
  $cron$select public.relancer_photos_orphelines();$cron$);

-- La revue: lundi matin, après le rapport de demande non satisfaite (8h).
select cron.schedule('finjaro-revue-plateforme', '30 8 * * 1',
  $cron$select public.revue_plateforme();$cron$);
