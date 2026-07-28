-- Finjaro — répare les images des articles de démonstration.
--
-- PROBLÈME
-- 94 des 114 articles actifs (82 % du catalogue) et les 8 reels référençaient
-- leurs médias en ABSOLU sur `https://finjaro.finjaro.workers.dev`, l'ancienne
-- URL Cloudflare utilisée pendant la migration depuis Netlify. Ce domaine ne
-- résout plus du tout. Le navigateur tentait donc de charger chaque image vers
-- un hôte inexistant, attendait l'échec DNS, puis affichait un cadre vide.
--
-- C'est ce qui donnait l'impression d'un site « lent »: ce n'était pas de la
-- lenteur de base (la requête catégorie s'exécute en 6 ms) ni un poids d'image,
-- mais des dizaines d'attentes réseau vouées à échouer, en parallèle, à chaque
-- écran.
--
-- CORRECTIF
-- Repointer vers des chemins RELATIFS au site. Les 102 fichiers concernés sont
-- livrés avec l'application (public/demo-products, public/demo-reels) — chacun
-- a été vérifié présent avant d'écrire ici. En relatif, ils suivent le site où
-- qu'il soit hébergé, ce qui évite exactement ce type de panne au prochain
-- changement d'hébergeur ou de domaine.
--
-- Côté application, storageUrl()/storageThumbUrl() laissent désormais passer
-- tel quel un chemin commençant par « / » (voir src/lib/supabase.js).

update public.products
set images = (
  select array_agg(replace(x, 'https://finjaro.finjaro.workers.dev', '') order by ord)
  from unnest(images) with ordinality as t(x, ord)
)
where exists (
  select 1 from unnest(images) x where x like 'https://finjaro.finjaro.workers.dev/%'
);

update public.reels
set video_url = replace(video_url, 'https://finjaro.finjaro.workers.dev', '')
where video_url like 'https://finjaro.finjaro.workers.dev/%';

-- Mêmes colonnes ailleurs: aucune ligne concernée au moment de la migration
-- (vérifié), mais on couvre le cas pour qu'une réexécution reste correcte.
update public.shops
set avatar_url = replace(avatar_url, 'https://finjaro.finjaro.workers.dev', '')
where avatar_url like 'https://finjaro.finjaro.workers.dev/%';

update public.shops
set banner_url = replace(banner_url, 'https://finjaro.finjaro.workers.dev', '')
where banner_url like 'https://finjaro.finjaro.workers.dev/%';

update public.near_you_listings
set photo_url = replace(photo_url, 'https://finjaro.finjaro.workers.dev', '')
where photo_url like 'https://finjaro.finjaro.workers.dev/%';
