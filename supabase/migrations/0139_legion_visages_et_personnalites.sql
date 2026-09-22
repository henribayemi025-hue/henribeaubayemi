-- LEGION — de vrais visages, et une personnalité par agent.
--
-- Beau, 22/09, après avoir regardé l'écran:
--   « C'est avec l'API de quoi que tu as fait ça ? J'ai l'impression que tu
--     as fait une maquette. Les bitmoji ne sont pas les bitmoji comme sur
--     Snap. Je veux que ce soit ce genre de bitmoji, que chaque agent
--     choisisse lui-même, et que chaque agent ait une personnalité. »
--
-- Ce qu'il y avait: DiceBear, style « notionists », avec pour seul réglage
-- un numéro au hasard. Résultat mesuré: 21 agents, 21 têtes qui se
-- ressemblent, et ZÉRO personnalité (la colonne existait, elle était vide).
-- Il a raison de parler de maquette.
--
-- Ce que ça devient: chaque agent a une APPARENCE faite de traits explicites
-- — coiffure, peau, yeux, bouche, sourcils, vêtement, lunettes, barbe — dans
-- le style « avataaars », celui qui ressemble aux bitmoji de Snapchat. Et
-- certains ne sont pas des humains: un robot, une frimousse. Beau: « l'autre
-- peut mettre un nounours qui montre que c'est la météo ».
--
-- Honnêteté sur « choisi par eux-mêmes »: aucun agent ne tourne encore
-- (c'est la partie 3 du plan). Donc c'est la base qui compose ces traits,
-- de façon stable et variée. Ce qui change vraiment, c'est qu'ils sont
-- STOCKÉS et MODIFIABLES un par un: le jour où un agent réfléchit, il
-- appelle `legion_changer_visage` et se choisit sa tête sans que personne
-- ne repasse derrière. La place est faite, et elle est vraie.
--
-- Additif: une colonne, des fonctions, un remplissage. Rien n'est supprimé.

alter table public.legion_agents add column if not exists apparence jsonb;

-- ---------------------------------------------------------------------------
-- Un tirage stable: la même graine donne toujours le même résultat.
-- ---------------------------------------------------------------------------
-- 28 bits: toujours positif, donc pas de modulo négatif à rattraper.
create or replace function public.legion_pige(graine text, n integer)
returns integer language sql immutable as $$
  select (('x' || substr(md5(graine), 1, 7))::bit(28)::integer % greatest(n, 1)) + 1;
$$;

create or replace function public.legion_choix(graine text, choix text[])
returns text language sql immutable as $$
  select choix[public.legion_pige(graine, array_length(choix, 1))];
$$;

-- ---------------------------------------------------------------------------
-- L'apparence: des traits, pas un numéro.
-- ---------------------------------------------------------------------------
create or replace function public.legion_apparence_choisie(graine text, poste text)
returns jsonb language plpgsql immutable as $$
declare
  famille text;
  d integer;
begin
  -- Une personne sur douze n'est pas un humain. C'est voulu: une équipe où
  -- tout le monde a la même tête n'est pas une équipe.
  d := public.legion_pige(graine || 'famille', 12);
  if d = 1 then famille := 'bottts';          -- un robot
  elsif d = 2 then famille := 'fun-emoji';    -- une frimousse
  elsif d = 3 then famille := 'big-ears';     -- un personnage de dessin animé
  else famille := 'avataaars';                -- le style « bitmoji »
  end if;

  if famille <> 'avataaars' then
    return jsonb_build_object(
      'famille', famille,
      'fond', public.legion_choix(graine || 'fond',
        array['C25E38','2A9D8F','6366F1','E09F3E','8B5CF6','38BDF8','FB7185','34D399','F4A261','9B5DE5'])
    );
  end if;

  return jsonb_build_object(
    'famille', 'avataaars',
    'cheveux', public.legion_choix(graine || 'cheveux', array[
      'shortCurly','shortFlat','shortRound','shortWaved','theCaesar','theCaesarAndSidePart',
      'sides','dreads01','dreads02','frizzle','shaggy','shaggyMullet','bigHair','bob','bun',
      'curly','curvy','dreads','fro','froBand','longButNotTooLong','miaWallace','straight01',
      'straight02','straightAndStrand','shavedSides','hijab','turban','winterHat02','hat']),
    'couleurCheveux', public.legion_choix(graine || 'cc', array[
      '2c1b18','4a312c','724133','a55728','b58143','c93305','d6b370','e8e1e1','ecdcbf','f59797']),
    'peau', public.legion_choix(graine || 'peau', array[
      '614335','8d5524','ae5d29','c68642','d08b5b','e0ac69','edb98a','f1c27d','ffdbb4']),
    'yeux', public.legion_choix(graine || 'yeux', array[
      'default','happy','squint','wink','surprised','side','closed','hearts','eyeRoll','winkWacky']),
    'sourcils', public.legion_choix(graine || 'sourcils', array[
      'default','defaultNatural','flatNatural','raisedExcited','raisedExcitedNatural',
      'sadConcernedNatural','upDown','upDownNatural','angryNatural','frownNatural']),
    'bouche', public.legion_choix(graine || 'bouche', array[
      'default','smile','twinkle','serious','eating','tongue','disbelief','concerned','grimace']),
    'vetement', public.legion_choix(graine || 'vet', array[
      'blazerAndShirt','blazerAndSweater','collarAndSweater','graphicShirt','hoodie',
      'overall','shirtCrewNeck','shirtScoopNeck','shirtVNeck']),
    'couleurVetement', public.legion_choix(graine || 'cv', array[
      '262e33','3c4f5c','65c9ff','5199e4','25557c','929598','a7ffc4','b1e2ff','ff5c5c',
      'ff488e','ffafb9','ffffb1','e6e6e6','ff7a00','2a9d8f','c25e38']),
    -- Des lunettes une fois sur trois, une barbe une fois sur quatre: assez
    -- pour distinguer les gens, pas assez pour que tout le monde en porte.
    'lunettes', case when public.legion_pige(graine || 'lun', 3) = 1
      then public.legion_choix(graine || 'lun2',
        array['prescription01','prescription02','round','sunglasses','wayfarers','kurt'])
      else null end,
    'barbe', case when public.legion_pige(graine || 'barbe', 4) = 1
      then public.legion_choix(graine || 'barbe2',
        array['beardLight','beardMedium','beardMajestic','moustacheFancy','moustacheMagnum'])
      else null end,
    'fond', public.legion_choix(graine || 'fond', array[
      'ffe9e0','e6f4f1','ece9fb','fdf3e0','f3eaff','e3f4fd','ffe9ef','e6f8f0','f7f2ea'])
  );
end;
$$;

-- L'adresse de l'image, construite à partir des traits. Si un jour on change
-- de fournisseur d'images, c'est la seule fonction à reprendre.
create or replace function public.legion_visage_url(apparence jsonb, graine text)
returns text language sql immutable as $$
  select case coalesce(apparence->>'famille', 'avataaars')
    when 'avataaars' then
      'https://api.dicebear.com/9.x/avataaars/svg?seed=' || graine
      || '&top=' || coalesce(apparence->>'cheveux', 'shortFlat')
      || '&hairColor=' || coalesce(apparence->>'couleurCheveux', '2c1b18')
      || '&skinColor=' || coalesce(apparence->>'peau', 'edb98a')
      || '&eyes=' || coalesce(apparence->>'yeux', 'default')
      || '&eyebrows=' || coalesce(apparence->>'sourcils', 'default')
      || '&mouth=' || coalesce(apparence->>'bouche', 'smile')
      || '&clothing=' || coalesce(apparence->>'vetement', 'shirtCrewNeck')
      || '&clothesColor=' || coalesce(apparence->>'couleurVetement', '3c4f5c')
      || case when apparence->>'lunettes' is not null
              then '&accessories=' || (apparence->>'lunettes') || '&accessoriesProbability=100'
              else '&accessoriesProbability=0' end
      || case when apparence->>'barbe' is not null
              then '&facialHair=' || (apparence->>'barbe') || '&facialHairProbability=100'
              else '&facialHairProbability=0' end
      || '&backgroundColor=' || coalesce(apparence->>'fond', 'ffe9e0')
    else
      'https://api.dicebear.com/9.x/' || (apparence->>'famille') || '/svg?seed=' || graine
      || '&backgroundColor=' || coalesce(apparence->>'fond', 'ffe9e0')
  end;
$$;

-- ---------------------------------------------------------------------------
-- La personnalité: comment il parle, ce qui l'agace, sa manie.
-- ---------------------------------------------------------------------------
-- Pas une biographie. Trois traits courts, qui doivent s'ENTENDRE quand
-- l'agent écrit. Beau veut reconnaître quelqu'un sans lire son nom.
create or replace function public.legion_personnalite_de(graine text, poste text)
returns text language sql immutable as $$
  select public.legion_choix(graine || 'car', array[
    'Direct, parfois trop',
    'Calme, difficile à faire sortir de ses gonds',
    'Enthousiaste, il faut le freiner',
    'Méfiant par métier',
    'Méthodique jusqu''à la lenteur',
    'Impatient, veut voir tourner',
    'Chaleureux, connaît le prénom de tout le monde',
    'Sec, mais toujours juste',
    'Curieux de tout, se disperse',
    'Têtu quand il a raison',
    'Discret, parle peu et bien',
    'Rieur, détend les réunions tendues',
    'Perfectionniste, rend en retard',
    'Pragmatique, déteste les grands mots',
    'Anxieux, donc il vérifie deux fois',
    'Sûr de lui, à vérifier'])
  || '. ' ||
  public.legion_choix(graine || 'parle', array[
    'Écrit court, trois phrases maximum',
    'Commence toujours par le chiffre',
    'Pose une question avant de répondre',
    'Parle comme on parle, sans jargon',
    'Cite sa source à chaque fois',
    'Annonce d''abord ce qui ne va pas',
    'Fait des listes, jamais de paragraphes',
    'Donne une option, jamais trois',
    'Reformule ce qu''on lui dit avant de répondre',
    'Répond par un exemple concret',
    'Écrit long quand c''est important, court sinon',
    'Prévient quand il n''est pas sûr'])
  || '. ' ||
  public.legion_choix(graine || 'manie', array[
    'Ne lâche jamais un dossier commencé',
    'Relit tout à voix haute avant d''envoyer',
    'Déteste les réunions sans ordre du jour',
    'Répond en moins d''une heure ou dit pourquoi',
    'Garde une note de chaque décision',
    'Refuse de travailler sur deux choses à la fois',
    'Demande toujours « et si on ne le faisait pas ? »',
    'Finit ses messages par ce qu''il attend de l''autre',
    'Ne promet une date que s''il peut la tenir',
    'Va voir les vrais chiffres avant de donner un avis',
    'S''excuse quand il se trompe, et dit en quoi',
    'Défend son équipe en public, la corrige en privé'])
  || '.';
$$;

-- ---------------------------------------------------------------------------
-- On remplit tout le monde: les 21 agents existants, et ceux d'après.
-- ---------------------------------------------------------------------------
-- La graine mêle l'identifiant de l'agent et son poste: deux « traders » de
-- la même entreprise n'ont pas la même tête.
update public.legion_agents a
   set apparence = public.legion_apparence_choisie(a.id::text || a.poste, a.poste),
       personnalite = coalesce(a.personnalite, public.legion_personnalite_de(a.id::text || a.poste, a.poste))
 where a.user_id is null;

update public.legion_agents a
   set avatar_url = public.legion_visage_url(a.apparence, a.id::text)
 where a.user_id is null and a.apparence is not null;

-- ---------------------------------------------------------------------------
-- Un agent change sa tête lui-même
-- ---------------------------------------------------------------------------
-- Aujourd'hui c'est Beau qui s'en sert depuis l'écran. Demain c'est l'agent,
-- quand il tournera: la fonction est la même, l'appelant change.
create or replace function public.legion_changer_visage(
  p_agent uuid, p_apparence jsonb, p_personnalite text default null
) returns text language plpgsql security definer set search_path = public as $$
declare eid uuid; v_url text;
begin
  select entreprise_id into eid from public.legion_agents where id = p_agent;
  if eid is null then raise exception 'Agent inconnu.'; end if;
  if not public.legion_est_membre(eid) then raise exception 'Pas membre de cette entreprise.'; end if;

  v_url := public.legion_visage_url(p_apparence, p_agent::text);
  update public.legion_agents
     set apparence = p_apparence,
         avatar_url = v_url,
         personnalite = coalesce(nullif(btrim(p_personnalite), ''), personnalite)
   where id = p_agent;
  return v_url;
end;
$$;

revoke execute on function public.legion_changer_visage(uuid, jsonb, text) from public;
revoke execute on function public.legion_changer_visage(uuid, jsonb, text) from anon;
grant execute on function public.legion_changer_visage(uuid, jsonb, text) to authenticated;

-- Un visage au hasard, pour le bouton « une autre tête ».
create or replace function public.legion_visage_au_hasard(p_agent uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare eid uuid; v_poste text; v_app jsonb;
begin
  select entreprise_id, poste into eid, v_poste from public.legion_agents where id = p_agent;
  if eid is null then raise exception 'Agent inconnu.'; end if;
  if not public.legion_est_membre(eid) then raise exception 'Pas membre de cette entreprise.'; end if;
  v_app := public.legion_apparence_choisie(p_agent::text || clock_timestamp()::text, v_poste);
  perform public.legion_changer_visage(p_agent, v_app, null);
  return v_app;
end;
$$;

revoke execute on function public.legion_visage_au_hasard(uuid) from public;
revoke execute on function public.legion_visage_au_hasard(uuid) from anon;
grant execute on function public.legion_visage_au_hasard(uuid) to authenticated;
