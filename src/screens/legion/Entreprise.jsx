import { useState, useEffect, useRef, useMemo } from 'react';
import { Navigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconSend, IconUsers, IconAlertCircle, IconArrowLeft, IconHash,
  IconCircleCheck, IconHandGrab, IconMoon,
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Skeleton, ErrorState, EmptyState } from '../../components/states';

// LEGION — l'entreprise d'agents, sur le téléphone de celui qui l'a fondée.
//
// C'est l'écran d'équipe posé pour Finjaro le 22/09, rendu multi-entreprise
// le même jour: Beau a dit « ce que je vais utiliser, c'est ce que tout le
// monde utilisera ». Tout appartient maintenant à une entreprise
// (`legion_entreprises`), et la serrure n'est plus « administrateur » mais
// « membre de CETTE entreprise » — en base, pas ici.
//
// Ce qu'il fait: les salons, les messages directs (un carnet d'adresses), les
// tâches qu'un agent pose et qu'un autre prend, les réactions, et le genre du
// message choisi à l'envoi — c'est lui qui décide si le téléphone sonne.

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

const TAILLES = { cocon: 'Cocon', startup: 'Startup', scaleup: 'Scale-up', megacorp: 'Mégacorp' };

export default function Entreprise() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const { id: entrepriseId } = useParams();
  const [params, setParams] = useSearchParams();
  const canalDemande = params.get('canal');
  const [vue, setVue] = useState('salons'); // 'salons' | 'membres'
  const [texte, setTexte] = useState('');
  const [genre, setGenre] = useState('info');
  const [envoi, setEnvoi] = useState(false);
  const [choisissent, setChoisissent] = useState(false);
  const [bilan, setBilan] = useState(null);
  const bas = useRef(null);

  const { data, loading, error, retry, setData } = useAsync(async () => {
    if (!user?.id || !entrepriseId) return null;
    const { data: entreprise, error: e0 } = await supabase
      .from('legion_entreprises').select('*').eq('id', entrepriseId).maybeSingle();
    if (e0) throw e0;
    // Pas membre: la base ne renvoie rien. On le dit, sans détour.
    if (!entreprise) return { refuse: true };

    const [agents, salons] = await Promise.all([
      supabase.from('legion_agents').select('*').eq('entreprise_id', entrepriseId).order('ordre'),
      supabase.from('legion_canaux').select('*').eq('entreprise_id', entrepriseId).order('ordre'),
    ]);
    const liste = salons.data || [];
    const canalCourant = liste.find((c) => c.id === canalDemande) || liste.find((c) => c.cle === 'direction') || liste[0];
    const canal = canalCourant?.id;

    const [messages, reactions] = await Promise.all([
      canal ? supabase.from('legion_messages').select('*').eq('canal_id', canal).order('created_at').limit(200) : { data: [] },
      supabase.from('legion_reactions').select('*, legion_messages!inner(entreprise_id)').eq('legion_messages.entreprise_id', entrepriseId),
    ]);
    if (messages.error) throw messages.error;

    // Ce qui attend Beau, TOUS salons confondus — une question posée dans
    // « marketing » ne doit pas se perdre pendant qu'il lit « produit ».
    const { data: ouverts } = await supabase
      .from('legion_messages')
      .select('id, canal_id, auteur_id, texte, genre')
      .eq('entreprise_id', entrepriseId)
      .in('genre', ['question', 'decision'])
      .is('repondu_le', null)
      .order('created_at', { ascending: false })
      .limit(20);

    // Les tâches que personne n'a prises, où qu'elles soient.
    const { data: libres } = await supabase
      .from('legion_messages')
      .select('id, canal_id, auteur_id, texte')
      .eq('entreprise_id', entrepriseId)
      .eq('genre', 'tache')
      .is('assigne_a', null)
      .is('termine_le', null)
      .limit(20);

    return {
      entreprise,
      canal,
      agents: agents.data || [],
      salons: liste,
      messages: messages.data || [],
      reactions: (reactions.data || []).map(({ legion_messages, ...r }) => r),
      ouverts: ouverts || [],
      libres: libres || [],
    };
  }, [user?.id, entrepriseId, canalDemande], { cacheKey: `legion:${entrepriseId}:${canalDemande || 'direction'}` });

  const canal = data?.canal;

  useEffect(() => {
    if (!canal) return undefined;
    const abo = supabase
      .channel(`legion:${canal}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'legion_messages', filter: `canal_id=eq.${canal}` },
        (c) => setData((d) => (d ? { ...d, messages: [...d.messages, c.new] } : d)))
      .subscribe();
    return () => { supabase.removeChannel(abo); };
  }, [canal, setData]);

  useEffect(() => { bas.current?.scrollIntoView({ block: 'end' }); }, [data?.messages?.length]);

  if (authLoading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (!user) return <Navigate to="/auth" state={{ from: `/legion/${entrepriseId}` }} replace />;
  if (loading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (error) return <ErrorState onRetry={retry} />;
  if (!data) return null;
  if (data.refuse) return <Navigate to="/legion" replace />;

  const agent = (id) => data.agents.find((a) => a.id === id);
  const moi = data.agents.find((a) => a.user_id === user.id);
  const salonCourant = data.salons.find((s) => s.id === canal);

  async function ouvrirPrive(autre) {
    if (!moi) return;
    const cle = clePrivee(moi.cle, autre.cle);
    let salon = data.salons.find((s) => s.cle === cle);
    if (!salon) {
      const { data: cree, error: err } = await supabase.from('legion_canaux').insert({
        entreprise_id: entrepriseId, cle, nom: autre.nom,
        a_quoi_ca_sert: `Conversation privée avec ${autre.nom}`,
        emoji: autre.emoji || '💬', ordre: 900, prive_entre: [moi.cle, autre.cle].sort(),
      }).select().single();
      if (err) { toast.error(err.message); return; }
      salon = cree;
      setData((d) => (d ? { ...d, salons: [...d.salons, cree] } : d));
    }
    setVue('salons');
    setParams({ canal: salon.id });
  }

  async function envoyer() {
    const corps = texte.trim();
    if (!corps || !moi) return;
    setEnvoi(true);
    try {
      const { data: ligne, error: err } = await supabase.from('legion_messages')
        .insert({ entreprise_id: entrepriseId, canal_id: canal, auteur_id: moi.id, user_id: user.id, texte: corps, genre })
        .select().single();
      if (err) throw err;
      setTexte(''); setGenre('info');
      setData((d) => (d ? { ...d, messages: [...d.messages, ligne] } : d));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setEnvoi(false); }
  }

  async function majMessage(id, champs) {
    try {
      const { error: err } = await supabase.from('legion_messages').update(champs).eq('id', id);
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
    const deja = data.reactions.some((r) => r.message_id === id && r.auteur_id === moi.id && r.emoji === emoji);
    try {
      if (deja) {
        await supabase.from('legion_reactions').delete()
          .eq('message_id', id).eq('auteur_id', moi.id).eq('emoji', emoji);
        setData((d) => d && ({ ...d, reactions: d.reactions.filter(
          (r) => !(r.message_id === id && r.auteur_id === moi.id && r.emoji === emoji)) }));
      } else {
        await supabase.from('legion_reactions').insert({ message_id: id, auteur_id: moi.id, emoji });
        setData((d) => d && ({ ...d, reactions: [...d.reactions, { message_id: id, auteur_id: moi.id, emoji }] }));
      }
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }

  // Beau veut que chaque agent choisisse sa tête. Aucun agent ne tourne
  // encore: en attendant, on tire une autre apparence et on la GARDE. Le
  // jour où l'agent réfléchira, il appellera la même fonction lui-même.
  async function autreTete(a) {
    try {
      const { error: err } = await supabase.rpc('legion_visage_au_hasard', { p_agent: a.id });
      if (err) throw err;
      const { data: frais } = await supabase.from('legion_agents')
        .select('id, apparence, avatar_url').eq('id', a.id).single();
      if (frais) {
        setData((d) => d && ({
          ...d,
          agents: d.agents.map((x) => (x.id === a.id ? { ...x, ...frais } : x)),
        }));
      }
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }

  // L'INTERRUPTEUR. Beau: « je dois avoir le pouvoir de désactiver et
  // réactiver ». Un agent éteint ne tourne pas, donc ne coûte rien. C'est
  // ce qui décide de la facture, donc ça se voit sur chaque fiche.
  async function allumer(a, actif) {
    try {
      const { error: err } = await supabase.rpc('legion_activer_agent', { p_agent: a.id, p_actif: actif });
      if (err) throw err;
      setData((d) => d && ({ ...d, agents: d.agents.map((x) => (x.id === a.id ? { ...x, actif } : x)) }));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }

  async function allumerTous(actif) {
    try {
      const { error: err } = await supabase.rpc('legion_activer_tous', { p_entreprise: entrepriseId, p_actif: actif });
      if (err) throw err;
      setData((d) => d && ({
        ...d,
        agents: d.agents.map((x) => (x.user_id ? x : { ...x, actif })),
      }));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }

  // Le premier vrai tour de machine: chacun lit son poste et choisit sa tête
  // et son caractère. Seuls les allumés partent, et jamais deux fois.
  async function quIlsChoisissent() {
    setChoisissent(true);
    try {
      const { data: r, error: err } = await supabase.functions.invoke('legion-se-choisir', {
        body: { entreprise_id: entrepriseId, limite: 25 },
      });
      if (err) throw err;
      if (r?.erreur) throw new Error(r.erreur);
      setBilan({ faits: r?.faits ?? 0, restants: r?.restants ?? 0 });
      const { data: frais } = await supabase.from('legion_agents')
        .select('*').eq('entreprise_id', entrepriseId).order('ordre');
      if (frais) setData((d) => d && ({ ...d, agents: frais }));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setChoisissent(false); }
  }

  const enService = data.agents.filter((a) => a.actif && !a.user_id);
  const enSommeil = data.agents.filter((a) => !a.actif && !a.user_id);
  const sansMoi = data.agents.filter((a) => !a.user_id);
  const aChoisir = enService.filter((a) => !a.choisi_par_lui);

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
        <span className="min-w-0 flex-1 truncate text-section font-semibold text-ink">
          {vue === 'membres' ? t('equipe.membresTitre') : data.entreprise.nom}
        </span>
        {/* La sortie. Elle était une icône d'immeuble sans texte, et Beau
            s'est retrouvé enfermé: « je n'arrive plus à sortir, je ne trouve
            pas le site pour revenir ». Une porte se montre, elle ne se
            devine pas. */}
        {vue === 'salons' && (
          <Link to="/apps" className="flex items-center gap-1 rounded-pill border border-hairline px-2 py-1 text-caption font-semibold text-muted">
            <IconArrowLeft size={14} /> Finjaro
          </Link>
        )}
        {vue === 'salons' && (
          <button onClick={() => setVue('membres')} className="text-caption font-semibold text-teal">
            {t('equipe.ecrireAUn')}
          </button>
        )}
      </header>

      {vue === 'membres' ? (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Le compte, et le bouton qui les fait tourner. Beau: « quand ils
              finissent, dis-moi combien d'agents j'aurai ». Donc on annonce
              toujours trois nombres: allumés, qui ont choisi, qui restent. */}
          <div className="rounded-card border border-hairline bg-white p-3">
            <p className="text-body font-semibold text-ink">
              {t('legion.bilanAgents', {
                total: sansMoi.length,
                allumes: enService.length,
                choisis: sansMoi.filter((a) => a.choisi_par_lui).length,
              })}
            </p>
            {aChoisir.length > 0 ? (
              <>
                <p className="mt-1 text-caption text-muted">{t('legion.choisirAide', { n: aChoisir.length })}</p>
                <button type="button" onClick={quIlsChoisissent} disabled={choisissent}
                  className="mt-2 rounded-pill bg-teal px-3 py-1.5 text-caption font-semibold text-white disabled:opacity-50">
                  {choisissent ? t('legion.ilsChoisissent') : t('legion.quIlsChoisissent')}
                </button>
              </>
            ) : (
              <p className="mt-1 text-caption text-muted">{t('legion.tousOntChoisi')}</p>
            )}
            {bilan && (
              <p className="mt-2 text-caption font-semibold text-teal">
                {t('legion.bilanChoix', { faits: bilan.faits, restants: bilan.restants })}
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => allumerTous(false)}
                className="rounded-pill border border-hairline px-3 py-1 text-caption text-muted">
                {t('legion.toutEteindre')}
              </button>
              <button type="button" onClick={() => allumerTous(true)}
                className="rounded-pill border border-hairline px-3 py-1 text-caption text-muted">
                {t('legion.toutRallumer')}
              </button>
            </div>
          </div>

          <p className="mt-4 text-caption font-semibold uppercase tracking-wider text-muted">
            {t('equipe.enService', { count: enService.length })}
            {' · '}{t('legion.metiersCount', { count: new Set(enService.map((a) => a.poste)).size })}
          </p>
          {enService.length > 60 ? (
            <ParMetier agents={enService} t={t} onClick={ouvrirPrive} />
          ) : (
            <ul className="mt-2 space-y-2">
              {enService.map((a) => <Carte key={a.id} a={a} onClick={() => ouvrirPrive(a)} onAutreTete={autreTete} onAllumer={allumer} />)}
            </ul>
          )}
          {enSommeil.length > 0 && (
            <>
              <p className="mt-6 flex items-center gap-1 text-caption font-semibold uppercase tracking-wider text-muted">
                <IconMoon size={13} /> {t('equipe.enSommeil', { count: enSommeil.length })}
              </p>
              <p className="mt-1 text-caption text-muted">{t('equipe.sommeilPourquoi')}</p>
              <ul className="mt-2 space-y-2">
                {enSommeil.map((a) => <Carte key={a.id} a={a} endormi onClick={() => ouvrirPrive(a)} onAutreTete={autreTete} onAllumer={allumer} />)}
              </ul>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Le bouton était caché derrière « Écrire à quelqu'un »: Beau ne
              l'a pas trouvé — « je ne vois pas de qu'ils choisissent
              eux-mêmes ». Une chose qu'on doit faire une fois se met sur le
              chemin, pas dans un sous-menu. Il disparaît quand c'est fait. */}
          {aChoisir.length > 0 && (
            <div className="border-b border-hairline bg-teal/10 px-4 py-2">
              <p className="text-caption font-semibold text-ink">
                {t('legion.choisirAide', { n: aChoisir.length })}
              </p>
              <button type="button" onClick={quIlsChoisissent} disabled={choisissent}
                className="mt-1.5 rounded-pill bg-teal px-3 py-1.5 text-caption font-semibold text-white disabled:opacity-50">
                {choisissent ? t('legion.ilsChoisissent') : t('legion.quIlsChoisissent')}
              </button>
              {bilan && (
                <p className="mt-1.5 text-caption font-semibold text-teal">
                  {t('legion.bilanChoix', { faits: bilan.faits, restants: bilan.restants })}
                </p>
              )}
            </div>
          )}

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
                        <button onClick={() => setParams({ canal: o.canal_id })}
                          className="min-w-0 flex-1 truncate text-left text-ink">
                          {agent(o.auteur_id)?.emoji || '•'} {o.texte}
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
              <button key={s.id} onClick={() => setParams({ canal: s.id })}
                className={`shrink-0 rounded-pill px-3 py-1 text-caption font-semibold ${
                  canal === s.id ? 'bg-teal text-white' : 'border border-hairline text-muted'}`}>
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
                  const a = agent(m.auteur_id);
                  const g = GENRES.find((x) => x.cle === m.genre);
                  const mes = data.reactions.filter((r) => r.message_id === m.id);
                  return (
                    <li key={m.id} className="flex gap-2">
                      <Visage a={a} taille={8} />
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
                                  {t('equipe.prisePar', { nom: agent(m.assigne_a)?.nom || '?' })}
                                </span>
                                <button onClick={() => majMessage(m.id, { termine_le: new Date().toISOString() })}
                                  className="inline-flex items-center gap-1 text-caption font-semibold text-teal">
                                  <IconCircleCheck size={14} /> {t('equipe.terminer')}
                                </button>
                              </>
                            ) : (
                              <button onClick={() => moi && majMessage(m.id, { assigne_a: moi.id })}
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

// La fiche de quelqu'un. Beau: « commençons d'abord par l'audit de chaque
// personne ». Donc on montre ce qui fait un collègue et pas une ligne de
// base: son visage, son poste, ce qu'il doit faire, et SA PERSONNALITÉ —
// comment il parle, ce qui l'agace, sa manie.
function Carte({ a, endormi, onClick, onAutreTete, onAllumer }) {
  const [change, setChange] = useState(false);
  async function autreTete(e) {
    e.stopPropagation();
    setChange(true);
    try { await onAutreTete(a); } finally { setChange(false); }
  }
  return (
    <li className={`rounded-card border border-hairline ${endormi ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3 p-3">
        <button onClick={autreTete} disabled={change}
          title="Une autre tête" aria-label="Une autre tête"
          className="shrink-0 rounded-card disabled:opacity-40">
          <Visage a={a} taille={12} />
        </button>
        <button onClick={onClick} className="min-w-0 flex-1 text-left">
          <span className="block text-body font-semibold text-ink">{a.nom}</span>
          <span className="block text-caption text-muted">{a.poste}</span>
          {a.mandat && <span className="mt-1 block text-caption text-muted">{a.mandat}</span>}
          {a.personnalite && (
            <span className="mt-1 block text-caption italic text-teal">{a.personnalite}</span>
          )}
          {/* Dire qui a choisi et qui ne l'a pas fait. Sans ça, Beau ne peut
              pas savoir si un agent a vraiment tourné — et il a demandé
              exactement cette question. */}
          <span className="mt-1 block text-caption text-muted">
            {a.choisi_par_lui ? '✓ il a choisi lui-même' : 'composé par défaut'}
          </span>
        </button>
        {onAllumer && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onAllumer(a, !!endormi); }}
            title={endormi ? 'Allumer' : 'Éteindre'} aria-label={endormi ? 'Allumer' : 'Éteindre'}
            className={`shrink-0 rounded-pill px-2 py-1 text-caption font-semibold ${
              endormi ? 'border border-hairline text-muted' : 'bg-teal/15 text-teal'}`}>
            {endormi ? 'Éteint' : 'Allumé'}
          </button>
        )}
      </div>
    </li>
  );
}

