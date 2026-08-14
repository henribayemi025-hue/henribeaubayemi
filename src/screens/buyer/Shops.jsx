import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconBuildingStore, IconSearch } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useSettings } from '../../hooks/useSettings';
import { AppHeader } from '../../components/AppHeader';
import { ShopCard } from '../../components/ShopCard';
import { TextInput } from '../../components/Field';
import { Skeleton, ErrorState, EmptyState } from '../../components/states';

// L'annuaire de TOUTES les boutiques.
//
// Beau: « dans l'admin on dit qu'il y a 30 boutiques, mais moi j'en vois 10
// au maximum ».
//
// Il avait raison, et ce n'était pas un bug: cette page n'existait pas. Les
// boutiques n'apparaissaient QUE dans un bandeau horizontal de l'accueil,
// plafonné à douze. Une vendeuse qui ouvrait la treizième boutique était
// invisible pour toujours, sans que rien ne l'en avertisse — et une vendeuse
// invisible s'en va.
//
// On liste donc tout, sans plafond arbitraire. Deux règles d'ordre:
//   * les boutiques qui ont des articles en ligne d'abord — envoyer une
//     acheteuse dans une boutique vide la déçoit et n'aide pas la vendeuse;
//   * à égalité, celles du pays de la personne avant les autres. Finjaro est
//     mondiale: les autres suivent, elles ne disparaissent pas.
export default function Shops() {
  const { t } = useTranslation();
  const { country } = useSettings();
  const [term, setTerm] = useState('');

  const { data, loading, error, retry } = useAsync(async () => {
    const [{ data: shops, error: err }, { data: withProducts }] = await Promise.all([
      supabase
        .from('shops')
        .select('id, slug, name, avatar_url, rating, is_verified, followers_count, country, city')
        .eq('status', 'active')
        .order('followers_count', { ascending: false }),
      // Une seule requête pour savoir qui a du stock en ligne, plutôt qu'une
      // par boutique.
      supabase.from('products').select('shop_id').eq('is_active', true),
    ]);
    if (err) throw err;
    const garnies = new Set((withProducts || []).map((p) => p.shop_id));
    return (shops || []).map((s) => ({ ...s, hasProducts: garnies.has(s.id) }));
  }, []);

  const shops = useMemo(() => {
    const rows = data || [];
    const q = term.trim().toLowerCase();
    const filtered = q
      ? rows.filter((s) => (s.name || '').toLowerCase().includes(q) || (s.city || '').toLowerCase().includes(q))
      : rows;
    return [...filtered].sort((a, b) => {
      if (a.hasProducts !== b.hasProducts) return a.hasProducts ? -1 : 1;
      const aLocal = country && a.country === country;
      const bLocal = country && b.country === country;
      if (aLocal !== bLocal) return aLocal ? -1 : 1;
      return (b.followers_count || 0) - (a.followers_count || 0);
    });
  }, [data, term, country]);

  return (
    <div className="pb-6">
      <AppHeader title={t('shops.title')} back />

      <div className="p-4">
        <label className="relative block">
          <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <TextInput
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t('shops.searchPlaceholder')}
            className="pl-10"
          />
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4 px-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={retry} />
      ) : shops.length === 0 ? (
        <EmptyState icon={IconBuildingStore} title={term ? t('shops.noMatch') : t('shops.empty')} />
      ) : (
        <>
          <p className="px-4 text-caption text-muted">{t('shops.count', { count: shops.length })}</p>
          <div className="mt-3 grid grid-cols-3 gap-4 px-4 sm:grid-cols-4 lg:grid-cols-6">
            {shops.map((s) => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
