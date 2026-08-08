import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconTrash, IconX } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl} from '../lib/supabase';
import { useAsync } from '../hooks/useAsync';
import { useVendorStatus } from '../hooks/useVendorStatus';
import { useToast } from '../hooks/useToast';
import { SmartImage } from './SmartImage';
import { Price } from './Price';
import { Skeleton } from './states';

// In-chat product deletion, offered when Finou detects a "delete my product"
// intent. The product LIST and the delete call both come from real Supabase
// data (never the LLM) — Finou only triggers the flow, it never picks or
// confirms on the vendor's behalf. A confirm step guards the destructive
// delete() call, same as the "Supprimer" button on the classic edit screen.
export function FinouDeleteProduct({ onClose, onDeleted }) {
  const { t } = useTranslation();
  const { shop } = useVendorStatus();
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  // `shop` vaut null au PREMIER rendu — useVendorStatus part toujours de
  // { loading: true, shop: null } et ne remplit la boutique qu'après son
  // effet. Le tableau de dépendances `[shop.id]` était donc évalué sur null
  // à chaque ouverture: une exception PENDANT le rendu, que rien n'attrape
  // ici. Et comme Finia vit dans la mise en page, au-dessus du garde-fou des
  // écrans, c'est TOUTE l'application qui disparaissait — la page blanche que
  // Beau ne pouvait quitter qu'en rechargeant.
  // `shop?.id` suffit à ne plus planter, et la requête attend d'avoir une
  // boutique plutôt que d'aller chercher les articles de personne.
  const { data, loading } = useAsync(async () => {
    if (!shop?.id) return [];
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price_fcfa, images')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return products || [];
  }, [shop?.id]);

  async function confirmDelete() {
    setBusy(true);
    const { error } = await supabase.from('products').delete().eq('id', target.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    onDeleted?.(target);
  }

  return (
    <div className="rounded-2xl border border-hairline bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-body font-semibold text-ink">
          {target ? t('finouDelete.title') : t('finouDelete.pickProduct')}
        </p>
        <button onClick={onClose} aria-label={t('common.close')} className="rounded-full p-1 text-muted hover:bg-hairline">
          <IconX size={18} />
        </button>
      </div>

      {!target ? (
        loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
          </div>
        ) : data.length === 0 ? (
          <p className="text-caption text-muted">{t('finouDelete.empty')}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {data.map((p) => (
              <button key={p.id} onClick={() => setTarget(p)} className="text-left transition active:scale-95">
                <SmartImage
                  src={p.images?.[0] ? storageThumbUrl('products', p.images[0]) : null} fallbackSrc={p.images?.[0] ? storageUrl('products', p.images[0]) : null}
                  alt={p.name}
                  className="aspect-square w-full"
                  rounded="rounded-input"
                />
                <p className="mt-1 line-clamp-1 text-caption text-ink">{p.name}</p>
                <Price fcfa={p.price_fcfa} className="text-caption font-semibold text-teal" />
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <SmartImage
            src={target.images?.[0] ? storageThumbUrl('products', target.images[0]) : null} fallbackSrc={target.images?.[0] ? storageUrl('products', target.images[0]) : null}
            alt={target.name}
            className="h-20 w-20"
            rounded="rounded-input"
          />
          <p className="text-body font-semibold text-ink">{t('finouDelete.confirmTitle', { name: target.name })}</p>
          <p className="text-caption text-muted">{t('finouDelete.confirmBody')}</p>
          <div className="flex w-full gap-2">
            <button onClick={() => setTarget(null)} className="btn-secondary flex-1">{t('finouDelete.cancelBtn')}</button>
            <button
              onClick={confirmDelete}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-1 rounded-input bg-danger px-4 py-2.5 text-body font-semibold text-white disabled:opacity-60"
            >
              <IconTrash size={16} /> {t('finouDelete.confirmBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