// Le visage d'un agent: sa photo s'il en a une (DiceBear au départ, une photo
// choisie ensuite), sinon son emoji sur sa couleur. Beau veut des agents
// « humanisés »: un nom ne suffit pas, il faut un visage.
function Visage({ a, taille = 8 }) {
  const cls = `mt-0.5 flex h-${taille} w-${taille} shrink-0 items-center justify-center overflow-hidden rounded-card text-caption`;
  if (a?.avatar_url) {
    return <img src={a.avatar_url} alt="" className={cls} style={{ backgroundColor: (a.couleur || '#C25E38') + '22' }} title={a?.poste} />;
  }
  return (
    <span className={cls} style={{ backgroundColor: (a?.couleur || '#C25E38') + '22' }} title={a?.poste}>
      {a?.emoji || '•'}
    </span>
  );
}

// Une grande entreprise se lit par métier, pas personne par personne. Les
// directeurs d'abord, puis chaque métier avec son effectif; on déplie pour
// voir les gens et écrire à l'un d'eux.
function ParMetier({ agents, t, onClick }) {
  const [ouvert, setOuvert] = useState(null);
  const groupes = useMemo(() => {
    const m = new Map();
    for (const a of agents) {
      const g = m.get(a.poste) || { poste: a.poste, departement: a.departement, gens: [], directeur: null };
      g.gens.push(a);
      if (a.est_directeur) g.directeur = a;
      m.set(a.poste, g);
    }
    // Directeurs d'abord, puis l'ordre du modèle (pas l'alphabet: « Métier 10 » avant « Métier 2 » serait absurde).
    return [...m.values()].sort((x, y) => (y.directeur ? 1 : 0) - (x.directeur ? 1 : 0)
      || (x.gens[0].ordre ?? 0) - (y.gens[0].ordre ?? 0) || x.poste.localeCompare(y.poste));
  }, [agents]);
  return (
    <ul className="mt-2 space-y-1">
      {groupes.map((g) => (
        <li key={g.poste} className="rounded-card border border-hairline bg-white">
          <button type="button" onClick={() => setOuvert(ouvert === g.poste ? null : g.poste)}
            className="flex w-full items-center gap-3 p-3 text-left">
            <Visage a={g.directeur || g.gens[0]} taille={9} />
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold text-ink">{g.directeur ? '★ ' : ''}{g.poste}</span>
              <span className="block text-caption text-muted">{g.departement} · {t('legion.personnes', { count: g.gens.length })}</span>
            </span>
          </button>
          {ouvert === g.poste && (
            <ul className="border-t border-hairline px-3 pb-2">
              {g.gens.slice(0, 50).map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => onClick(a)} className="flex w-full items-center gap-2 py-2 text-left">
                    <Visage a={a} taille={8} />
                    <span className="text-body text-ink">{a.nom}</span>
                  </button>
                </li>
              ))}
              {g.gens.length > 50 && <li className="py-1 text-caption text-muted">{t('legion.etPlusPersonnes', { n: g.gens.length - 50 })}</li>}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
