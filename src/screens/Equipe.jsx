import { useState, useEffect, useRef } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSend, IconUsers, IconAlertCircle } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../hooks/useToast';
import { Skeleton, ErrorState, EmptyState } from '../components/states';

// L'équipe Finjaro, sur le téléphone de Beau.
//
// Beau, 22/09: « je veux une équipe permanente. Chacun a un nom, chacun a un
// poste vraiment prédéfini. Une messagerie que je peux avoir sur mon
// téléphone, où je vois comment vous interagissez, et dès qu'il y a une
// notification je peux envoyer un message. »
//
// Et le reproche, qui est juste: « il n'y a personne qui me demande où est-ce
// que tu en es avec le marketing. Il n'y a aucune idée innovante depuis que
// je travaille avec toi. »
//
// Ce que cet écran change, concrètement:
//
//   - Alpha et Claudinette se parlaient par messages privés entre sessions.
//     Beau ne les voyait JAMAIS. Il ne savait pas ce qui se décidait.
//   - Les Claude de Chrome écrivent dans une issue GitHub PUBLIQUE, qui ne
//     le prévient de rien.
//
// Ici tout le monde écrit au même endroit, il lit, il répond, il est
// prévenu. Et surtout: ce qui ATTEND une réponse de lui est remonté en haut,
// au lieu d'être noyé dans le flux.
//
// ⚠️ Réservé à l'équipe. La règle de lecture exige `is_admin()` en base — cet
// écran n'est que la porte, la serrure est côté serveur.

const GENRES = {
  question: { emoji: '❓', classe: 'bg-brass/15 text-brass' },
  decision: { emoji: '⚖️', classe: 'bg-danger-bg text-danger' },
  proposition: { emoji: '💡', classe: 'bg-teal-light text-teal' },
  info: { emoji: '', classe: '' },
};

