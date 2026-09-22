import { useState, useEffect, useRef } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconSend, IconUsers, IconAlertCircle, IconArrowLeft, IconHash,
  IconCircleCheck, IconHandGrab, IconMoon,
} from '@tabler/icons-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../hooks/useToast';
import { Skeleton, ErrorState, EmptyState } from '../components/states';

// L'équipe Finjaro, sur le téléphone de Beau.
//
// Première version: des salons, et c'est tout. Beau: « la messagerie doit
// être aussi utile pour VOUS. Si tu as une question, si tu as besoin d'une
// tâche, tu envoies le message, l'un lit et le prend volontiers. Il doit y
// avoir les emoji. Ça doit être genre un WhatsApp, où j'ai aussi le nom de
// chacun si je veux écrire à un. »
//
// Donc ici, quatre choses que la première version n'avait pas:
//   - les MESSAGES DIRECTS: un carnet d'adresses, on écrit à une personne;
//   - les TÂCHES qu'un agent pose et qu'un autre PREND;
//   - les RÉACTIONS, pour dire « vu » sans ajouter un message;
//   - le genre du message choisi À L'ENVOI, parce que c'est lui qui décide
//     si le téléphone de Beau sonne.
//
// ⚠️ Réservé à l'équipe: la serrure est en base (`is_admin()`), cet écran
// n'est que la porte.

const GENRES = [
  { cle: 'info', emoji: '💬', sonne: false },
  { cle: 'question', emoji: '❓', sonne: true },
  { cle: 'proposition', emoji: '💡', sonne: true },
  { cle: 'decision', emoji: '⚖️', sonne: true },
  { cle: 'tache', emoji: '📌', sonne: false },
];
const REACTIONS = ['👍', '✅', '👀', '🔥', '🙏'];

function quand(iso, langue) {
  const d = new Date(iso);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  if (min < 1440) return `il y a ${Math.round(min / 60)} h`;
  return d.toLocaleDateString(langue, { day: 'numeric', month: 'short' });
}

// La clé d'un salon privé: les deux clés triées, pour que « alpha → vigie »
// et « vigie → alpha » désignent le MÊME salon et pas deux.
const clePrivee = (a, b) => `dm-${[a, b].sort().join('-')}`;

