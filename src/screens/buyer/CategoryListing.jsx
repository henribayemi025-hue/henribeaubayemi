import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconMoodSmile } from '@tabler/icons-react';
import { AppHeader } from '../../components/AppHeader';
import { ProductCard } from '../../components/ProductCard';
import { ProductGridSkeleton, EmptyState, ErrorState } from '../../components/states';
import { CATEGORIES } from '../../lib/categories';
import { getCachedCategory, loadCategory } from '../../lib/categoryCache';
import { track } from '../../lib/track';

export default function CategoryListing() {
  const { categoryId } = useParams();
  const { t } = useTranslation();
  const cat = CATEGORIES.find((c) => c.id === categoryId);

  // Revenir sur une catégorie déjà vue doit être instantané: on repart du
  // cache et on ne montre le squelette que s'il n'y a vraiment rien à afficher.
  const cached = getCachedCategory(categoryId);
  const [data, setData] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const known = getCachedCategory(categoryId);
    setData(known);
    setLoading(!known);
    setError(false);
    try {
      setData(await loadCategory(categoryId));
    } catch {
      if (!known) setError(true); // rien à montrer en repli
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    track('category_view', categoryId);
    load();
  }, [categoryId, load]);

  return (
    <div>
      <AppHeader title={t(`categories.${categoryId}`)} back />
      <div className="lg:mx-auto lg:max-w-4xl">
        {cat && (
          // Bandeau décoratif: il doit situer la catégorie, pas manger l'écran.
          // Il était à h-96 (384 px) sur desktop et repoussait toute la grille
          // sous la ligne de flottaison — on entrait dans une catégorie et on
          // ne voyait aucun article sans faire défiler.
          <div className="relative h-36 w-full overflow-hidden bg-ink sm:h-44 lg:h-52">
            {/* Blurred backdrop fills the frame; the real banner stays fully
                visible and never upscaled past its own resolution, so it's
                never cropped and never blurry. */}
            <img src={cat.banner} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover object-top blur-lg" />
            <img src={cat.banner} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain" />
          </div>
        )}
        <div className="p-4">
          {/* L'erreur passe AVANT le squelette: sinon un échec sans donnée en
              cache (data null, loading false) afficherait un squelette éternel
              au lieu du bouton Réessayer. */}
          {error ? (
            <ErrorState message={t('home.loadError')} onRetry={load} />
          ) : loading || !data ? (
            <ProductGridSkeleton />
          ) : data.length === 0 ? (
            <EmptyState icon={IconMoodSmile} title={t('home.noProducts')} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {data.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
