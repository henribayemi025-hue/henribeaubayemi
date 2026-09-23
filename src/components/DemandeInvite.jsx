import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconBrandWhatsapp, IconX, IconCircleCheckFilled } from '@tabler/icons-react';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';
import { useSettings } from '../hooks/useSettings';
import { phoneExample } from '../lib/phone';
import { supabase } from '../lib/supabase';
import { track, getAnonId } from '../lib/track';
import { Button } from './Button';

// « Le panier, c'est une commande » (Beau, 22/09).
//
// Une personne sans compte qui met un article au panier laisse un prénom et
// un numéro WhatsApp: sa demande arrive chez la vendeuse comme une commande,
// et la vendeuse l'accepte et lui écrit. Avant, « Passer commande » exigeait
// un compte — six paniers en trois semaines, zéro commande, personne à
// rappeler. Le prénom et le numéro restent dans le téléphone pour la fois
// suivante; le compte reste possible, il n'est plus obligatoire.

const KEY = 'finjaro_invite';
function lire() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { name: '', phone: '' }; } catch { return { name: '', phone: '' }; }
}

export default function DemandeInvite() {
  // L'exemple de numéro suit le pays de la personne (CLAUDE.md §1): pas
  // d'indicatif imposé dans une place de marché mondiale.
  const { country } = useSettings();
  const { t } = useTranslation();
  const toast = useToast();
  const { demande, fermerDemande, clearShop, dismissJustAdded } = useCart();
  const [form, setForm] = useState(lire);
  const [busy, setBusy] = useState(false);
  const [envoyee, setEnvoyee] = useState(null);

  useEffect(() => { if (demande) { setEnvoyee(null); dismissJustAdded(); } }, [demande, dismissJustAdded]);
  if (!demande) return null;

  const phoneOk = /^[+()\d][\d\s().-]{6,}$/.test(form.phone);
  const nameOk = form.name.trim().length >= 2;

  async function envoyer(e) {
    e.preventDefault();
    if (!phoneOk || !nameOk || busy) return;
    setBusy(true);
    try {
      localStorage.setItem(KEY, JSON.stringify({ name: form.name.trim(), phone: form.phone.trim() }));
      const { data, error } = await supabase.rpc('place_guest_order', {
        p_shop_id: demande.shop_id,
        p_buyer_name: form.name.trim(),
        p_buyer_phone: form.phone.trim(),
        p_guest_id: getAnonId() || 'sans-stockage',
        p_items: demande.items.map((it) => ({ product_id: it.id, qty: it.qty || 1, size: it.size || null, color: it.color || null })),
      });
      if (error) throw error;
      const order = Array.isArray(data) ? data[0] : data;
      track('order_placed', demande.shop_id, { guest: true, count: demande.items.length });
      clearShop(demande.shop_id);
      setEnvoyee(order?.order_no || '');
    } catch (err) {
      const [code, name] = String(err?.message || '').split(':');
      const connus = {
        insufficient_stock: t('checkout.errInsufficientStock', { name, defaultValue: 'Plus assez de stock pour « {{name}} ».' }),
        product_inactive: t('checkout.errProductInactive', { name, defaultValue: '« {{name}} » n’est plus en vente.' }),
        product_missing: t('checkout.errProductMissing', 'Un article n’existe plus.'),
        shop_unavailable: t('checkout.errShopUnavailable', 'Cette boutique n’est pas disponible pour le moment.'),
        too_many: t('guest.tooMany', 'Trop de demandes aujourd’hui depuis cet appareil. Réessaie demain, ou crée un compte.'),
        bad_phone: t('checkout.invalidPhone'),
      };
      toast.error(connus[code] || t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  const n = demande.items.reduce((s, it) => s + (it.qty || 1), 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 sm:items-center" onClick={fermerDemande}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        className="animate-slide-up w-full max-w-app rounded-t-card bg-base p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-card">
        {envoyee !== null ? (
          <div className="space-y-3 text-center">
            <IconCircleCheckFilled size={44} className="mx-auto text-success" />
            <p className="text-section font-semibold text-ink">{t('guest.sentTitle', 'Demande envoyée')}</p>
            <p className="text-body text-muted">
              {t('guest.sentBody', { shop: demande.shop_name, defaultValue: '{{shop}} reçoit ta demande maintenant et te répond sur WhatsApp pour le prix, la livraison et le paiement.' })}
              {envoyee ? ` (#${envoyee})` : ''}
            </p>
            <Button onClick={fermerDemande}>{t('common.ok', 'OK')}</Button>
          </div>
        ) : (
          <form onSubmit={envoyer} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-section font-semibold text-ink">{t('guest.title', 'Pour que la boutique te réponde')}</p>
                <p className="mt-0.5 text-caption text-muted">
                  {t('guest.help', { shop: demande.shop_name, count: n, defaultValue: '{{shop}} reçoit ta demande ({{count}} article) et te confirme sur WhatsApp. Pas besoin de compte.' })}
                </p>
              </div>
              <button type="button" onClick={fermerDemande} aria-label={t('common.close')} className="shrink-0 rounded-full p-1 text-muted hover:bg-hairline"><IconX size={18} /></button>
            </div>
            <label className="block">
              <span className="text-caption font-semibold text-ink">{t('guest.name', 'Ton prénom')}</span>
              <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="given-name"
                className="mt-1 w-full rounded-input border border-hairline bg-white px-3 py-2.5 text-[16px] text-ink outline-none focus:border-teal" />
            </label>
            <label className="block">
              <span className="text-caption font-semibold text-ink">{t('guest.phone', 'Ton numéro WhatsApp')}</span>
              <input type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" placeholder={phoneExample(country)}
                className="mt-1 w-full rounded-input border border-hairline bg-white px-3 py-2.5 text-[16px] text-ink outline-none focus:border-teal" />
              {form.phone && !phoneOk && <span className="text-caption text-danger">{t('checkout.invalidPhone')}</span>}
            </label>
            <Button type="submit" loading={busy} disabled={!phoneOk || !nameOk}>
              <IconBrandWhatsapp size={18} /> {t('guest.send', 'Envoyer ma demande')}
            </Button>
            <button type="button" onClick={fermerDemande} className="block w-full py-1 text-center text-caption font-semibold text-muted">
              {t('guest.later', 'Plus tard, je continue mes achats')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