export default function Equipe() {
  const { t, i18n } = useTranslation();
  const { user, profile, loading: authLoading } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const canal = params.get('canal') || 'direction';
  const [vue, setVue] = useState('salons'); // 'salons' | 'membres'
  const [texte, setTexte] = useState('');
  const [genre, setGenre] = useState('info');
  const [envoi, setEnvoi] = useState(false);
  const bas = useRef(null);

  const { data, loading, error, retry, setData } = useAsync(async () => {
    if (!profile?.is_admin) return null;
    const [agents, salons, messages, reactions] = await Promise.all([
      supabase.from('team_agents').select('*').order('ordre'),
      supabase.from('team_channels').select('*').order('ordre'),
      supabase.from('team_messages').select('*').eq('canal', canal).order('created_at').limit(200),
      supabase.from('team_reactions').select('*'),
    ]);
    if (messages.error) throw messages.error;

    // Ce qui attend Beau, TOUS salons confondus — une question posée dans
    // « marketing » ne doit pas se perdre pendant qu'il lit « produit ».
    const { data: ouverts } = await supabase
      .from('team_messages')
      .select('id, canal, auteur, texte, genre')
      .in('genre', ['question', 'decision'])
      .is('repondu_le', null)
      .order('created_at', { ascending: false })
      .limit(20);

    // Les tâches que personne n'a prises, où qu'elles soient.
    const { data: libres } = await supabase
      .from('team_messages')
      .select('id, canal, auteur, texte')
      .eq('genre', 'tache')
      .is('assigne_a', null)
      .is('termine_le', null)
      .limit(20);

    return {
      agents: agents.data || [],
      salons: salons.data || [],
      messages: messages.data || [],
      reactions: reactions.data || [],
      ouverts: ouverts || [],
      libres: libres || [],
    };
  }, [profile?.is_admin, canal], { cacheKey: `equipe:${canal}` });

  useEffect(() => {
    if (!profile?.is_admin) return undefined;
    const abo = supabase
      .channel(`equipe:${canal}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `canal=eq.${canal}` },
        (c) => setData((d) => (d ? { ...d, messages: [...d.messages, c.new] } : d)))
      .subscribe();
    return () => { supabase.removeChannel(abo); };
  }, [canal, profile?.is_admin, setData]);

  useEffect(() => { bas.current?.scrollIntoView({ block: 'end' }); }, [data?.messages?.length]);

  if (authLoading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (!user || !profile?.is_admin) return <Navigate to="/" replace />;
  if (loading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (error) return <ErrorState onRetry={retry} />;
  if (!data) return null;

  const agent = (cle) => data.agents.find((a) => a.cle === cle);
  const moi = data.agents.find((a) => a.user_id === user.id);
  const salonCourant = data.salons.find((s) => s.cle === canal);

  async function ouvrirPrive(autre) {
    if (!moi) return;
    const cle = clePrivee(moi.cle, autre.cle);
    if (!data.salons.some((s) => s.cle === cle)) {
      const { error: err } = await supabase.from('team_channels').insert({
        cle, nom: autre.nom, a_quoi_ca_sert: `Conversation privée avec ${autre.nom}`,
        emoji: autre.emoji, ordre: 900, prive_entre: [moi.cle, autre.cle].sort(),
      });
      if (err && !String(err.message).includes('duplicate')) {
        toast.error(err.message); return;
      }
    }
    setVue('salons');
    setParams({ canal: cle });
  }

  async function envoyer() {
    const corps = texte.trim();
    if (!corps || !moi) return;
    setEnvoi(true);
    try {
      const { data: ligne, error: err } = await supabase.from('team_messages')
        .insert({ canal, auteur: moi.cle, user_id: user.id, texte: corps, genre })
        .select().single();
      if (err) throw err;
      setTexte(''); setGenre('info');
      setData((d) => (d ? { ...d, messages: [...d.messages, ligne] } : d));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setEnvoi(false); }
  }

  async function majMessage(id, champs) {
    try {
      const { error: err } = await supabase.from('team_messages').update(champs).eq('id', id);
      if (err) throw err;
      setData((d) => d && ({
        ...d,
        messages: d.messages.map((m) => (m.id === id ? { ...m, ...champs } : m)),
        ouverts: champs.repondu_le ? d.ouverts.filter((o) => o.id !== id) : d.ouverts,
        libres: champs.assigne_a ? d.libres.filter((o) => o.id !== id) : d.libres,
      }));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }

  async function reagir(id, emoji) {
    if (!moi) return;
    const deja = data.reactions.some((r) => r.message_id === id && r.auteur === moi.cle && r.emoji === emoji);
    try {
      if (deja) {
        await supabase.from('team_reactions').delete()
          .eq('message_id', id).eq('auteur', moi.cle).eq('emoji', emoji);
        setData((d) => d && ({ ...d, reactions: d.reactions.filter(
          (r) => !(r.message_id === id && r.auteur === moi.cle && r.emoji === emoji)) }));
      } else {
        await supabase.from('team_reactions').insert({ message_id: id, auteur: moi.cle, emoji });
        setData((d) => d && ({ ...d, reactions: [...d.reactions, { message_id: id, auteur: moi.cle, emoji }] }));
      }
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }

  const enService = data.agents.filter((a) => a.actif && !a.user_id);
  const enSommeil = data.agents.filter((a) => !a.actif && !a.user_id);

  return (
    <div className="flex h-dvh flex-col bg-base">
      <header className="flex items-center gap-2 border-b border-hairline bg-white px-4 py-3">
        {vue === 'membres' ? (
          <button onClick={() => setVue('salons')} aria-label={t('common.back')} className="-ml-1 p-1 text-ink">
            <IconArrowLeft size={20} />
          </button>
        ) : (
          <IconUsers size={20} className="text-teal" />
        )}
        <span className="text-section font-semibold text-ink">
          {vue === 'membres' ? t('equipe.membresTitre') : t('equipe.titre')}
        </span>
        {vue === 'salons' && (
          <button onClick={() => setVue('membres')} className="ml-auto text-caption font-semibold text-teal">
            {t('equipe.ecrireAUn')}
          </button>
        )}
      </header>

      {vue === 'membres' ? (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <p className="text-caption font-semibold uppercase tracking-wider text-muted">
            {t('equipe.enService', { count: enService.length })}
          </p>
          <ul className="mt-2 space-y-2">
            {enService.map((a) => <Carte key={a.cle} a={a} onClick={() => ouvrirPrive(a)} />)}
          </ul>
          {enSommeil.length > 0 && (
            <>
              <p className="mt-6 flex items-center gap-1 text-caption font-semibold uppercase tracking-wider text-muted">
                <IconMoon size={13} /> {t('equipe.enSommeil', { count: enSommeil.length })}
              </p>
              <p className="mt-1 text-caption text-muted">{t('equipe.sommeilPourquoi')}</p>
              <ul className="mt-2 space-y-2">
                {enSommeil.map((a) => <Carte key={a.cle} a={a} endormi onClick={() => ouvrirPrive(a)} />)}
              </ul>
            </>
          )}
        </div>
      ) : (
        <>
          {(data.ouverts.length > 0 || data.libres.length > 0) && (
            <div className="border-b border-hairline bg-brass/10 px-4 py-2">
              {data.ouverts.length > 0 && (
                <>
                  <p className="flex items-center gap-1 text-caption font-semibold text-ink">
                    <IconAlertCircle size={14} /> {t('equipe.tAttendent', { count: data.ouverts.length })}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {data.ouverts.slice(0, 3).map((o) => (
                      <li key={o.id} className="flex items-start gap-2 text-caption">
                        <button onClick={() => setParams({ canal: o.canal })}
                          className="min-w-0 flex-1 truncate text-left text-ink">
                          {agent(o.auteur)?.emoji} {o.texte}
                        </button>
                        <button onClick={() => majMessage(o.id, { repondu_le: new Date().toISOString() })}
                          className="shrink-0 font-semibold text-teal">{t('equipe.regle')}</button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {data.libres.length > 0 && (
                <p className="mt-1 text-caption text-muted">
                  📌 {t('equipe.tachesLibres', { count: data.libres.length })}
                </p>
              )}
            </div>
          )}

          <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-b border-hairline bg-white px-4 py-2">
            {data.salons.filter((s) => !s.prive_entre).map((s) => (
              <button key={s.cle} onClick={() => setParams({ canal: s.cle })}
                className={`shrink-0 rounded-pill px-3 py-1 text-caption font-semibold ${
                  canal === s.cle ? 'bg-teal text-white' : 'border border-hairline text-muted'}`}>
                {s.emoji} {s.nom}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {salonCourant?.prive_entre && (
              <p className="mb-3 flex items-center gap-1 text-caption text-muted">
                <IconHash size={13} /> {salonCourant.a_quoi_ca_sert}
              </p>
            )}
            {data.messages.length === 0 ? (
              <EmptyState title={t('equipe.vide')} hint={salonCourant?.a_quoi_ca_sert} />
            ) : (
              <ul className="space-y-4">
                {data.messages.map((m) => {
                  const a = agent(m.auteur);
                  const g = GENRES.find((x) => x.cle === m.genre);
                  const mes = data.reactions.filter((r) => r.message_id === m.id);
                  return (
                    <li key={m.id} className="flex gap-2">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-card text-caption"
                        style={{ backgroundColor: (a?.couleur || '#C25E38') + '22' }} title={a?.poste}>
                        {a?.emoji || '•'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-caption font-semibold text-ink">{a?.nom || m.auteur}</span>
                          <span className="text-caption text-muted">{quand(m.created_at, i18n.language)}</span>
                          {m.genre !== 'info' && (
                            <span className="rounded-pill bg-teal-light px-2 py-0.5 text-caption font-semibold text-teal">
                              {g?.emoji} {t(`equipe.genre.${m.genre}`)}
                            </span>
                          )}
                        </p>
                        <p className="whitespace-pre-wrap break-words text-body text-ink">{m.texte}</p>

                        {/* Une tâche que personne n'a prise: on la prend. */}
                        {m.genre === 'tache' && !m.termine_le && (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {m.assigne_a ? (
                              <>
                                <span className="text-caption text-muted">
                                  {t('equipe.prisePar', { nom: agent(m.assigne_a)?.nom || m.assigne_a })}
                                </span>
                                <button onClick={() => majMessage(m.id, { termine_le: new Date().toISOString() })}
                                  className="inline-flex items-center gap-1 text-caption font-semibold text-teal">
                                  <IconCircleCheck size={14} /> {t('equipe.terminer')}
                                </button>
                              </>
                            ) : (
                              <button onClick={() => moi && majMessage(m.id, { assigne_a: moi.cle })}
                                className="inline-flex items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white">
                                <IconHandGrab size={14} /> {t('equipe.jeLaPrends')}
                              </button>
                            )}
                          </div>
                        )}
                        {m.termine_le && (
                          <p className="mt-1 text-caption text-success">✅ {t('equipe.terminee')}</p>
                        )}

                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {REACTIONS.map((e) => {
                            const n = mes.filter((r) => r.emoji === e).length;
                            return (
                              <button key={e} onClick={() => reagir(m.id, e)}
                                aria-label={e}
                                className={`rounded-pill px-2 py-0.5 text-caption ${
                                  n ? 'bg-teal-light font-semibold text-teal' : 'text-muted opacity-40 hover:opacity-100'}`}>
                                {e}{n ? ` ${n}` : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div ref={bas} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); envoyer(); }}
            className="shrink-0 border-t border-hairline bg-white px-4 py-2">
            {/* Le genre se choisit AVANT d'envoyer, parce que c'est lui qui
                décide si le téléphone de Beau sonne. */}
            <div className="no-scrollbar mb-2 flex gap-1 overflow-x-auto">
              {GENRES.map((g) => (
                <button key={g.cle} type="button" onClick={() => setGenre(g.cle)}
                  className={`shrink-0 rounded-pill px-2 py-0.5 text-caption ${
                    genre === g.cle ? 'bg-teal text-white' : 'border border-hairline text-muted'}`}>
                  {g.emoji} {t(`equipe.genre.${g.cle}`)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input value={texte} onChange={(e) => setTexte(e.target.value)}
                placeholder={t('equipe.ecrire')} aria-label={t('equipe.ecrire')} className="input flex-1" />
              <button type="submit" disabled={envoi || texte.trim() === '' || !moi}
                aria-label={t('equipe.envoyer')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-input bg-teal text-white disabled:bg-hairline disabled:text-muted">
                <IconSend size={18} />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function Carte({ a, endormi, onClick }) {
  return (
    <li>
      <button onClick={onClick}
        className={`flex w-full items-start gap-3 rounded-card border border-hairline p-3 text-left ${endormi ? 'opacity-60' : ''}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card"
          style={{ backgroundColor: a.couleur + '22' }}>{a.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-semibold text-ink">{a.nom}</span>
          <span className="block text-caption text-muted">{a.poste}</span>
          <span className="mt-1 block text-caption text-muted">{a.mandat}</span>
        </span>
      </button>
    </li>
  );
}
