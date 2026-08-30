import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSend, IconMessage2, IconMailOpened, IconClock, IconBuildingStore, IconPhoto, IconUserPlus } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { TextArea } from '../../components/Field';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

const ONGLETS = ['a_relancer', 'envoyees', 'repondu'];

// Pourquoi cette personne apparaît dans la liste. L'ordre compte: on cherche
// d'abord ce qui est le plus proche d'aboutir.
const MOTIFS = {
  // Elle a chargé des photos et n'en a fait aucun article: le travail est
  // déjà fait à moitié, c'est la relance la plus rentable.
  photos_orphelines: { Icon: IconPhoto, classe: 'bg-brass/15 text-brass' },
  // Boutique ouverte, catalogue vide.
  boutique_vide: { Icon: IconBuildingStore, classe: 'bg-warning-bg text-warning' },
  // Compte créé, pas même une boutique.
  sans_boutique: { Icon: IconUserPlus, classe: 'bg-teal-light text-teal' },
  manuel: { Icon: IconMessage2, classe: 'bg-base text-muted' },
};

// Le suivi des relances — et surtout des réponses.
//
// Quatre vraies inscriptions la semaine du 25/08, trois boutiques ouvertes,
// UNE SEULE personne qui a publié un article. Les autres s'arrêtent juste
// avant. Beau leur écrit un par un sur WhatsApp et perd le fil: qui a été
// relancé, qui a lu, qui a répondu quoi.
//
// Une relance est un ALLER-RETOUR. Elle part dans la cloche — le seul canal
// qui atteint TOUT compte, y compris ceux créés par téléphone sans e-mail —
// et la personne répond dans l'application, sans quitter Finjaro.
//
// RÈGLE: on ne réécrit pas à quelqu'un qui n'a pas encore répondu. La liste
// « à relancer » exclut donc toute personne ayant une relance en attente.
export default function AdminRelances() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [onglet, setOnglet] = useState('a_relancer');
  const [brouillons, setBrouillons] = useState({});
  const [busy, setBusy] = useState(null);

  const { data, loading, error, retry } = useAsync(async () => {
    const [relRes, shopsRes, profRes] = await Promise.all([
      supabase.from('relances').select('*').order('envoye_le', { ascending: false }),
      supabase.from('shops').select('id, name, slug, owner_id, created_at').eq('status', 'active'),
      supabase.from('profiles').select('id, name, phone, created_at'),
    ]);
    if (relRes.error) throw relRes.error;
    if (shopsRes.error) throw shopsRes.error;

    const relances = relRes.data || [];
    const boutiques = shopsRes.data || [];
    const profils = Object.fromEntries((profRes.data || []).map((p) => [p.id, p]));

    // Combien d'articles par boutique — une seule requête, jamais une par
    // boutique.
    const { data: prods } = await supabase.from('products').select('shop_id');
    const parBoutique = {};
    for (const p of prods || []) parBoutique[p.shop_id] = (parBoutique[p.shop_id] || 0) + 1;

    // Qui attend déjà une réponse: on ne le relance pas une deuxième fois.
    const enAttente = new Set(relances.filter((r) => !r.reponse).map((r) => r.user_id));

    const cibles = [];
    for (const s of boutiques) {
      if ((parBoutique[s.id] || 0) > 0) continue;
      if (enAttente.has(s.owner_id)) continue;
      cibles.push({
        user_id: s.owner_id,
        shop_id: s.id,
        nom: profils[s.owner_id]?.name || '—',
        boutique: s.name,
        motif: 'boutique_vide',
        depuis: s.created_at,
      });
    }
    // Comptes sans la moindre boutique.
    const proprietaires = new Set(boutiques.map((s) => s.owner_id));
    for (const p of Object.values(profils)) {
      if (proprietaires.has(p.id) || enAttente.has(p.id)) continue;
      cibles.push({
        user_id: p.id,
        shop_id: null,
        nom: p.name || '—',
        boutique: null,
        motif: 'sans_boutique',
        depuis: p.created_at,
      });
    }
    cibles.sort((a, b) => new Date(b.depuis) - new Date(a.depuis));

    return { relances, cibles, profils };
  }, []);

  async function envoyer(cible) {
    const cle = `n-${cible.user_id}`;
    const texte = (brouillons[cle] || '').trim();
    if (!texte) return;
    setBusy(cle);
    const { data: ligne, error: err } = await supabase
      .from('relances')
      .insert({
        user_id: cible.user_id,
        shop_id: cible.shop_id,
        motif: cible.motif,
        message: texte,
        envoye_par: user.id,
      })
      .select('id')
      .single();
    if (err) { setBusy(null); return toast.error(err.message); }

    // Sans la cloche, on aurait juste écrit dans une base de données.
    const { error: notifErr } = await supabase.from('notifications').insert({
      user_id: cible.user_id,
      type: 'relance',
      title: t('admin.relanceNotifTitle'),
      body: texte.slice(0, 300),
      data: { relance_id: ligne.id },
    });
    setBusy(null);
    if (notifErr) return toast.error(notifErr.message);
    setBrouillons((b) => ({ ...b, [cle]: '' }));
    toast.success(t('admin.relanceSent'));
    retry();
  }

  if (loading) return <div className="space-y-3 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  const envoyees = data.relances.filter((r) => !r.reponse);
  const repondu = data.relances.filter((r) => r.reponse);
  const comptes = { a_relancer: data.cibles.length, envoyees: envoyees.length, repondu: repondu.length };

  return (
    <div className="space-y-3 p-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {ONGLETS.map((o) => (
          <button key={o} onClick={() => setOnglet(o)} className={`chip shrink-0 ${onglet === o ? 'chip-active' : 'text-ink'}`}>
            {t(`admin.relanceTab.${o}`)}
            {comptes[o] > 0 && <span className="ml-1 font-semibold">({comptes[o]})</span>}
          </button>
        ))}
      </div>

      {onglet === 'a_relancer' && (
        data.cibles.length === 0 ? (
          <EmptyState icon={IconMessage2} title={t('admin.relanceNoTargets')} />
        ) : (
          <ul className="space-y-3">
            {data.cibles.map((c) => {
              const m = MOTIFS[c.motif] || MOTIFS.manuel;
              const cle = `n-${c.user_id}`;
              return (
                <li key={c.user_id} className="rounded-card border border-hairline p-3">
                  <div className="flex items-start gap-2">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.classe}`}>
                      <m.Icon size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-semibold text-ink">{c.nom}</p>
                      <p className="truncate text-caption text-muted">
                        {c.boutique ? c.boutique : t('admin.relanceNoShop')} · {t(`admin.relanceMotif.${c.motif}`)}
                      </p>
                      <p className="text-caption text-muted">{t('admin.relanceSince', { quand: timeAgo(c.depuis, i18n.language) })}</p>
                    </div>
                  </div>
                  <TextArea
                    rows={3}
                    className="mt-2"
                    placeholder={t(`admin.relanceModele.${c.motif}`, { nom: c.nom, boutique: c.boutique || '' })}
                    value={brouillons[cle] ?? t(`admin.relanceModele.${c.motif}`, { nom: c.nom, boutique: c.boutique || '' })}
                    onChange={(e) => setBrouillons((b) => ({ ...b, [cle]: e.target.value }))}
                  />
                  <Button className="mt-2" loading={busy === cle} onClick={() => envoyer(c)}>
                    <IconSend size={18} /> {t('admin.relanceSend')}
                  </Button>
                </li>
              );
            })}
          </ul>
        )
      )}

      {onglet === 'envoyees' && (
        envoyees.length === 0 ? (
          <EmptyState icon={IconClock} title={t('admin.relanceNoneSent')} />
        ) : (
          <ul className="space-y-3">
            {envoyees.map((r) => (
              <li key={r.id} className="rounded-card border border-hairline p-3">
                <div className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${r.lu_le ? 'bg-teal-light text-teal' : 'bg-base text-muted'}`}>
                    {r.lu_le ? <IconMailOpened size={17} /> : <IconClock size={17} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-semibold text-ink">{data.profils[r.user_id]?.name || '—'}</p>
                    {/* Lu ou pas lu: c'est la seule chose qui dit s'il faut
                        insister ou changer de canal. */}
                    <p className="text-caption text-muted">
                      {r.lu_le ? t('admin.relanceRead', { quand: timeAgo(r.lu_le, i18n.language) }) : t('admin.relanceUnread')}
                      {' · '}
                      {timeAgo(r.envoye_le, i18n.language)}
                    </p>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap rounded-card bg-base p-2 text-caption text-ink">{r.message}</p>
              </li>
            ))}
          </ul>
        )
      )}

      {onglet === 'repondu' && (
        repondu.length === 0 ? (
          <EmptyState icon={IconMessage2} title={t('admin.relanceNoReplies')} />
        ) : (
          <ul className="space-y-3">
            {repondu.map((r) => (
              <li key={r.id} className="rounded-card border border-hairline p-3">
                <p className="text-body font-semibold text-ink">{data.profils[r.user_id]?.name || '—'}</p>
                <p className="mt-2 whitespace-pre-wrap rounded-card bg-base p-2 text-caption text-muted">{r.message}</p>
                {/* La réponse est ce qu'on est venu lire: elle se détache. */}
                <p className="mt-2 whitespace-pre-wrap rounded-card border border-teal/30 bg-teal-light p-2 text-caption text-ink">
                  {r.reponse}
                </p>
                <p className="mt-1 text-caption text-muted">{timeAgo(r.repondu_le, i18n.language)}</p>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
