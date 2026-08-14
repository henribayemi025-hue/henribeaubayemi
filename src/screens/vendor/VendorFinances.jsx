import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconArrowUpRight, IconArrowDownRight, IconWallet, IconHourglassHigh,
  IconShoppingBag, IconReceipt, IconCircleCheck, IconCircleX, IconClock,
  IconDownload,
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { AppHeader } from '../../components/AppHeader';
import { VendorPrice } from '../../components/Price';
import { Skeleton, ErrorState } from '../../components/states';
import { Button } from '../../components/Button';
import { currencyForCountry, convertFromFcfa } from '../../lib/currency';

const PERIODS = [
  { key: '7d', days: 7, label: 'stats.period7d' },
  { key: '30d', days: 30, label: 'stats.period30d' },
  { key: '3m', days: 90, label: 'stats.period3m' },
  { key: '1y', days: 365, label: 'stats.period1y' },
];

function pct(cur, prev) {
  if (!prev) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

// Une commande annulée ne compte nulle part; livrée = encaissé; tout le
// reste (new/confirmed/shipped) = argent en attente d'être encaissé.
const isPaid = (o) => o.status === 'delivered';
const isPending = (o) => o.status !== 'delivered' && o.status !== 'cancelled';

export default function VendorFinances() {
  const { shop } = useOutletContext();
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState('7d');
  const days = PERIODS.find((p) => p.key === period).days;
  const lang = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  // Le relevé à TÉLÉCHARGER — la comptabilité simple d'une PME.
  //
  // Beau: « un système de compte dans le mode vendeur que vont utiliser les
  // PME, et qu'ils pourront télécharger ». Une petite entreprise a besoin de
  // sortir ses chiffres de l'application: pour son cahier, son comptable, sa
  // demande de crédit. L'écran Finances montrait tout mais ne laissait rien
  // emporter.
  //
  // Format CSV, pas PDF: il s'ouvre dans Excel, Google Sheets et sur un
  // téléphone, et reste recopiable dans n'importe quel cahier de comptes.
  // Le séparateur est le point-virgule — c'est ce qu'Excel en français
  // attend — et le fichier commence par un BOM pour que les accents passent.
  const [exporting, setExporting] = useState(false);
  async function downloadStatement() {
    setExporting(true);
    try {
      const currency = currencyForCountry(shop.country);
      const from = new Date(Date.now() - days * 864e5).toISOString();
      const { data: rows, error: err } = await supabase
        .from('orders')
        .select('order_no, created_at, buyer_name, status, method, total_fcfa, order_items(name, qty, price_fcfa)')
        .eq('shop_id', shop.id)
        .gte('created_at', from)
        .order('created_at', { ascending: true });
      if (err) throw err;

      const statusLabel = (st) => t(`orderStatus.${st}`, st);
      const montant = (fcfa) =>
        currency === 'FCFA' ? String(Math.round(fcfa)) : convertFromFcfa(fcfa, currency).toFixed(2).replace('.', ',');
      const champ = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

      const lignes = [
        [t('finances.csvDate'), t('finances.csvOrder'), t('finances.csvBuyer'), t('finances.csvItems'),
         t('finances.csvStatus'), `${t('finances.csvTotal')} (${currency})`].map(champ).join(';'),
      ];
      let totalEncaisse = 0;
      for (const o of rows || []) {
        const items = (o.order_items || []).map((it) => `${it.name} x${it.qty}`).join(' + ');
        if (isPaid(o)) totalEncaisse += o.total_fcfa;
        lignes.push([
          new Date(o.created_at).toLocaleDateString(lang),
          `#${o.order_no}`, o.buyer_name || '', items, statusLabel(o.status), montant(o.total_fcfa),
        ].map(champ).join(';'));
      }
      lignes.push('');
      lignes.push([t('finances.csvPaidTotal'), '', '', '', '', montant(totalEncaisse)].map(champ).join(';'));

      // BOM UTF-8: sans lui, Excel affiche « Ã© » à la place de « é ».
      const blob = new Blob(['\ufeff' + lignes.join('\n')], { type: 'text/csv;charset=utf-8' });
      const nomFichier = `finjaro-releve-${shop.slug}-${period}.csv`;

      // Sur téléphone, le PARTAGE d'abord: dans l'application (WebView), le
      // téléchargement classique peut ne rien faire du tout — même famille de
      // pièges que les notifications, découverte aux dépens de Beau le 10/08.
      // Et pour une PME, envoyer son relevé sur WhatsApp ou par e-mail est
      // précisément l'usage. Le navigateur d'ordinateur, lui, télécharge.
      const fichier = new File([blob], nomFichier, { type: 'text/csv' });
      if (navigator.canShare?.({ files: [fichier] })) {
        try {
          await navigator.share({ files: [fichier], title: nomFichier });
          return;
        } catch (e) {
          if (e?.name === 'AbortError') return; // la personne a refermé: fini
          // Partage indisponible en pratique: on retombe sur le téléchargement.
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomFichier;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const { data, loading, error, retry } = useAsync(async () => {
    const now = Date.now();
    const from = new Date(now - days * 864e5).toISOString();
    const prevFrom = new Date(now - 2 * days * 864e5).toISOString();
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_no, status, total_fcfa, created_at, buyer_name')
      .eq('shop_id', shop.id)
      .gte('created_at', prevFrom)
      .order('created_at', { ascending: false });
    const all = orders || [];
    const cur = all.filter((o) => o.created_at >= from);
    const prev = all.filter((o) => o.created_at < from);

    const paid = cur.filter(isPaid).reduce((n, o) => n + o.total_fcfa, 0);
    const paidPrev = prev.filter(isPaid).reduce((n, o) => n + o.total_fcfa, 0);
    const pending = cur.filter(isPending).reduce((n, o) => n + o.total_fcfa, 0);
    const paidCount = cur.filter(isPaid).length;

    // Barres du graphique: une par jour (7j/30j) ou par mois (3m/1an).
    const monthly = days > 30;
    const buckets = monthly ? Math.round(days / 30) : days;
    const bars = Array.from({ length: buckets }, (_, i) => {
      const end = now - i * (monthly ? 30 : 1) * 864e5;
      const start = end - (monthly ? 30 : 1) * 864e5;
      const total = cur
        .filter(isPaid)
        .filter((o) => { const ts = new Date(o.created_at).getTime(); return ts > start && ts <= end; })
        .reduce((n, o) => n + o.total_fcfa, 0);
      const d = new Date(end);
      const label = monthly
        ? d.toLocaleDateString(lang, { month: 'short' })
        : d.toLocaleDateString(lang, { weekday: 'short' }).slice(0, 3);
      return { total, label };
    }).reverse();

    // Livre de comptes: commandes de la période groupées par jour.
    const groups = [];
    cur.forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });
      const g = groups.find((x) => x.day === day);
      if (g) g.rows.push(o);
      else groups.push({ day, rows: [o] });
    });

    return {
      paid, paidChange: pct(paid, paidPrev), pending, paidCount,
      avg: paidCount ? Math.round(paid / paidCount) : 0,
      bars, groups, empty: cur.length === 0,
    };
  }, [shop.id, days]);

  const maxBar = data ? Math.max(...data.bars.map((b) => b.total), 1) : 1;

  return (
    <div className="pb-6">
      <AppHeader title={t('finances.title')} />
      <div className="flex gap-2 border-b border-hairline px-4 pb-2 pt-1">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)} className={`chip flex-1 justify-center ${period === p.key ? 'chip-active' : 'text-ink'}`}>{t(p.label)}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 p-4"><Skeleton className="h-36 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : (
        <div className="space-y-5 p-4">
          {/* Le chiffre qui compte, façon appli Uber conducteur: ce que la
              boutique a réellement encaissé sur la période, en très grand. */}
          <div className="rounded-card bg-gradient-to-br from-teal to-[#0F4C46] p-5 text-white shadow-lg">
            <div className="flex items-center gap-2 text-white/80">
              <IconWallet size={18} />
              <p className="text-caption font-semibold uppercase tracking-wide">{t('finances.earned')}</p>
            </div>
            <VendorPrice fcfa={data.paid} className="mt-1 block text-[32px] font-bold leading-tight" />
            <div className="mt-1 flex items-center gap-1.5 text-caption">
              <span className={`flex items-center gap-0.5 rounded-pill px-2 py-0.5 font-semibold ${data.paidChange >= 0 ? 'bg-white/20' : 'bg-black/20'}`}>
                {data.paidChange >= 0 ? <IconArrowUpRight size={13} /> : <IconArrowDownRight size={13} />}
                {Math.abs(data.paidChange)}%
              </span>
              <span className="text-white/70">{t('stats.vsPrevious')}</span>
            </div>

            {/* Mini graphique intégré à la carte, barres blanches. */}
            {/* Barres et libellés sur deux rangées séparées: une hauteur en %
                ne se résout que contre un parent à hauteur définie (h-14). */}
            <div className="mt-4 flex h-14 items-end gap-1">
              {data.bars.map((b, i) => (
                <div key={i} className="min-w-0 flex-1 rounded-t bg-white/85" style={{ height: `${(b.total / maxBar) * 100}%`, minHeight: b.total > 0 ? 3 : 1, opacity: b.total > 0 ? 1 : 0.25 }} />
              ))}
            </div>
            {data.bars.length <= 12 && (
              <div className="mt-1 flex gap-1">
                {data.bars.map((b, i) => (
                  <span key={i} className="min-w-0 flex-1 truncate text-center text-[9px] text-white/60">{b.label}</span>
                ))}
              </div>
            )}
          </div>

          {/* Emporter ses chiffres: le relevé de la période en un fichier
              qu'Excel et Google Sheets ouvrent tel quel. */}
          <Button variant="secondary" onClick={downloadStatement} loading={exporting}>
            <IconDownload size={18} /> {t('finances.download')}
          </Button>

          <div className="grid grid-cols-3 gap-3">
            <Tile icon={IconHourglassHigh} tint="text-warning" label={t('finances.pending')} value={<VendorPrice fcfa={data.pending} />} />
            <Tile icon={IconShoppingBag} tint="text-teal" label={t('finances.salesCount')} value={data.paidCount} />
            <Tile icon={IconReceipt} tint="text-brass" label={t('finances.avgBasket')} value={<VendorPrice fcfa={data.avg} />} />
          </div>

          <section>
            <h2 className="mb-2 text-section text-ink">{t('finances.ledger')}</h2>
            {data.empty ? (
              <p className="rounded-card border border-hairline p-6 text-center text-caption text-muted">{t('finances.noEntries')}</p>
            ) : (
              <div className="space-y-4">
                {data.groups.map((g) => (
                  <div key={g.day}>
                    <p className="mb-1.5 text-caption font-semibold capitalize text-muted">{g.day}</p>
                    <ul className="divide-y divide-hairline rounded-card border border-hairline">
                      {g.rows.map((o) => <LedgerRow key={o.id} order={o} />)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Tile({ icon: Icon, tint, label, value }) {
  return (
    <div className="rounded-card border border-hairline p-3">
      <Icon size={18} className={tint} />
      <p className="mt-1.5 truncate text-body font-semibold text-ink">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}

function LedgerRow({ order }) {
  const { t } = useTranslation();
  const paid = order.status === 'delivered';
  const cancelled = order.status === 'cancelled';
  const Icon = paid ? IconCircleCheck : cancelled ? IconCircleX : IconClock;
  const tint = paid ? 'text-success' : cancelled ? 'text-danger' : 'text-warning';
  return (
    <li className="flex items-center gap-3 p-3">
      <Icon size={20} className={`shrink-0 ${tint}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body text-ink">{order.buyer_name || `#${order.order_no}`}</p>
        <p className="text-caption text-muted">
          #{order.order_no} · {paid ? t('finances.rowPaid') : cancelled ? t('finances.rowCancelled') : t('finances.rowPending')}
        </p>
      </div>
      <VendorPrice
        fcfa={order.total_fcfa}
        className={`shrink-0 text-body font-semibold ${paid ? 'text-success' : cancelled ? 'text-muted line-through' : 'text-warning'}`}
      />
    </li>
  );
}
