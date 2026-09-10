import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconShoppingBag, IconMessage2, IconGauge, IconDatabase, IconBrandWhatsapp, IconPhone,
  IconBellRinging, IconCircleCheck, IconRefresh,
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Price } from '../../components/Price';
import { Skeleton, ErrorState } from '../../components/states';
import { timeAgo } from '../../lib/format';

// Veille: tout ce qui attend une action, sur un seul écran, avec le bouton
// pour agir. Les automates (relance à 24 h, boutiques vides…) tournent déjà
// en coulisses; ici Beau VOIT ce qu'ils n'ont pas suffi à débloquer — et
// les contacts pour appeler lui-même, ce qu'il fait de toute façon.

function octets(n) {
  if (!n) return '0 Mo';
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} Go`;
  return `${Math.round(n / 1024 ** 2)} Mo`;
}

function attente(t, heures) {
  const h = Number(heures || 0);
  return h >= 48 ? t('admin.veille.waitingDays', { d: Math.floor(h / 24) }) : t('admin.veille.waitingHours', { h });
}

function Section({ icon: Icon, title, count, children, tone = 'ink' }) {
  const tones = { ink: 'text-ink', danger: 'text-danger', brass: 'text-brass', teal: 'text-teal' };
  return (
    <section>
      <h2 className={`mb-2 flex items-center gap-2 text-section ${tones[tone]}`}>
        <Icon size={20} className="shrink-0" />
        <span className="flex-1">{title}</span>
        {typeof count === 'number' && count > 0 && (
          <span className="rounded-pill bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">{count}</span>
        )}
      </h2>
      {children}
    </section>
  );
}

function Contacts({ t, tel, waLabel }) {
  if (!tel) return null;
  const num = String(tel).replace(/[^\d]/g, '');
  return (
    <div className="flex gap-2">
      <a
        href={`https://wa.me/${num}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-pill bg-success-bg px-2.5 py-1 text-caption font-semibold text-success"
      >
        <IconBrandWhatsapp size={14} /> {waLabel}
      </a>
      <a href={`tel:${tel}`} className="inline-flex items-center gap-1 rounded-pill bg-teal-light px-2.5 py-1 text-caption font-semibold text-teal">
        <IconPhone size={14} /> {t('admin.veille.call')}
      </a>
    </div>
  );
}

// Le bouton de relance connaît son état. Avant, il proposait indéfiniment
// « Relancer la vendeuse », même juste après un envoi réussi: Beau (10/09)
// « ça dit relance envoyée mais le message reste sur relancer la vendeuse ».
// Une relance de moins de six heures est donc affichée comme telle, et le
// bouton se referme — reprendre la même vendeuse dix fois d'affilée, de son
// côté, c'est du harcèlement.
const DELAI_RELANCE_H = 6;

function BoutonRelance({ t, lang, relanceeLe, busy, onClick }) {
  const heures = relanceeLe ? (Date.now() - new Date(relanceeLe).getTime()) / 3600000 : null;
  const recente = heures != null && heures < DELAI_RELANCE_H;
  if (recente) {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-success-bg px-3 py-1.5 text-caption font-semibold text-success">
        <IconCircleCheck size={14} /> {t('admin.veille.lastReminded', { when: timeAgo(relanceeLe, lang) })}
      </span>
    );
  }
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-pill bg-teal px-3 py-1.5 text-caption font-semibold text-white disabled:opacity-60"
    >
      <IconBellRinging size={14} /> {t(relanceeLe ? 'admin.veille.remindAgain' : 'admin.veille.remindVendor')}
    </button>
  );
}

