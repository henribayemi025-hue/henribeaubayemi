import { useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconBox, IconEye, IconEyeOff, IconPhotoPlus, IconSparkles } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl} from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { SmartImage } from '../../components/SmartImage';
import { VendorPrice } from '../../components/Price';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { isPriceOnRequest } from '../../lib/categories';
import { Button } from '../../components/Button';
import { RenameWithFinia } from '../../components/RenameWithFinia';
import { articlesSansVraiNom } from '../../lib/nameQuality';

// Trois piles bien distinctes. Avant, tout arrivait dans une seule grille:
// impossible de voir ce qui était en ligne, et les arrivages passés se
// seraient empilés au milieu des brouillons en cours.
const TABS = ['online', 'drafts', 'archive'];

export default function VendorProducts() {
  const { shop } = useOutletContext();
  const { t } = useTranslation();
  const toast = useToast();
  // L'ajout en masse renvoie ici avec ?tab=drafts: sans ça on ouvrait « En
  // ligne », qui ne contient justement pas ce qu'on vient d'ajouter.
  const [params] = useSearchParams();
  const asked = params.get('tab');
  const [tab, setTab] = useState(TABS.includes(asked) ? asked : 'online');
  const [busyId, setBusyId] = useState(null);
  const [publishingAll, setPublishingAll] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const { data, loading, error, retry, setData } = useAsync(async () => {
    const { data: products, error: err } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });
    if (err) throw err;
    return products || [];
  }, [shop.id]);

  // Publier / retirer. `published_at` repart à maintenant à chaque publication:
  // sinon la rotation, qui compte à partir de cette date, ré-archiverait
  // l'article dès la nuit suivante. `rotated_at` est effacé pour qu'il quitte
  // la pile « arrivages passés ».
  async function togglePublish(product) {
    const next = !product.is_active;
    setBusyId(product.id);
    const patch = next
      ? { is_active: true, rotated_at: null, published_at: new Date().toISOString() }
      : { is_active: false };
    const { error: err } = await supabase.from('products').update(patch).eq('id', product.id);
    setBusyId(null);
    if (err) {
      toast.error(err.message);
      return;
    }
    setData((rows) => rows.map((r) => (r.id === product.id ? { ...r, ...patch } : r)));
    toast.success(next ? t('vendor.published') : t('vendor.unpublished'));
  }

  const rows = data || [];
  // « Baby 1 » a « Baby 63 », « T-shirt no name 1 » a « 18 »: de vrais
  // articles avec de vraies photos, que personne ne peut trouver. Ils
  // viennent du nom commun numerote d'« Appliquer a tous » — c'est nous qui
  // les avons produits, c'est donc a nous d'offrir la sortie.
  const aRenommerIds = articlesSansVraiNom(rows);
  const aRenommer = rows.filter((p) => aRenommerIds.includes(p.id));
  const buckets = {
    online: rows.filter((p) => p.is_active),
    drafts: rows.filter((p) => !p.is_active && !p.rotated_at),
    archive: rows.filter((p) => !p.is_active && p.rotated_at),
  };
  const shown = buckets[tab];

  // Après un ajout en masse, la pile « Brouillons » compte des dizaines
  // d'articles: les publier un par un est absurde. Une seule requête les
  // bascule tous, avec les mêmes règles que la publication à l'unité.
  async function publishAll() {
    // Les articles retirés par la modération sont exclus: la base refuserait
    // de les republier, et les compter ici ferait annoncer un nombre faux.
    const ids = shown.filter((p) => !p.moderation_hidden_at).map((p) => p.id);
    if (!ids.length) return;
    if (!window.confirm(t('vendor.publishAllConfirm', { count: ids.length }))) return;
    setPublishingAll(true);
    const patch = { is_active: true, rotated_at: null, published_at: new Date().toISOString() };
    const { error: err } = await supabase.from('products').update(patch).in('id', ids);
    setPublishingAll(false);
    if (err) {
      toast.error(err.message);
      return;
    }
    setData((all) => all.map((r) => (ids.includes(r.id) ? { ...r, ...patch } : r)));
    toast.success(t('vendor.publishedAll', { count: ids.length }));
    setTab('online');
  }

  return (
    <div className="pb-6">
      <AppHeader
        title={t('nav.products')}
        right={
          <div className="flex items-center gap-2">
            {/* Remplir une boutique se fait par lots, pas article par
                article — le raccourci doit être aussi visible que le « + ». */}
            {/* Chip pleine, pas un lien discret: collé au « + » rond, un
                libellé fin se fait attraper par le pouce à la place du +. */}
            <Link
              to="/vendor/products/bulk"
              className="flex items-center gap-1 rounded-pill border border-teal/30 bg-teal/8 px-3 py-1.5 text-caption font-semibold text-teal"
            >
              <IconPhotoPlus size={16} /> {t('vendor.bulkShort')}
            </Link>
            <Link to="/vendor/products/new" aria-label={t('vendor.addProduct')} className="rounded-full bg-teal p-1.5 text-white"><IconPlus size={20} /></Link>
          </div>
        }
      />
      {!loading && !error && rows.length > 0 && (
        <div className="flex border-b border-hairline">
          {TABS.map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`flex-1 border-b-2 py-2 text-caption ${tab === tb ? 'border-teal font-semibold text-teal' : 'border-transparent text-muted'}`}
            >
              {t(`vendor.tab_${tb}`)} ({buckets[tb].length})
            </button>
          ))}
        </div>
      )}
      {/* Avant la grille, parce qu'une vendeuse qui fait defiler 63 « Baby »
          ne remonte pas chercher un bouton. */}
      {!loading && !error && aRenommer.length > 0 && (
        <div className="mx-4 mt-3 rounded-card border border-brass/40 bg-brass/8 p-3">
          <p className="text-body font-semibold text-ink">
            {t('vendor.renameBannerTitle', { count: aRenommer.length })}
          </p>
          <p className="mt-0.5 text-caption text-muted">{t('vendor.renameBannerHelp')}</p>
          <button
            onClick={() => setRenaming(true)}
            className="mt-2 flex items-center gap-1.5 rounded-pill bg-brass px-3 py-1.5 text-caption font-semibold text-white"
          >
            <IconSparkles size={16} /> {t('vendor.renameBannerCta')}
          </button>
        </div>
      )}
      {renaming && (
        <RenameWithFinia
          open
          onClose={() => setRenaming(false)}
          products={aRenommer}
          onSaved={(noms) => setData((all) => all.map((r) => (noms[r.id] ? { ...r, name: noms[r.id] } : r)))}
        />
      )}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}</div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : rows.length === 0 ? (
        <EmptyState icon={IconBox} title={t('vendor.emptyProducts')} action={<Link to="/vendor/products/new"><Button>{t('vendor.addProduct')}</Button></Link>} />
      ) : shown.length === 0 ? (
        <EmptyState icon={IconBox} title={t(`vendor.empty_${tab}`)} />
      ) : (
        <>
          {tab === 'archive' && (
            <p className="px-4 pt-3 text-caption text-muted">{t('vendor.archiveHelp')}</p>
          )}
          {/* Dire ce que « brouillon » veut dire. Le mot est clair pour qui
              connaît, opaque pour qui vend pour la première fois. */}
          {tab === 'drafts' && (
            <p className="px-4 pt-3 text-caption text-muted">{t('vendor.draftsHelp')}</p>
          )}
          {/* Tout publier d'un coup — la sortie normale d'un ajout en masse. */}
          {tab === 'drafts' && (
            <div className="px-4 pt-3">
              <Button onClick={publishAll} loading={publishingAll}>
                <IconEye size={18} /> {t('vendor.publishAll', { count: shown.filter((p) => !p.moderation_hidden_at).length })}
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 p-4">
            {shown.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-card border border-hairline">
                <Link to={`/vendor/products/${p.id}`} className="block">
                  <SmartImage src={p.images?.[0] ? storageThumbUrl('products', p.images[0]) : null} fallbackSrc={p.images?.[0] ? storageUrl('products', p.images[0]) : null} alt={p.name} className="aspect-square w-full" />
                  <div className="p-2">
                    <p className="line-clamp-1 text-body text-ink">{p.name}</p>
                    {/* « Prix sur demande » est un choix de la vendeuse, pas un
                        prix de zéro. La carte côté acheteuse le disait déjà;
                        ici on affichait « 0 » — la vendeuse pouvait croire que
                        son article était offert. */}
                    {isPriceOnRequest(p) ? (
                      <p className="text-caption font-semibold text-brass">{t('product.priceOnRequest')}</p>
                    ) : (
                      <VendorPrice fcfa={p.price_fcfa} className="text-caption font-semibold text-teal" />
                    )}
                    <p className={`text-caption ${p.stock > 0 ? 'text-muted' : 'text-danger'}`}>
                      {p.stock > 0 ? `${t('product.inStock')}: ${p.stock}` : t('product.outOfStock')}
                    </p>
                  </div>
                </Link>
                {/* Un article retiré par la modération ne se republie pas
                    d'un clic — la base le refuse. Sans ce bloc, le bouton
                    « Publier » aurait annoncé « publié » et l'article serait
                    resté hors ligne: la vendeuse aurait cherché longtemps.
                    Elle voit donc la raison, en clair, à la place du bouton. */}
                {p.moderation_hidden_at ? (
                  <p className="border-t border-hairline bg-danger-bg px-2 py-2 text-caption text-danger">
                    <span className="font-semibold">{t('vendor.blockedByModeration')}</span>
                    {p.moderation_reason ? <span className="mt-0.5 block">{p.moderation_reason}</span> : null}
                  </p>
                ) : (
                  <button
                    onClick={() => togglePublish(p)}
                    disabled={busyId === p.id}
                    className="flex w-full items-center justify-center gap-1.5 border-t border-hairline py-2 text-caption font-semibold text-teal disabled:opacity-50"
                  >
                    {p.is_active ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                    {p.is_active ? t('vendor.unpublish') : t('vendor.publish')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
