import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconLayoutKanban, IconMessages, IconUsers, IconChecklist, IconSparkles, IconPower, IconCamera, IconHome } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useFondLegion } from './parties/useFondLegion';
import { useEcranVisible } from './parties/useEcranVisible';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { IconLogout } from '@tabler/icons-react';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Skeleton, ErrorState } from '../../components/states';
import { Rail, RailPastilles } from './parties/Rail';
import { ColonneSalons } from './parties/ColonneSalons';
import { Conversation } from './parties/Conversation';
import { Appel } from './parties/Appel';
import { Renfort } from './parties/Renfort';
import { Kanban } from './parties/Kanban';
import { FicheAgent } from './parties/FicheAgent';
import { Accueil } from './parties/Accueil';
import { Interrupteur } from './parties/Interrupteur';
import { Visage } from './parties/Visage';
import { couleurDept, clePrivee, sansAccent, raisonLisible } from './parties/outils';

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
  const { language, setLanguage } = useSettings();
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
  const [appel, setAppel] = useState(null); // l'agent qu'on appelle (23/09)
  const [renfort, setRenfort] = useState(false); // renforcer un service / un expert (23/09)

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
    // Où chacun s'est arrêté dans chaque salon (non-lus). Sans la table —
    // ou en cas d'erreur — rien ne s'affiche, rien ne casse.
    const { data: lectures } = await supabase.from('legion_lectures').select('canal_id, lu_le').eq('entreprise_id', entrepriseId);
    const lus = Object.fromEntries((lectures || []).map((l) => [l.canal_id, l.lu_le]));
    return { entreprise, agents: agents.data || [], salons: salons.data || [], messages: liste, reactions: reactions || [], lus };
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
  // Le salon où le rapport du soir se lit: le même choix que legion-rapport.
  const salonRapport = useMemo(() => departements.find((s) => sansAccent(s.nom) === 'direction' || sansAccent(s.cle || '') === 'direction') || departements[0] || null, [departements]);
  const moi = data?.agents.find((a) => a.user_id === user?.id) || null;
  const agentPrive = useMemo(() => (salon?.prive_entre?.length ? data?.agents.find((a) => salon.prive_entre.includes(a.cle) && a.cle !== moi?.cle) || null : null), [salon, data?.agents, moi]);
  const messagesDuSalon = useMemo(() => (data?.messages || []).filter((m) => m.canal_id === salonId), [data?.messages, salonId]);
  // La réunion en cours dans ce salon (legion-reunion, 23/09): ouverte il y a
  // moins de 45 minutes, ni terminée, ni close par un compte rendu.
  const reunion = useMemo(() => {
    const ouverture = [...messagesDuSalon].reverse().find((m) => m.genre === 'reunion' && m.meta?.reunion?.ouverture);
    if (!ouverture || ouverture.meta.reunion.terminee) return null;
    if (Date.now() - Date.parse(ouverture.created_at) > 45 * 60_000) return null;
    const paroles = messagesDuSalon.filter((m) => m.meta?.reunion?.id === ouverture.id);
    if (paroles.some((m) => m.meta.reunion.fin)) return null;
    const ordres = paroles.map((m) => m.meta.reunion.ordre).filter((x) => typeof x === 'number');
    return { id: ouverture.id, ...ouverture.meta.reunion, prochain: ordres.length ? Math.max(...ordres) + 1 : 0 };
  }, [messagesDuSalon]);
  const taches = useMemo(() => (data?.messages || []).filter((m) => m.genre === 'tache'), [data?.messages]);
  const machines = useMemo(() => (data?.agents || []).filter((a) => !a.user_id), [data?.agents]);
  const allumes = machines.filter((a) => a.actif).length;
  // Claude (moteur « claude-code ») ne se fait pas faire de visage par Gemini.
  const aChoisir = machines.filter((a) => !a.choisi_par_lui && a.moteur !== 'claude-code').length;
  const sansPhoto = machines.filter((a) => a.apparence?.famille !== 'photo' && a.moteur !== 'claude-code').length;

  // Les non-lus, comme WhatsApp: ce qui est arrivé dans un salon depuis la
  // dernière fois qu'on l'a ouvert, sauf ses propres messages. Un salon
  // jamais ouvert part de maintenant (sinon tout l'historique compterait).
  const lus = data?.lus;
  const marquerLu = useCallback(async (canaux) => {
    if (!user?.id || !canaux.length) return;
    const maintenant = new Date().toISOString();
    setData((d) => (d ? { ...d, lus: { ...d.lus, ...Object.fromEntries(canaux.map((c) => [c, maintenant])) } } : d));
    await supabase.from('legion_lectures').upsert(canaux.map((c) => ({ user_id: user.id, canal_id: c, entreprise_id: entrepriseId, lu_le: maintenant })));
  }, [user?.id, entrepriseId, setData]);
  useEffect(() => {
    if (!lus || !data?.salons) return;
    const jamais = data.salons.filter((s) => !lus[s.id]).map((s) => s.id);
    if (jamais.length) marquerLu(jamais);
  }, [lus, data?.salons, marquerLu]);
  const salonOuvert = vue === 'chat' || (vue !== 'accueil' && typeof window !== 'undefined' && window.innerWidth >= 1024);
  const dernierDuSalon = messagesDuSalon[messagesDuSalon.length - 1]?.created_at;
  useEffect(() => {
    if (!salonOuvert || !salonId || !lus || !dernierDuSalon) return;
    if (lus[salonId] && dernierDuSalon <= lus[salonId]) return;
    if (document.visibilityState === 'hidden') return;
    marquerLu([salonId]);
  }, [salonOuvert, salonId, dernierDuSalon, lus, marquerLu]);
  const nonLus = useMemo(() => {
    const n = {};
    if (!lus) return n;
    for (const m of data?.messages || []) {
      const lu = lus[m.canal_id];
      if (!lu || m.created_at <= lu || m.user_id === user?.id || (moi && m.auteur_id === moi.id)) continue;
      n[m.canal_id] = (n[m.canal_id] || 0) + 1;
    }
    return n;
  }, [data?.messages, lus, user?.id, moi]);

  // Le bouton FR / EN: la langue de l'écran, et — pour le propriétaire —
  // celle dans laquelle les agents écrivent les plans du matin (0166).
  const estProprietaire = data?.entreprise?.owner_id === user?.id;
  const changerLangue = useCallback(async (code) => {
    setLanguage(code);
    if (!estProprietaire || data?.entreprise?.langue === code) return;
    const { error: err } = await supabase.from('legion_entreprises').update({ langue: code }).eq('id', entrepriseId);
    if (!err) setData((d) => (d ? { ...d, entreprise: { ...d.entreprise, langue: code } } : d));
  }, [setLanguage, estProprietaire, data?.entreprise?.langue, entrepriseId, setData]);

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
    // Pendant une réunion, un message du salon est une INTERVENTION: le
    // prochain qui parle y répond d'abord (legion-reunion). Personne d'autre
    // ne répond en parallèle, sinon deux conversations se croisent.
    const enReunion = !!reunion && canal === salonId && genre !== 'tache';
    const metaFinale = { ...(meta || {}), ...(enReunion ? { dans_reunion: reunion.id } : {}) };
    const { data: ligne, error: err } = await supabase.from('legion_messages')
      .insert({ entreprise_id: entrepriseId, canal_id: canal, auteur_id: moi.id, user_id: user.id, texte, genre, meta: Object.keys(metaFinale).length ? metaFinale : null })
      .select().single();
    if (err) { toast.error(err.message || t('errors.generic')); throw err; }
    setData((d) => (d && !d.messages.some((m) => m.id === ligne.id) ? { ...d, messages: [...d.messages, ligne] } : d));
    if (genre === 'tache') return;
    if (enReunion) { toast.info(t('legion.reunion.interventionNotee')); return; }

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
      else if (r?.erreur) toast.error(t('legion.personneNaPuRepondre', { raison: raisonLisible(r.erreur, t) }));
      // Plusieurs peuvent répondre à un « salut à tous »: le temps réel les
      // apporte aussi, on dédoublonne par identifiant.
      const arrives = (r?.messages || []).filter(Boolean);
      if (arrives.length) setData((d) => (d ? { ...d, messages: [...d.messages, ...arrives.filter((x) => !d.messages.some((m) => m.id === x.id))] } : d));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setTape(null); }
  }

  // Les réunions (legion-reunion, 23/09). La fonction répond tout de suite;
  // les prises de parole arrivent ensuite une par une, en temps réel.
  async function raisonDe(e) {
    try { const j = await e?.context?.json?.(); return j?.erreur || null; } catch { return null; }
  }
  async function ouvrirReunion({ sujet, participants, recherche, format }) {
    if (!salonId) return false;
    const { data: r, error: e } = await supabase.functions.invoke('legion-reunion', { body: { canal_id: salonId, sujet, participants, recherche, format } });
    if (e || r?.erreur) { toast.error(r?.erreur || (await raisonDe(e)) || e?.message || t('errors.generic')); return false; }
    if (r?.message) setData((d) => (d && !d.messages.some((m) => m.id === r.message.id) ? { ...d, messages: [...d.messages, r.message] } : d));
    return true;
  }
  async function conclureReunion(id) {
    const { data: r, error: e } = await supabase.functions.invoke('legion-reunion', { body: { reunion_id: id, conclure: true } });
    if (e || r?.erreur) toast.error(r?.erreur || (await raisonDe(e)) || e?.message || t('errors.generic'));
    else toast.info(t('legion.reunion.conclusionDemandee'));
  }

  // Le rapport du soir tout de suite (legion-rapport, 23/09). La fonction
  // l'écrit avant de répondre; il arrive dans le salon en temps réel.
  async function faireRapport(mode) {
    const { data: r, error: e } = await supabase.functions.invoke('legion-rapport', { body: { entreprise_id: entrepriseId, mode } });
    if (e || r?.erreur) { toast.error(r?.erreur || (await raisonDe(e)) || e?.message || t('errors.generic')); return false; }
    const ligne = (r?.journal || [])[0] || '';
    if (/plafond/.test(ligne)) { toast.error(t('legion.rapport.plafond')); return false; }
    if (r?.messages?.length) ajouterMessages(r.messages);
    return true;
  }

  // Appeler un agent (23/09): l'appel se passe dans son salon privé, et tout
  // ce qui s'y dit y reste écrit.
  async function appeler(a) {
    if (!a || a.user_id || !a.actif) return;
    await ecrireA(a);
    setVue('chat');
    setAppel(a);
  }
  const ajouterMessages = useCallback((liste) => {
    setData((d) => (d ? { ...d, messages: [...d.messages, ...liste.filter((x) => !d.messages.some((m) => m.id === x.id))] } : d));
  }, [setData]);

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
    // Valider un livrable « à revoir » est un verdict humain: il rejoint nos
    // exemples d'entraînement (0167), si l'entreprise a dit oui.
    if (statut === 'fait' && x.meta?.statut === 'revue') supabase.rpc('ia_juger', { p_tache: x.id, p_verdict: 'valide' }).then(() => {}, () => {});
  }

  // La revue d'un livrable (chantier 7, « des agents qui s'améliorent »):
  // le fondateur valide, ou renvoie avec une remarque. La remarque part
  // dans le salon, adressée à l'agent (qui refait son livrable), et, s'il
  // le demande, devient une règle que toute l'équipe relit.
  async function renvoyer(x, remarque, enRegle) {
    const a = data.agents.find((y) => y.id === x.assigne_a);
    // Le verdict et la remarque, pour nos exemples d'entraînement (0167).
    supabase.rpc('ia_juger', { p_tache: x.id, p_verdict: 'renvoye', p_remarque: remarque }).then(() => {}, () => {});
    await majMessage(x.id, { meta: { ...(x.meta || {}), statut: 'a_faire', remarque, renvoye_le: new Date().toISOString() }, termine_le: null });
    const { data: livrable } = await supabase.from('legion_messages').select('id, texte').eq('entreprise_id', entrepriseId)
      .contains('meta', { livrable: { tache_id: x.id } }).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (enRegle && remarque.trim().length >= 8) {
      await supabase.from('legion_memoire').insert({ entreprise_id: entrepriseId, regle: remarque.trim(), source: 'main', agent_id: a?.id || null, cree_par: user.id });
    }
    await envoyer({
      texte: `↩ ${a ? `@${a.nom} ` : ''}${t('legion.renvoiTexte', { tache: x.texte, remarque, defaultValue: '« {{tache}} » — à refaire : {{remarque}}' })}`,
      genre: 'decision',
      meta: { ...(livrable && a ? { reponse_a: { id: livrable.id, nom: a.nom, texte: String(livrable.texte).slice(0, 120) } } : {}), renvoi: { tache_id: x.id, agent_id: a?.id || null } },
    }, x.canal_id);
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
  async function modifierAgent(a, champs) {
    const { error: err } = await supabase.from('legion_agents').update(champs).eq('id', a.id);
    if (err) { toast.error(err.message); return; }
    setData((d) => d && ({ ...d, agents: d.agents.map((x) => (x.id === a.id ? { ...x, ...champs } : x)) }));
    setFiche((f) => (f && f.id === a.id ? { ...f, ...champs } : f));
    toast.success(t('legion.agentModifie', 'Enregistré'));
  }
  async function creerAgent(champs) {
    const base = sansAccent(champs.nom).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'agent';
    const pris = new Set(data.agents.map((x) => x.cle));
    let cle = base; for (let i = 2; pris.has(cle); i += 1) cle = `${base}-${i}`;
    const { data: cree, error: err } = await supabase.from('legion_agents').insert({
      entreprise_id: entrepriseId, cle, ...champs, departement: champs.departement || null, mandat: champs.mandat || champs.poste,
      personnalite: champs.personnalite || null, actif: true, ordre: 900, autonomie: 'supervise',
    }).select().single();
    if (err) { toast.error(err.message); return; }
    setData((d) => d && ({ ...d, agents: [...d.agents, cree] }));
    toast.success(t('legion.agentCree', { nom: cree.nom, defaultValue: '{{nom}} rejoint l’équipe' }));
  }
  // Engager les agents proposés par « Renforcer » (legion-renfort): chacun
  // avec sa fiche de mission, ce qu'il ne fait jamais, et ses premières
  // tâches au tableau. Un service qui n'a pas encore de salon en reçoit un.
  async function engager(propositions, { departement, finMission, mode, objectif, expert }) {
    try {
      let salon = departement ? data.salons.find((x) => !x.prive_entre?.length && sansAccent(x.nom) === sansAccent(departement)) : null;
      if (departement && !salon) {
        const cleSalon = sansAccent(departement).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'service';
        const { data: cree, error: e0 } = await supabase.from('legion_canaux').insert({
          entreprise_id: entrepriseId, cle: data.salons.some((x) => x.cle === cleSalon) ? `${cleSalon}-${Date.now() % 1000}` : cleSalon,
          nom: departement, a_quoi_ca_sert: objectif.slice(0, 200), emoji: mode === 'expert' ? '🧭' : '🧩', ordre: 500,
        }).select().single();
        if (e0) throw e0;
        salon = cree;
        setData((d) => (d ? { ...d, salons: [...d.salons, cree] } : d));
      }
      const canalTaches = salon?.id || departements[0]?.id;
      const pris = new Set(data.agents.map((x) => x.cle));
      const nouveaux = [];
      for (const p of propositions) {
        const base = sansAccent(p.nom).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'agent';
        let cle = base; for (let i = 2; pris.has(cle); i += 1) cle = `${base}-${i}`;
        pris.add(cle);
        const { data: a, error: e1 } = await supabase.from('legion_agents').insert({
          entreprise_id: entrepriseId, cle, nom: p.nom, poste: p.poste, departement: departement || null,
          mandat: p.mandat || p.poste, personnalite: p.personnalite || null, jamais: p.jamais || null,
          actif: true, ordre: 800, autonomie: 'supervise', interim: !!finMission, fin_mission: finMission || null,
          mission: { type: mode, objectif, expert: mode === 'expert' ? expert : null, prend: p.prend || [], relais_humain: p.relais_humain || null, debut: new Date().toISOString().slice(0, 10) },
        }).select().single();
        if (e1) throw e1;
        nouveaux.push(a);
        for (const titre of (p.premieres_taches || []).slice(0, 4)) {
          if (!canalTaches || String(titre).trim().length < 4) continue;
          await supabase.from('legion_messages').insert({
            entreprise_id: entrepriseId, canal_id: canalTaches, auteur_id: moi.id, user_id: user.id, texte: String(titre).slice(0, 200),
            genre: 'tache', assigne_a: a.id, meta: { statut: 'a_faire', priorite: 'moyenne', mission: true },
          });
        }
      }
      setData((d) => (d ? { ...d, agents: [...d.agents, ...nouveaux] } : d));
      toast.success(t('legion.renfort.engages', { n: nouveaux.length }));
      return true;
    } catch (e) { toast.error(e.message || t('errors.generic')); return false; }
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
    agentPrive: agentPrive?.id || null, nonLus, t, onRenfort: () => setRenfort(true),
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
          {/* La langue (plan complet, C): Legion, et les plans et livrables du
              matin, suivent ce choix. Chaque code dans sa propre langue. */}
          {/* Sur téléphone la place manque: un seul bouton, la langue d'en face. */}
          <button type="button" onClick={() => changerLangue(language === 'en' ? 'fr' : 'en')}
            lang={language === 'en' ? 'fr' : 'en'} title={language === 'en' ? 'Français' : 'English'}
            className="flex h-8 min-w-8 items-center justify-center rounded-full border border-legion-line px-1.5 text-[10px] font-bold text-legion-muted sm:hidden">
            {language === 'en' ? 'FR' : 'EN'}
          </button>
          <div className="hidden items-center rounded-full border border-legion-line p-0.5 sm:flex" role="group" aria-label="Langue / Language">
            {[['fr', 'FR', 'Français'], ['en', 'EN', 'English']].map(([code, court, nom]) => (
              <button key={code} type="button" lang={code} title={nom} aria-pressed={language === code} onClick={() => changerLangue(code)}
                className={`rounded-full px-2 py-1 text-[10px] font-bold transition ${language === code ? 'bg-legion-gold text-legion-bg' : 'text-legion-muted hover:text-legion-ink'}`}>
                {court}
              </button>
            ))}
          </div>
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
              reunion={reunion} onReunion={ouvrirReunion} onConclureReunion={conclureReunion} onAppeler={appeler}
              onRapport={salonRapport && salon.id === salonRapport.id ? faireRapport : null}
              entrepriseId={entrepriseId} t={t}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-caption text-legion-muted">{t('legion.choisisUnSalon', 'Choisis un salon.')}</div>
          )}
        </div>

        {renfort && (
          <Renfort entrepriseId={entrepriseId} departements={departements} t={t} onFermer={() => setRenfort(false)} onEngager={engager} />
        )}

        {/* L'appel à la voix, par-dessus tout, tant qu'on est dans le salon privé de l'agent */}
        {appel && moi && agentPrive?.id === appel.id && salon && (
          <Appel agent={agentPrive} salon={salon} moi={moi} entrepriseId={entrepriseId} langue={langue} t={t}
            onMessages={ajouterMessages} onRaccrocher={() => setAppel(null)} />
        )}

        <Kanban
          taches={taches} agents={data.agents} departements={departements}
          onStatut={statutTache} onCreer={creerTache} onConvoquer={convoquer} onRenvoyer={renvoyer} onFermer={() => setKanban(false)} t={t}
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

      {/* Une clé par agent: la fiche repart de zéro à chaque ouverture (sinon
          un formulaire à moitié rempli passait d'un agent à l'autre). */}
      <FicheAgent key={fiche ? fiche.id || 'nouveau' : 'aucun'} agent={fiche} dept={departements.find((d) => d.nom === fiche?.departement)} departements={departements} onFermer={() => setFiche(null)}
        onAllumer={allumer} onAutonomie={autonomie} onEcrireA={(a) => { ecrireA(a); }} onAutreTete={autreTete}
        onModifier={modifierAgent} onCreer={creerAgent}
        onVraiePhoto={vraiesPhotos} photosEnCours={photos} t={t} />
    </div>
  );
}
