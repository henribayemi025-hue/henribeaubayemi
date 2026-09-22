import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconLayoutKanban, IconMessages, IconUsers, IconChecklist, IconSparkles, IconPower, IconCamera, IconHome } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useFondLegion } from './parties/useFondLegion';
import { useEcranVisible } from './parties/useEcranVisible';
import { useAuth } from '../../hooks/useAuth';
import { IconLogout } from '@tabler/icons-react';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Skeleton, ErrorState } from '../../components/states';
import { Rail, RailPastilles } from './parties/Rail';
import { ColonneSalons } from './parties/ColonneSalons';
import { Conversation } from './parties/Conversation';
import { Kanban } from './parties/Kanban';
import { FicheAgent } from './parties/FicheAgent';
import { Accueil } from './parties/Accueil';
import { Interrupteur } from './parties/Interrupteur';
import { Visage } from './parties/Visage';
import { couleurDept, clePrivee, sansAccent } from './parties/outils';

// LEGION — l'entreprise, sur le téléphone et sur l'ordinateur de celui qui
// l'a fondée.
//
// Beau, 22/09, quatre maquettes en main: « voilà exactement ce que je te
// demande de faire — regarde le design, les boutons, les couleurs, les
// photos, comment c'est bien écrit. Je ne veux plus le travail bâclé. »
//
// L'écran est celui de ses maquettes: à gauche le rail des départements,
// puis la colonne des salons et des agents avec leur interrupteur, au
// centre la conversation façon WhatsApp Web, à droite le tableau des tâches.
// Sur téléphone, les quatre s'empilent derrière quatre onglets.
//
// Et surtout: quand quelqu'un écrit, UN agent répond — l'agent en face
// dans un message privé, celui qu'on a nommé avec @, sinon le directeur du
// département. C'est `legion-repondre` qui le fait tourner; ici on ne fait
// que montrer « Untel écrit… » et attendre que le temps réel apporte sa
// réponse. Un agent éteint ne répond pas, et ça se dit.

const MAX_MESSAGES = 500;

