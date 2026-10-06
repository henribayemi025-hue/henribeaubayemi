import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconShoppingBag, IconTruckDelivery, IconBuildingStore, IconPhone, IconMessageCircle } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { Price } from '../../components/Price';
import { OrderStatusBadge, orderAccentColor } from '../../components/OrderStatusBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

const TABS = [
  { key: 'all', statuses: null },
  // Sans cet onglet, une commande en attente de prix n'apparaîtrait que dans
  // « Toutes » — invisible là où l'équipe regarde.
  { key: 'quotes', statuses: ['awaiting_price', 'priced'] },
  { key: 'new', statuses: ['new'] },
  { key: 'inProgress', statuses: ['confirmed', 'shipped'] },
  { key: 'delivered', statuses: ['delivered'] },
  { key: 'cancelled', statuses: ['cancelled'] },
];

// Toutes les commandes de la plateforme, toutes boutiques confondues. En
// lecture seule volontairement: faire avancer une commande reste le geste de
// la boutique qui la prépare — l'administration observe et arbitre, elle ne
// se substitue pas à la vendeuse.
export default function AdminOrders() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState('all');
  // Beau, 22/09: « pourquoi il y a toujours les nouveaux orders là ? » — la
  // liste mêlait les commandes des comptes de test (sa boutique d'essai,
  // les essais de Claude) aux vraies. Cachées par défaut, un interrupteur
  // les montre.
  const [avecTests, setAvecTests] = useState(false);

  const { data, loading, error, retry } = useAsync(async () => {
    const [{ data: rows, error: err }, { data: tests }, { data: msgs }] = await Promise.all([
      supabase
        .from('orders')
        .select('id, order_no, status, total_fcfa, created_at, buyer_id, buyer_name, buyer_phone, delivery_method, city, cancel_reason, shops(name, owner_id), order_items(name, qty)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('profiles').select('id').eq('is_test', true),
      // Avant la migration 0233, la table n'existe pas : la liste s'affiche quand même.
      supabase.from('commande_messages_finjaro').select('order_id, texte, created_at').order('created_at'),
    ]);
    if (err) throw err;
    const testIds = new Set((tests || []).map((p) => p.id));
    const parCommande = {};
    for (const m of msgs || []) (parCommande[m.order_id] ||= []).push(m);
    return (rows || []).map((o) => ({ ...o, messages: parCommande[o.id] || [], est_test: testIds.has(o.buyer_id) || testIds.has(o.shops?.owner_id) }));
  }, []);

  if (loading) return <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  const visibles = (data || []).filter((o) => avecTests || !o.est_test);
  const nbTests = (data || []).filter((o) => o.est_test).length;
  const countFor = (tb) => (tb.statuses ? visibles.filter((o) => tb.statuses.includes(o.status)).length : visibles.length);
  const current = TABS.find((x) => x.key === tab);
  const list = current.statuses ? visibles.filter((o) => current.statuses.includes(o.status)) : visibles;
  // Beau, 28/09 (capture): « 3 commandes · 32,01 € », dont une REFUSÉE depuis
  // le 4 septembre. Le total additionnait de l'argent qui n'existe pas — le
  // genre de chiffre qui se gonfle tout seul, exactement ce qu'on ne montre
  // pas. On ne compte plus que ce qui est encore vivant, et on dit ce qu'on a
  // écarté. Sur l'onglet « Annulées », où l'on demande justement à les voir,
  // on les compte: c'est la question posée.
  const comptees = tab === 'cancelled' ? list : list.filter((o) => o.status !== 'cancelled');
  const total = comptees.reduce((n, o) => n + (o.total_fcfa || 0), 0);
  const ecartees = list.length - comptees.length;

  return (
    <div className="space-y-3 p-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} className={`chip shrink-0 ${tab === tb.key ? 'chip-active' : 'text-ink'}`}>
            {t(`admin.orderTabs.${tb.key}`)}
            <span className="ml-1 font-semibold">({countFor(tb)})</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 rounded-card bg-base px-3 py-2.5">
        <span className="text-caption text-muted">{t('admin.selectionTotal', { count: list.length })}</span>
        {nbTests > 0 && (
          <label className="flex items-center gap-1.5 text-caption text-muted">
            <input type="checkbox" checked={avecTests} onChange={(e) => setAvecTests(e.target.checked)} />
            {t('admin.voirTests', { count: nbTests, defaultValue: 'voir les tests ({{count}})' })}
          </label>
        )}
        <div className="text-right">
          <Price fcfa={total} className="text-section font-semibold text-teal" />
          {ecartees > 0 && (
            <p className="text-[11px] text-muted">{t('admin.horsAnnulees', { count: ecartees, defaultValue: 'hors {{count}} annulée' })}</p>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={IconShoppingBag} title={t('admin.noOrders')} />
      ) : (
        <ul className="space-y-2">
          {list.map((o) => (
            <li key={o.id} className={`card !rounded-l-none border-l-4 ${orderAccentColor(o.status, o.delivery_method)}`}>
              {/* `flex-wrap`: quand le libellé de statut est long ("En attente
                  de validation"), il passe à la ligne entier au lieu de se
                  couper en deux et d'écraser le nom de la boutique. */}
              <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold text-ink">#{o.order_no} · {o.shops?.name || '—'}</p>
                  <p className="text-caption text-muted">{timeAgo(o.created_at, i18n.language)}</p>
                </div>
                <OrderStatusBadge status={o.status} method={o.delivery_method} />
              </div>

              <p className="mt-2 truncate text-caption text-muted">
                {(o.order_items || []).map((it) => `${it.name} ×${it.qty}`).join(', ') || '—'}
              </p>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-caption text-muted">
                  {o.delivery_method === 'pickup' ? <IconBuildingStore size={14} className="shrink-0" /> : <IconTruckDelivery size={14} className="shrink-0" />}
                  <span className="truncate">{o.buyer_name || '—'}{o.city ? ` · ${o.city}` : ''}</span>
                </span>
                <Price fcfa={o.total_fcfa} className="shrink-0 text-body font-semibold text-teal" />
              </div>

              {o.buyer_phone && (
                <a href={`tel:${o.buyer_phone.replace(/[^+\d]/g, '')}`} className="mt-1 flex items-center gap-1 text-caption font-semibold text-teal">
                  <IconPhone size={13} /> {o.buyer_phone}
                </a>
              )}
              {o.status === 'cancelled' && o.cancel_reason && (
                <p className="mt-2 rounded-input bg-danger-bg p-2 text-caption text-danger">{o.cancel_reason}</p>
              )}
              {!o.buyer_id && <MessageAcheteur commande={o} onEnvoye={retry} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Beau, 06/10 : « si on envoie un message à un acheteur, c'est via Finjaro,
// moi je n'envoie plus via WhatsApp ». Pour une commande SANS compte, le
// message s'affiche en haut de sa page « Ma commande » (0233) la prochaine
// fois qu'il l'ouvre. Rien ne part par WhatsApp, SMS ou e-mail.
function MessageAcheteur({ commande, onEnvoye }) {
  const { t, i18n } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const envoyer = async () => {
    if (!texte.trim()) return;
    setEnvoi(true);
    setErreur('');
    const { error } = await supabase.rpc('finjaro_ecrire_acheteur', { p_order: commande.id, p_texte: texte.trim() });
    setEnvoi(false);
    if (error) { setErreur(error.message); return; }
    setTexte('');
    setOuvert(false);
    onEnvoye?.();
  };

  return (
    <div className="mt-2 border-t border-hairline pt-2">
      {commande.messages.map((m, i) => (
        <p key={i} className="mb-1 rounded-input bg-teal-light p-2 text-caption text-ink">
          <span className="whitespace-pre-line">{m.texte}</span>
          <span className="block text-[11px] text-muted">{t('admin.messageEnvoye', { quand: timeAgo(m.created_at, i18n.language), defaultValue: 'Message de Finjaro · {{quand}}' })}</span>
        </p>
      ))}
      {ouvert ? (
        <div className="space-y-1.5">
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            maxLength={1000}
            rows={3}
            className="input w-full text-caption"
            placeholder={t('admin.messagePlaceholder', { name: commande.buyer_name || '', defaultValue: 'Bonjour {{name}}, …' })}
            aria-label={t('admin.messageLabel', 'Message de Finjaro à l’acheteur')}
          />
          <p className="text-[11px] text-muted">{t('admin.messageAide', 'Il s’affichera en haut de sa page « Ma commande », la prochaine fois qu’il l’ouvrira.')}</p>
          {erreur && <p className="text-caption text-danger">{erreur}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={envoyer} disabled={envoi || !texte.trim()} className="btn-primary !py-1.5 text-caption">
              {envoi ? t('admin.envoi', 'Envoi…') : t('admin.envoyer', 'Envoyer')}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className="btn-ghost !py-1.5 text-caption">{t('common.cancel', 'Annuler')}</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOuvert(true)} className="flex items-center gap-1 text-caption font-semibold text-teal">
          <IconMessageCircle size={13} /> {t('admin.ecrireAcheteur', 'Écrire à l’acheteur (page « Ma commande »)')}
        </button>
      )}
    </div>
  );
}