function quandExactement(iso, langue) {
  const d = new Date(iso);
  const minutes = Math.round((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 60 * 24) return `il y a ${Math.round(minutes / 60)} h`;
  return d.toLocaleDateString(langue, { day: 'numeric', month: 'short' });
}

export default function Equipe() {
  const { t, i18n } = useTranslation();
  const { user, profile, loading: authLoading } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const canal = params.get('canal') || 'direction';
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const bas = useRef(null);

  const { data, loading, error, retry, setData } = useAsync(async () => {
    if (!profile?.is_admin) return null;
    const [agents, salons, messages] = await Promise.all([
      supabase.from('team_agents').select('*').eq('actif', true).order('ordre'),
      supabase.from('team_channels').select('*').order('ordre'),
      supabase.from('team_messages').select('*').eq('canal', canal).order('created_at').limit(200),
    ]);
    if (messages.error) throw messages.error;

    // Ce qui attend Beau, TOUS salons confondus: une question sans réponse
    // n'est pas moins urgente parce qu'elle est dans un autre salon.
    const { data: ouverts } = await supabase
      .from('team_messages')
      .select('id, canal, auteur, texte, genre, created_at')
      .in('genre', ['question', 'decision'])
      .is('repondu_le', null)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      agents: agents.data || [],
      salons: salons.data || [],
      messages: messages.data || [],
      ouverts: ouverts || [],
    };
  }, [profile?.is_admin, canal], { cacheKey: `equipe:${canal}` });

  // Les nouveaux messages arrivent sans recharger: un agent peut écrire
  // pendant que l'écran est ouvert.
  useEffect(() => {
    if (!profile?.is_admin) return undefined;
    const abo = supabase
      .channel(`equipe:${canal}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `canal=eq.${canal}` },
        (charge) => {
          setData((d) => (d ? { ...d, messages: [...d.messages, charge.new] } : d));
        })
      .subscribe();
    return () => { supabase.removeChannel(abo); };
  }, [canal, profile?.is_admin, setData]);

  useEffect(() => {
    bas.current?.scrollIntoView({ block: 'end' });
  }, [data?.messages?.length]);

  if (authLoading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  // La serrure est en base; ceci évite juste d'afficher une page vide.
  if (!user || !profile?.is_admin) return <Navigate to="/" replace />;
  if (loading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (error) return <ErrorState onRetry={retry} />;
  if (!data) return null;

  const agent = (cle) => data.agents.find((a) => a.cle === cle);
  const moi = data.agents.find((a) => a.user_id === user.id);

  async function envoyer() {
    const corps = texte.trim();
    if (!corps || !moi) return;
    setEnvoi(true);
    try {
      const { data: ligne, error: err } = await supabase.from('team_messages').insert({
        canal, auteur: moi.cle, user_id: user.id, texte: corps, genre: 'info',
      }).select().single();
      if (err) throw err;
      setTexte('');
      setData((d) => (d ? { ...d, messages: [...d.messages, ligne] } : d));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setEnvoi(false); }
  }

  async function marquerRepondu(id) {
    try {
      await supabase.from('team_messages').update({ repondu_le: new Date().toISOString() }).eq('id', id);
      setData((d) => (d ? { ...d, ouverts: d.ouverts.filter((o) => o.id !== id) } : d));
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }

  return (
    <div className="flex h-dvh flex-col bg-base">
      <header className="flex items-center gap-2 border-b border-hairline bg-white px-4 py-3">
        <IconUsers size={20} className="text-teal" />
        <span className="text-section font-semibold text-ink">{t('equipe.titre')}</span>
        <span className="ml-auto text-caption text-muted">
          {t('equipe.membres', { count: data.agents.filter((a) => !a.user_id).length })}
        </span>
      </header>

      {/* Ce qui attend Beau. En HAUT, et tous salons confondus — sinon une
          question posée dans « marketing » se perd pendant qu'il lit
          « produit ». C'est la raison d'être de cet écran. */}
      {data.ouverts.length > 0 && (
        <div className="border-b border-hairline bg-brass/10 px-4 py-2">
          <p className="flex items-center gap-1 text-caption font-semibold text-ink">
            <IconAlertCircle size={14} /> {t('equipe.tAttendent', { count: data.ouverts.length })}
          </p>
          <ul className="mt-1 space-y-1">
            {data.ouverts.slice(0, 3).map((o) => (
              <li key={o.id} className="flex items-start gap-2 text-caption">
                <button
                  onClick={() => setParams({ canal: o.canal })}
                  className="min-w-0 flex-1 truncate text-left text-ink underline-offset-2 hover:underline"
                >
                  {agent(o.auteur)?.emoji} {o.texte}
                </button>
                <button onClick={() => marquerRepondu(o.id)} className="shrink-0 font-semibold text-teal">
                  {t('equipe.regle')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Les salons */}
      <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-b border-hairline bg-white px-4 py-2">
        {data.salons.map((s) => (
          <button
            key={s.cle}
            onClick={() => setParams({ canal: s.cle })}
            className={`shrink-0 rounded-pill px-3 py-1 text-caption font-semibold ${
              canal === s.cle ? 'bg-teal text-white' : 'border border-hairline text-muted'
            }`}
          >
            {s.emoji} {s.nom}
          </button>
        ))}
      </div>

      {/* Les messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {data.messages.length === 0 ? (
          <EmptyState
            title={t('equipe.vide')}
            hint={data.salons.find((s) => s.cle === canal)?.a_quoi_ca_sert}
          />
        ) : (
          <ul className="space-y-3">
            {data.messages.map((m) => {
              const a = agent(m.auteur);
              const g = GENRES[m.genre] || GENRES.info;
              return (
                <li key={m.id} className="flex gap-2">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-card text-caption"
                    style={{ backgroundColor: (a?.couleur || '#C25E38') + '22' }}
                    title={a?.poste}
                  >
                    {a?.emoji || '•'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-caption font-semibold text-ink">{a?.nom || m.auteur}</span>
                      <span className="text-caption text-muted">{quandExactement(m.created_at, i18n.language)}</span>
                      {m.genre !== 'info' && (
                        <span className={`rounded-pill px-2 py-0.5 text-caption font-semibold ${g.classe}`}>
                          {g.emoji} {t(`equipe.genre.${m.genre}`)}
                        </span>
                      )}
                    </p>
                    <p className="whitespace-pre-wrap break-words text-body text-ink">{m.texte}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bas} />
      </div>

      {/* Répondre */}
      <form
        onSubmit={(e) => { e.preventDefault(); envoyer(); }}
        className="flex shrink-0 items-center gap-2 border-t border-hairline bg-white px-4 py-3"
      >
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder={t('equipe.ecrire')}
          aria-label={t('equipe.ecrire')}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={envoi || texte.trim() === '' || !moi}
          aria-label={t('equipe.envoyer')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-input bg-teal text-white disabled:bg-hairline disabled:text-muted"
        >
          <IconSend size={18} />
        </button>
      </form>
    </div>
  );
}