export default function Entreprise() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, signOut } = useAuth();
  useFondLegion();
  useEcranVisible();
  const toast = useToast();
  const { id: entrepriseId } = useParams();
  const [params, setParams] = useSearchParams();
  const canalDemande = params.get('canal');

  const [deptId, setDeptId] = useState(null);
  // La tour de contrôle est ce qu'on voit en arrivant — la maquette de Beau.
  const [vue, setVue] = useState('accueil'); // 'accueil' | 'salons' | 'chat' | 'equipe' | 'taches'
  const [kanban, setKanban] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1280);
  const [fiche, setFiche] = useState(null);
  const [tape, setTape] = useState(null);
  const [brouillon, setBrouillon] = useState('');
  const [photos, setPhotos] = useState(false);

  const { data, loading, error, retry, setData } = useAsync(async () => {
    if (!user?.id || !entrepriseId) return null;
    const { data: entreprise, error: e0 } = await supabase
      .from('legion_entreprises').select('*').eq('id', entrepriseId).maybeSingle();
    if (e0) throw e0;
    if (!entreprise) return { refuse: true };
    const [agents, salons, messages] = await Promise.all([
      supabase.from('legion_agents').select('*').eq('entreprise_id', entrepriseId).order('ordre'),
      supabase.from('legion_canaux').select('*').eq('entreprise_id', entrepriseId).order('ordre'),
      supabase.from('legion_messages').select('*').eq('entreprise_id', entrepriseId).order('created_at', { ascending: false }).limit(MAX_MESSAGES),
    ]);
    if (agents.error) throw agents.error;
    if (messages.error) throw messages.error;
    const liste = (messages.data || []).reverse();
    const ids = liste.map((m) => m.id);
    const { data: reactions } = ids.length
      ? await supabase.from('legion_reactions').select('*').in('message_id', ids.slice(-300))
      : { data: [] };
    return { entreprise, agents: agents.data || [], salons: salons.data || [], messages: liste, reactions: reactions || [] };
  }, [user?.id, entrepriseId], { cacheKey: `legion:v2:${entrepriseId}` });

  // Le temps réel: les messages, les réactions, les agents (leur interrupteur
  // peut être basculé depuis un autre appareil).
  useEffect(() => {
    if (!entrepriseId || !user?.id) return undefined;
    const abo = supabase
      .channel(`legion:${entrepriseId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'legion_messages', filter: `entreprise_id=eq.${entrepriseId}` },
        (c) => setData((d) => (d && !d.messages.some((m) => m.id === c.new.id) ? { ...d, messages: [...d.messages, c.new] } : d)))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'legion_messages', filter: `entreprise_id=eq.${entrepriseId}` },
        (c) => setData((d) => (d ? { ...d, messages: d.messages.map((m) => (m.id === c.new.id ? { ...m, ...c.new } : m)) } : d)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'legion_reactions' },
        (c) => setData((d) => (d && d.messages.some((m) => m.id === c.new.message_id) && !d.reactions.some((r) => r.message_id === c.new.message_id && r.auteur_id === c.new.auteur_id && r.emoji === c.new.emoji)
          ? { ...d, reactions: [...d.reactions, c.new] } : d)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'legion_reactions' },
        (c) => setData((d) => (d ? { ...d, reactions: d.reactions.filter((r) => !(r.message_id === c.old.message_id && r.auteur_id === c.old.auteur_id && r.emoji === c.old.emoji)) } : d)))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'legion_agents', filter: `entreprise_id=eq.${entrepriseId}` },
        (c) => setData((d) => (d ? { ...d, agents: d.agents.map((a) => (a.id === c.new.id ? { ...a, ...c.new } : a)) } : d)))
      .subscribe();
    return () => { supabase.removeChannel(abo); };
  }, [entrepriseId, user?.id, setData]);

  const departements = useMemo(() => (data?.salons || []).filter((s) => !s.prive_entre?.length).map((s, i) => ({ ...s, couleur: couleurDept(i) })), [data?.salons]);
  const prives = useMemo(() => (data?.salons || []).filter((s) => s.prive_entre?.length), [data?.salons]);
  const salonId = canalDemande || departements[0]?.id || null;
  const salon = useMemo(() => departements.find((s) => s.id === salonId) || prives.find((s) => s.id === salonId) || null, [departements, prives, salonId]);
  const dept = departements.find((d) => d.id === deptId) || null;
  const moi = data?.agents.find((a) => a.user_id === user?.id) || null;
  const agentPrive = useMemo(() => (salon?.prive_entre?.length ? data?.agents.find((a) => salon.prive_entre.includes(a.cle) && a.cle !== moi?.cle) || null : null), [salon, data?.agents, moi]);
  const messagesDuSalon = useMemo(() => (data?.messages || []).filter((m) => m.canal_id === salonId), [data?.messages, salonId]);
  const taches = useMemo(() => (data?.messages || []).filter((m) => m.genre === 'tache'), [data?.messages]);
  const machines = useMemo(() => (data?.agents || []).filter((a) => !a.user_id), [data?.agents]);
  const allumes = machines.filter((a) => a.actif).length;
  // Claude (moteur « claude-code ») ne se fait pas faire de visage par Gemini.
  const aChoisir = machines.filter((a) => !a.choisi_par_lui && a.moteur !== 'claude-code').length;
  const sansPhoto = machines.filter((a) => a.apparence?.famille !== 'photo' && a.moteur !== 'claude-code').length;

  const choisirSalon = useCallback((id) => { setParams({ canal: id }); setVue('chat'); setTape(null); }, [setParams]);
  const entrer = useCallback((ou) => setVue(ou || 'chat'), []);
  const choisirDept = useCallback((id) => { setDeptId(id); if (id) choisirSalon(id); }, [choisirSalon]);

  const ecrireA = useCallback(async (autre) => {
    if (!moi || !data) return;
    const cle = clePrivee(moi.cle, autre.cle);
    let s = data.salons.find((x) => x.cle === cle);
    if (!s) {
      const { data: cree, error: err } = await supabase.from('legion_canaux').insert({
        entreprise_id: entrepriseId, cle, nom: autre.nom, a_quoi_ca_sert: `Conversation privée avec ${autre.nom}`,
        emoji: autre.emoji || '💬', ordre: 900, prive_entre: [moi.cle, autre.cle].sort(),
      }).select().single();
      if (err) { toast.error(err.message); return; }
      s = cree;
      setData((d) => (d ? { ...d, salons: [...d.salons, cree] } : d));
    }
    choisirSalon(s.id);
  }, [moi, data, entrepriseId, toast, setData, choisirSalon]);

  // Qui va répondre — la même règle que le serveur, pour afficher « écrit… »
  // tout de suite au lieu d'attendre la fin de sa réflexion.
  function quiRepond(texte, meta) {
    if (agentPrive) return agentPrive;
    // On répond à un message précis: c'est son auteur qui répond.
    const cite = meta?.reponse_a?.id && (data?.messages || []).find((m) => m.id === meta.reponse_a.id);
    const auteurCite = cite && machines.find((a) => a.id === cite.auteur_id);
    if (auteurCite) return auteurCite;
    const tx = sansAccent(texte);
    const nomme = machines.find((a) => tx.includes('@' + sansAccent(a.nom)));
    if (nomme) return nomme;
    const nomSalon = sansAccent(salon?.nom);
    const duDept = machines.filter((a) => sansAccent(a.departement) === nomSalon || (salon?.membres || []).includes(a.cle));
    return duDept.find((a) => a.est_directeur && a.actif) || duDept.find((a) => a.actif) || duDept[0]
      || machines.find((a) => a.est_directeur && a.actif) || machines.find((a) => a.est_directeur) || machines.find((a) => a.actif) || null;
  }

  async function envoyer({ texte, genre, meta }, canalForce) {
    const canal = canalForce || salonId;
    if (!moi || !canal) return;
    const { data: ligne, error: err } = await supabase.from('legion_messages')
      .insert({ entreprise_id: entrepriseId, canal_id: canal, auteur_id: moi.id, user_id: user.id, texte, genre, meta: meta && Object.keys(meta).length ? meta : null })
      .select().single();
    if (err) { toast.error(err.message || t('errors.generic')); throw err; }
    setData((d) => (d && !d.messages.some((m) => m.id === ligne.id) ? { ...d, messages: [...d.messages, ligne] } : d));
    if (genre === 'tache') return;

    const cible = quiRepond(texte, meta);
    if (!cible) return;
    // Claude ne répond pas sur le coup: il lit Legion à ses passages.
    if (cible.moteur === 'claude-code') {
      toast.info(t('legion.claudeRepondra', { nom: cible.nom }));
      return;
    }
    if (!cible.actif) { toast.info(t('legion.ilDort', { nom: cible.nom })); return; }
    setTape(cible);
    try {
      const { data: r, error: e2 } = await supabase.functions.invoke('legion-repondre', { body: { message_id: ligne.id } });
      if (e2) throw e2;
      if (r?.attend) toast.info(t('legion.claudeRepondra', { nom: r.attend.nom }));
      else if (r?.dort) toast.error(t('legion.ilDort', { nom: r.dort.nom }));
      else if (r?.erreur) toast.error(t('legion.personneNaPuRepondre', { raison: r.erreur }));
      // Plusieurs peuvent répondre à un « salut à tous »: le temps réel les
      // apporte aussi, on dédoublonne par identifiant.
      const arrives = (r?.messages || []).filter(Boolean);
      if (arrives.length) setData((d) => (d ? { ...d, messages: [...d.messages, ...arrives.filter((x) => !d.messages.some((m) => m.id === x.id))] } : d));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setTape(null); }
  }

  // Une directive depuis l'accueil: c'est un message « à trancher » posé
  // dans le salon visé, et l'agent du département répond comme d'habitude.
  async function directive(texte, canalId) {
    setParams({ canal: canalId });
    setVue('chat');
    await envoyer({ texte, genre: 'decision' }, canalId);
  }

  async function reagir(id, emoji) {
    if (!moi || !data) return;
    const deja = data.reactions.some((r) => r.message_id === id && r.auteur_id === moi.id && r.emoji === emoji);
    try {
      if (deja) {
        await supabase.from('legion_reactions').delete().eq('message_id', id).eq('auteur_id', moi.id).eq('emoji', emoji);
        setData((d) => d && ({ ...d, reactions: d.reactions.filter((r) => !(r.message_id === id && r.auteur_id === moi.id && r.emoji === emoji)) }));
      } else {
        await supabase.from('legion_reactions').insert({ message_id: id, auteur_id: moi.id, emoji });
        setData((d) => d && (d.reactions.some((r) => r.message_id === id && r.auteur_id === moi.id && r.emoji === emoji) ? d : { ...d, reactions: [...d.reactions, { message_id: id, auteur_id: moi.id, emoji }] }));
      }
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }

  async function majMessage(id, champs) {
    const { error: err } = await supabase.from('legion_messages').update(champs).eq('id', id);
    if (err) { toast.error(err.message); return; }
    setData((d) => d && ({ ...d, messages: d.messages.map((m) => (m.id === id ? { ...m, ...champs } : m)) }));
  }

  async function tacheDepuis(m) {
    if (!moi) return;
    const auteur = data.agents.find((a) => a.id === m.auteur_id);
    const { data: ligne, error: err } = await supabase.from('legion_messages').insert({
      entreprise_id: entrepriseId, canal_id: m.canal_id, auteur_id: moi.id, user_id: user.id,
      texte: m.texte.slice(0, 200), genre: 'tache', assigne_a: auteur && !auteur.user_id ? auteur.id : null,
      meta: { statut: 'a_faire', priorite: 'haute', depuis: m.id },
    }).select().single();
    if (err) { toast.error(err.message); return; }
    setData((d) => (d && !d.messages.some((x) => x.id === ligne.id) ? { ...d, messages: [...d.messages, ligne] } : d));
    if (window.innerWidth >= 1024) setKanban(true); else setVue('taches');
  }

  async function creerTache({ texte, assigne_a, priorite }) {
    if (!moi) return;
    const canal = salonId || departements[0]?.id;
    const { data: ligne, error: err } = await supabase.from('legion_messages').insert({
      entreprise_id: entrepriseId, canal_id: canal, auteur_id: moi.id, user_id: user.id, texte, genre: 'tache', assigne_a,
      meta: { statut: 'a_faire', priorite },
    }).select().single();
    if (err) { toast.error(err.message); return; }
    setData((d) => (d && !d.messages.some((x) => x.id === ligne.id) ? { ...d, messages: [...d.messages, ligne] } : d));
  }

  function statutTache(x, statut) {
    majMessage(x.id, { meta: { ...(x.meta || {}), statut }, termine_le: statut === 'fait' ? new Date().toISOString() : null });
  }

  async function convoquer(x, a) {
    await ecrireA(a);
    setBrouillon(t('legion.ouEnEsTu', { nom: a.nom, tache: x.texte }));
    setVue('chat');
  }

  async function allumer(a, actif) {
    try {
      const { error: err } = await supabase.rpc('legion_activer_agent', { p_agent: a.id, p_actif: actif });
      if (err) throw err;
      setData((d) => d && ({ ...d, agents: d.agents.map((x) => (x.id === a.id ? { ...x, actif } : x)) }));
      if (fiche?.id === a.id) setFiche((f) => ({ ...f, actif }));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }
  async function allumerTous(actif) {
    try {
      const { error: err } = await supabase.rpc('legion_activer_tous', { p_entreprise: entrepriseId, p_actif: actif });
      if (err) throw err;
      setData((d) => d && ({ ...d, agents: d.agents.map((x) => (x.user_id ? x : { ...x, actif })) }));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }
  async function autonomie(a, niveau) {
    const { error: err } = await supabase.from('legion_agents').update({ autonomie: niveau }).eq('id', a.id);
    if (err) { toast.error(err.message); return; }
    setData((d) => d && ({ ...d, agents: d.agents.map((x) => (x.id === a.id ? { ...x, autonomie: niveau } : x)) }));
    setFiche((f) => (f && f.id === a.id ? { ...f, autonomie: niveau } : f));
  }
  async function autreTete(a) {
    try {
      const { error: err } = await supabase.rpc('legion_visage_au_hasard', { p_agent: a.id });
      if (err) throw err;
      const { data: frais } = await supabase.from('legion_agents').select('id, apparence, avatar_url, choisi_par_lui').eq('id', a.id).single();
      if (frais) {
        setData((d) => d && ({ ...d, agents: d.agents.map((x) => (x.id === a.id ? { ...x, ...frais } : x)) }));
        setFiche((f) => (f && f.id === a.id ? { ...f, ...frais } : f));
      }
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }
  // Une VRAIE photo, fabriquée à partir du visage que l'agent décrit
  // lui-même. Beau: « chacun est libre de choisir la photo qu'il veut ».
  // Ce bouton-là DÉPENSE: fabriquer une image se paie, contrairement au
  // dessin. D'où un bouton séparé, qui le dit, et une photo par agent.
  async function vraiesPhotos(agent) {
    // Par paquets de trois: fabriquer vingt images d'un coup dépassait le
    // temps accordé à la fonction, et Beau voyait « Edge Function returned a
    // non-2xx status code » alors que les photos, elles, se faisaient.
    setPhotos(true);
    let total = 0;
    try {
      for (let tour = 0; tour < 12; tour += 1) {
        const { data: r, error: err } = await supabase.functions.invoke('legion-portrait', {
          body: { entreprise_id: entrepriseId, ...(agent ? { agent_id: agent.id } : { limite: 3 }) },
        });
        if (err) throw err;
        if (r?.erreur) throw new Error(r.erreur);
        total += r?.faits ?? 0;
        const { data: frais } = await supabase.from('legion_agents').select('*').eq('entreprise_id', entrepriseId).order('ordre');
        if (frais) {
          setData((d) => d && ({ ...d, agents: frais }));
          setFiche((f) => (f ? frais.find((x) => x.id === f.id) || f : f));
        }
        if ((r?.faits ?? 0) === 0 && r?.pourquoi) { toast.error(r.pourquoi); break; }
        if (agent || !r?.restants) {
          toast.success(t('legion.photosFaites', { faits: total, restants: r?.restants ?? 0 }));
          break;
        }
      }
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setPhotos(false); }
  }

  // Les photos que Beau pose lui-même (22/09: « une photo pour la
  // Direction, et moi aussi je dois pouvoir mettre une photo »). Le fichier
  // va dans le rangement `legion`, sous le dossier de l'entreprise.
  async function televerser(fichier, dossier) {
    if (fichier.size > 10 * 1024 * 1024) throw new Error(t('legion.tropLourd', 'Trop lourd: 10 Mo au plus.'));
    const ext = (fichier.name.split('.').pop() || 'jpg').toLowerCase();
    const chemin = `${entrepriseId}/${dossier}/${crypto.randomUUID()}.${ext}`;
    const { error: e } = await supabase.storage.from('legion').upload(chemin, fichier, { contentType: fichier.type || 'image/jpeg' });
    if (e) throw e;
    return supabase.storage.from('legion').getPublicUrl(chemin).data.publicUrl;
  }
  async function photoSalon(s, fichier) {
    try {
      const url = await televerser(fichier, 'salons');
      const { error: e } = await supabase.from('legion_canaux').update({ image_url: url }).eq('id', s.id);
      if (e) throw e;
      setData((d) => (d ? { ...d, salons: d.salons.map((x) => (x.id === s.id ? { ...x, image_url: url } : x)) } : d));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }
  async function membresSalon(s, membres) {
    const avant = s.membres || [];
    setData((d) => (d ? { ...d, salons: d.salons.map((x) => (x.id === s.id ? { ...x, membres } : x)) } : d));
    const { error: e } = await supabase.from('legion_canaux').update({ membres }).eq('id', s.id);
    if (e) {
      toast.error(e.message || t('errors.generic'));
      setData((d) => (d ? { ...d, salons: d.salons.map((x) => (x.id === s.id ? { ...x, membres: avant } : x)) } : d));
    }
  }
  async function maPhoto(fichier) {
    if (!moi) return;
    try {
      const url = await televerser(fichier, 'membres');
      const { error: e } = await supabase.from('legion_agents').update({ avatar_url: url }).eq('id', moi.id);
      if (e) throw e;
      setData((d) => (d ? { ...d, agents: d.agents.map((x) => (x.id === moi.id ? { ...x, avatar_url: url } : x)) } : d));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }

  if (authLoading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (!user) return <Navigate to="/auth" state={{ from: `/legion/${entrepriseId}` }} replace />;
  if (loading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (error) return <ErrorState onRetry={retry} />;
  if (!data) return null;
  if (data.refuse) return <Navigate to="/legion" replace />;

  const langue = i18n.language;
  const propsColonne = {
    dept, departements, salons: departements, prives, courant: salonId, onChoisirSalon: choisirSalon,
    agents: data.agents, moi, messages: data.messages, langue, onAllumer: allumer, onFiche: setFiche, onEcrireA: ecrireA,
    agentPrive: agentPrive?.id || null, t,
  };

  return (
    // Calée sur la partie visible de l'écran (voir useEcranVisible): le
    // clavier du téléphone rétrécit Legion au lieu de la pousser dehors.
    <div className="legion-app fixed inset-x-0 flex flex-col overflow-hidden bg-legion-bg text-legion-ink"
      style={{ top: 'var(--legion-top, 0px)', height: 'var(--legion-h, 100dvh)' }}>
      {/* L'en-tête: la marque, l'entreprise, les trois nombres, l'interrupteur général */}
      {/* Sur téléphone, une conversation ouverte prend tout l'écran, comme un
          groupe WhatsApp: pas d'en-tête d'entreprise, pas de pastilles, pas
          d'onglets. La flèche de la conversation ramène aux salons. */}
      <header className={`${vue === 'chat' ? 'hidden lg:flex' : 'flex'} h-14 shrink-0 items-center justify-between gap-2 border-b border-legion-line bg-legion-card px-3 sm:px-4`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <Link to="/apps" className="flex items-center gap-1 rounded-pill border border-legion-line px-2 py-1 text-caption font-semibold text-legion-muted lg:hidden" title={t('legion.retourFinjaro')}>
            <IconArrowLeft size={14} /> Finjaro
          </Link>
          <img src="/logos/legion.png" alt="Legion" className="hidden h-8 w-8 rounded-input object-cover sm:block" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-body font-semibold text-legion-ink">{data.entreprise.nom}</span>
              <span className="hidden rounded border border-legion-line bg-legion-bg px-1.5 font-mono text-[10px] text-legion-muted sm:inline">LEGION</span>
            </div>
            <p className="truncate text-[11px] text-legion-muted">
              {t('legion.bilanAgents', { total: machines.length, allumes, choisis: machines.filter((a) => a.choisi_par_lui).length })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {moi && (
            <label title={t('legion.maPhoto', 'Ma photo')} className="cursor-pointer">
              <Visage a={moi} taille={32} point={false} />
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) maPhoto(f); }} />
            </label>
          )}
          {/* Beau, 22/09: « j'arrive même pas à me déconnecter dans Legion ». */}
          <button type="button" onClick={() => signOut()} title={t('legion.seDeconnecter', 'Se déconnecter')} aria-label={t('legion.seDeconnecter', 'Se déconnecter')}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-legion-line text-legion-muted transition hover:text-legion-danger">
            <IconLogout size={15} />
          </button>
          {sansPhoto > 0 && (
            <button type="button" onClick={() => vraiesPhotos(null)} disabled={photos}
              title={t('legion.photosCoutent')}
              className="hidden items-center gap-1 rounded-pill bg-legion-gold px-3 py-1.5 text-caption font-semibold text-legion-bg disabled:opacity-50 md:flex">
              <IconCamera size={14} /> {photos ? t('legion.photosEnCours') : `${t('legion.vraiesPhotos')} (${sansPhoto})`}
            </button>
          )}
          <div className="flex items-center gap-2 rounded-input border border-legion-line bg-legion-bg px-2 py-1" title={t('legion.interrupteurGeneral', 'Interrupteur général')}>
            <IconPower size={14} className={allumes > 0 ? 'text-legion-success' : 'text-legion-muted'} />
            <span className="hidden text-[11px] font-semibold text-legion-muted sm:inline">{allumes}/{machines.length}</span>
            <Interrupteur petit on={allumes > 0} onChange={(v) => allumerTous(v)} label={t('legion.interrupteurGeneral', 'Interrupteur général')} />
          </div>
          <button type="button" onClick={() => setKanban((k) => !k)} title={t('legion.tableauTaches')}
            className={`hidden rounded-input border p-2 transition lg:block ${kanban ? 'border-legion-gold bg-legion-gold/15 text-legion-ink' : 'border-legion-line text-legion-muted hover:text-legion-ink'}`}>
            <IconLayoutKanban size={16} />
          </button>
        </div>
      </header>

      {sansPhoto > 0 && vue !== 'accueil' && vue !== 'chat' && (
        <div className="flex items-center justify-between gap-2 border-b border-legion-line bg-legion-gold/10 px-3 py-1.5 md:hidden">
          <p className="min-w-0 truncate text-[12px] text-legion-ink">{t('legion.sansPhotoCourt', { n: sansPhoto })}</p>
          <button type="button" onClick={() => vraiesPhotos(null)} disabled={photos} className="shrink-0 rounded-pill bg-legion-gold px-2.5 py-1 text-[12px] font-semibold text-legion-bg disabled:opacity-50">
            {photos ? t('legion.photosEnCours') : t('legion.vraiesPhotos')}
          </button>
        </div>
      )}

      {vue !== 'chat' && <RailPastilles departements={departements} courant={deptId} onChoisir={choisirDept} onTous={() => choisirDept(null)} agents={data.agents} t={t} />}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Rail entreprise={data.entreprise} departements={departements} courant={vue === 'accueil' ? null : deptId} onChoisir={choisirDept} onTous={() => { setDeptId(null); setVue('accueil'); }} agents={data.agents} t={t} />

        {vue === 'accueil' && (
          <Accueil
            entreprise={data.entreprise} departements={departements} agents={data.agents}
            messages={data.messages} taches={taches} moi={moi}
            onEntrer={entrer} onOuvrirSalon={choisirSalon} onEcrireA={ecrireA} onFiche={setFiche}
            onKanban={() => { setKanban(true); if (window.innerWidth < 1024) setVue('taches'); else setVue('chat'); }}
            onAllumer={allumer} onAllumerTous={allumerTous} onDirective={directive}
            onVraiesPhotos={vraiesPhotos} photosEnCours={photos}
            sansPhoto={sansPhoto} aChoisir={aChoisir} t={t}
          />
        )}

        <ColonneSalons key={vue === 'equipe' ? 'equipe' : 'salons'} {...propsColonne} ongletInitial={vue === 'equipe' ? 'agents' : 'mixte'} className={`${vue === 'salons' || vue === 'equipe' ? 'flex' : 'hidden'} ${vue === 'accueil' ? 'lg:hidden' : 'lg:flex'}`} />

        <div className={`min-w-0 flex-1 ${vue === 'chat' ? 'flex' : 'hidden'} ${vue === 'accueil' ? 'lg:hidden' : 'lg:flex'}`}>
          {salon ? (
            <Conversation
              salon={salon} dept={dept} agentPrive={agentPrive} messages={messagesDuSalon} agents={data.agents} moi={moi}
              reactions={data.reactions} langue={langue} tape={tape} brouillon={brouillon} onBrouillonPris={() => setBrouillon('')}
              onEnvoyer={envoyer} onReagir={reagir} onTacheDepuis={tacheDepuis} onFiche={setFiche} onAllumer={allumer}
              onToggleKanban={() => setKanban((k) => !k)} onRetour={() => setVue('salons')} onTaches={() => setVue('taches')} onPhotoSalon={photoSalon} onMembres={membresSalon}
              entrepriseId={entrepriseId} t={t}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-caption text-legion-muted">{t('legion.choisisUnSalon', 'Choisis un salon.')}</div>
          )}
        </div>

        <Kanban
          taches={taches} agents={data.agents} departements={departements}
          onStatut={statutTache} onCreer={creerTache} onConvoquer={convoquer} onFermer={() => setKanban(false)} t={t}
          className={`${vue === 'taches' ? 'flex' : 'hidden'} ${kanban && vue !== 'accueil' ? 'lg:flex' : 'lg:hidden'}`}
        />
      </div>

      {/* Téléphone: les quatre onglets */}
      <nav className={`${vue === 'chat' ? 'hidden' : 'flex'} shrink-0 border-t border-legion-line bg-legion-card lg:hidden`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[
          ['accueil', IconHome, t('legion.ongletAccueil', 'Accueil')],
          ['salons', IconMessages, t('legion.ongletSalons', 'Salons')],
          ['chat', IconSparkles, t('legion.ongletDiscussion', 'Discussion')],
          ['equipe', IconUsers, t('legion.ongletEquipe', 'Équipe')],
          ['taches', IconChecklist, t('legion.ongletTaches', 'Tâches')],
        ].map(([k, Icone, label]) => (
          <button key={k} type="button" onClick={() => setVue(k)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${vue === k ? 'text-legion-gold' : 'text-legion-muted'}`}>
            <Icone size={19} /> {label}
          </button>
        ))}
      </nav>

      <FicheAgent agent={fiche} dept={departements.find((d) => d.nom === fiche?.departement)} onFermer={() => setFiche(null)}
        onAllumer={allumer} onAutonomie={autonomie} onEcrireA={(a) => { ecrireA(a); }} onAutreTete={autreTete}
        onVraiePhoto={vraiesPhotos} photosEnCours={photos} t={t} />
    </div>
  );
}