export default function AdminVeille() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: v, error: err } = await supabase.rpc('admin_veille');
    if (err) throw err;
    return v;
  }, []);

  // `relancees` marque la ligne À L'INSTANT, sans attendre que le serveur
  // réponde à nouveau: le retour visuel doit suivre le clic, pas le réseau.
  // Le rechargement derrière confirme avec la vraie date.
  const [relancees, setRelancees] = useState({});

  async function relancer(fn, id, key) {
    setBusy(key);
    const { error: err } = await supabase.rpc(fn, id);
    setBusy(null);
    if (err) return toast.error(err.message);
    setRelancees((r) => ({ ...r, [key]: new Date().toISOString() }));
    toast.success(t('admin.veille.reminded'));
    retry();
  }

  if (loading) return <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  const commandes = data?.commandes_bloquees || [];
  const convs = data?.conversations_sans_reponse || [];
  const vitesse = data?.vitesse || {};
  const stock = data?.stockage || {};
  const pct = stock.limite_octets ? Math.min(100, Math.round((100 * (stock.total_octets || 0)) / stock.limite_octets)) : 0;
  const lcp = vitesse.lcp_median_ms != null ? Math.round(vitesse.lcp_median_ms) : null;
  const verdict = lcp == null ? null : lcp < 2500 ? 'good' : lcp < 4000 ? 'medium' : 'slow';
  const verdictClass = { good: 'text-success', medium: 'text-brass', slow: 'text-danger' };
  const rienATraiter = commandes.length === 0 && convs.length === 0;

  return (
    <div className="space-y-7 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-caption text-muted">{t('admin.veille.intro')}</p>
        <button type="button" onClick={retry} aria-label={t('common.retry')} className="shrink-0 rounded-full p-1.5 text-muted hover:text-ink">
          <IconRefresh size={18} />
        </button>
      </div>

      {rienATraiter && (
        <div className="flex items-center gap-2 rounded-card border border-success/30 bg-success-bg p-3 text-body font-semibold text-success">
          <IconCircleCheck size={20} /> {t('admin.veille.allGood')}
        </div>
      )}

      <Section icon={IconShoppingBag} title={t('admin.veille.stuckOrders')} count={commandes.length} tone={commandes.length ? 'danger' : 'ink'}>
        {commandes.length === 0 ? (
          <p className="text-caption text-muted">{t('admin.veille.stuckOrdersEmpty')}</p>
        ) : (
          <ul className="space-y-2">
            {commandes.map((c) => (
              <li key={c.id} className="rounded-card border border-danger/30 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-ink">#{c.order_no} · <Price fcfa={c.total_fcfa} /></p>
                    <p className="text-caption text-muted">{c.boutique}{c.vendeuse ? ` — ${c.vendeuse}` : ''}</p>
                  </div>
                  <span className="shrink-0 rounded-pill bg-danger-bg px-2 py-0.5 text-[11px] font-semibold text-danger">{attente(t, c.heures)}</span>
                </div>
                <p className="mt-1.5 text-caption text-ink">
                  {t('admin.veille.buyer')} : <span className="font-semibold">{c.acheteur || '—'}</span>
                  {c.acheteur_tel ? ` · ${c.acheteur_tel}` : ''}{c.acheteur_email ? ` · ${c.acheteur_email}` : ''}
                </p>
                <p className="text-[11px] text-muted">
                  {relancees[c.id] || c.relancee_le
                    ? t('admin.veille.lastReminded', { when: timeAgo(relancees[c.id] || c.relancee_le, i18n.language) })
                    : t('admin.veille.neverReminded')}
                  {c.escaladee_le && ` · ${t('admin.veille.escalated', { when: timeAgo(c.escaladee_le, i18n.language) })}`}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <BoutonRelance
                    t={t}
                    lang={i18n.language}
                    relanceeLe={relancees[c.id] || c.relancee_le}
                    busy={busy === c.id}
                    onClick={() => relancer('admin_relancer_commande', { p_order_id: c.id }, c.id)}
                  />
                  <Contacts t={t} tel={c.vendeuse_tel} waLabel={t('admin.veille.vendorWhatsapp')} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section icon={IconMessage2} title={t('admin.veille.unanswered')} count={convs.length} tone={convs.length ? 'brass' : 'ink'}>
        {convs.length === 0 ? (
          <p className="text-caption text-muted">{t('admin.veille.unansweredEmpty')}</p>
        ) : (
          <ul className="space-y-2">
            {convs.map((c) => (
              <li key={c.conversation_id} className="rounded-card border border-brass/30 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-ink">{c.boutique}{c.vendeuse ? ` — ${c.vendeuse}` : ''}</p>
                    <p className="text-caption text-muted">{t('admin.veille.buyer')} : {c.acheteur || '—'}</p>
                  </div>
                  <span className="shrink-0 rounded-pill bg-brass/15 px-2 py-0.5 text-[11px] font-semibold text-brass">{attente(t, c.heures)}</span>
                </div>
                {c.dernier_message && <p className="mt-1.5 line-clamp-2 text-caption italic text-ink">« {c.dernier_message} »</p>}
                <p className="mt-1 text-[11px] text-muted">
                  {relancees[c.conversation_id] || c.relancee_le
                    ? t('admin.veille.lastReminded', { when: timeAgo(relancees[c.conversation_id] || c.relancee_le, i18n.language) })
                    : t('admin.veille.neverReminded')}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <BoutonRelance
                    t={t}
                    lang={i18n.language}
                    relanceeLe={relancees[c.conversation_id] || c.relancee_le}
                    busy={busy === c.conversation_id}
                    onClick={() => relancer('admin_relancer_conversation', { p_conversation_id: c.conversation_id }, c.conversation_id)}
                  />
                  <Contacts t={t} tel={c.vendeuse_tel} waLabel={t('admin.veille.vendorWhatsapp')} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section icon={IconGauge} title={t('admin.veille.speed')} tone="ink">
        {!vitesse.mesures ? (
          <p className="text-caption text-muted">{t('admin.veille.noSpeed')}</p>
        ) : (
          <div className="rounded-card border border-hairline bg-white p-3">
            <p className="text-caption text-muted">{t('admin.veille.speedMeasures', { n: vitesse.mesures })}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-[28px] font-bold leading-none ${verdictClass[verdict] || 'text-ink'}`}>{lcp != null ? `${(lcp / 1000).toFixed(1)} s` : '—'}</span>
              <span className="text-caption text-muted">{t('admin.veille.lcpMedian')}</span>
            </div>
            {verdict && <p className={`mt-1 text-caption font-semibold ${verdictClass[verdict]}`}>{t(`admin.veille.verdict_${verdict}`)}</p>}
            {vitesse.lcp_p90_ms != null && (
              <p className="text-caption text-muted">{t('admin.veille.lcpP90', { s: (vitesse.lcp_p90_ms / 1000).toFixed(1) })}</p>
            )}
            {vitesse.par_connexion?.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{t('admin.veille.byConnection')}</p>
                <ul className="divide-y divide-hairline">
                  {vitesse.par_connexion.map((r) => (
                    <li key={r.connexion} className="flex items-center justify-between py-1 text-caption">
                      <span className="text-ink">{r.connexion} <span className="text-muted">× {r.n}</span></span>
                      <span className="font-semibold text-ink">{r.lcp_median_ms != null ? `${(r.lcp_median_ms / 1000).toFixed(1)} s` : '—'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {vitesse.pages_lentes?.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{t('admin.veille.slowPages')}</p>
                <ul className="divide-y divide-hairline">
                  {vitesse.pages_lentes.map((r) => (
                    <li key={r.chemin} className="flex items-center justify-between py-1 text-caption">
                      <span className="truncate text-ink">{r.chemin} <span className="text-muted">× {r.n}</span></span>
                      <span className="shrink-0 font-semibold text-ink">{(r.charge_median_ms / 1000).toFixed(1)} s</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section icon={IconDatabase} title={t('admin.veille.storage')} tone="ink">
        <div className="rounded-card border border-hairline bg-white p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-body font-semibold text-ink">{t('admin.veille.storageUsed', { used: octets(stock.total_octets), limit: octets(stock.limite_octets) })}</span>
            <span className={`text-caption font-semibold ${pct >= 80 ? 'text-danger' : pct >= 50 ? 'text-brass' : 'text-success'}`}>{pct} %</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-hairline">
            <div className={`h-full rounded-full ${pct >= 80 ? 'bg-danger' : pct >= 50 ? 'bg-brass' : 'bg-success'}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-caption text-muted">
            {t('admin.veille.storageVideos', { n: stock.nb_videos || 0, size: octets(stock.videos_octets) })} · {t('admin.veille.storageWeek', { size: octets(stock.ajoutes_7j_octets) })}
          </p>
          {pct >= 80 && <p className="mt-1 text-caption font-semibold text-danger">{t('admin.veille.storageAlert')}</p>}
        </div>
      </Section>
    </div>
  );
}
