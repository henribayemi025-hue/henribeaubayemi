import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconMovie, IconX } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ReelPlayer } from '../../components/ReelPlayer';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { Button } from '../../components/Button';

export default function Fin() {
  const { t } = useTranslation();
  const { user } = useAuth();
  // « Nos Reels » depuis une fiche boutique arrive ici avec ?shop=<id>: le
  // flux ne montre alors QUE ses vidéos, avec un bandeau pour tout rouvrir.
  const [params, setParams] = useSearchParams();
  const shopFilter = params.get('shop');
  const [tab, setTab] = useState('forYou');
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [muted, setMuted] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      let query = supabase
        .from('reels')
        .select('*, shops(name, slug, avatar_url, owner_id), products(id, name, price_fcfa, images, stock, shop_id)')
        // Une vidéo retirée par la modération ne revient pas dans le fil.
        // `reels` n'a pas de `is_active`: c'est cet horodatage qui la masque.
        .is('moderation_hidden_at', null)
        .order('created_at', { ascending: false })
        .limit(30);
      if (shopFilter) query = query.eq('shop_id', shopFilter);
      if (tab === 'following') {
        if (!user) {
          setReels([]);
          setLoading(false);
          return;
        }
        const { data: follows } = await supabase.from('shop_follows').select('shop_id').eq('follower_id', user.id);
        const ids = (follows || []).map((f) => f.shop_id);
        if (ids.length === 0) {
          setReels([]);
          setLoading(false);
          return;
        }
        query = query.in('shop_id', ids);
      }
      const { data, error: err } = await query;
      if (err) throw err;
      setReels(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [tab, user, shopFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Track which reel is centered to drive autoplay + limit preload to next 1.
  function onScroll() {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    if (idx !== activeIdx) setActiveIdx(idx);
  }

  return (
    <div className="relative h-full bg-black">
      {/* Capsule translucide derrière les onglets: contraste garanti quel que
          soit ce qu'il y a en dessous (vidéo claire, squelette de
          chargement, écran vide blanc) — avant, le texte blanc pouvait
          devenir invisible sur n'importe lequel des trois. */}
      <div className="absolute inset-x-0 top-3 z-20 flex justify-center">
        {shopFilter ? (
          <button
            onClick={() => setParams({}, { replace: true })}
            className="flex items-center gap-1.5 rounded-pill bg-black/30 px-3 py-1.5 text-caption font-semibold text-white backdrop-blur-sm"
          >
            {t('fin.shopFilter', { name: reels[0]?.shops?.name || '…' })}
            <IconX size={14} /> {t('fin.backToAll')}
          </button>
        ) : (
          <div className="flex items-center gap-1 rounded-pill bg-black/25 p-1 backdrop-blur-sm">
            {['forYou', 'following'].map((tb) => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`rounded-pill px-3.5 py-1.5 text-caption font-semibold transition-colors duration-200 ${
                  tab === tb ? 'bg-white text-ink' : 'text-white/85'
                }`}
              >
                {t(tb === 'forYou' ? 'fin.forYou' : 'fin.followingTab')}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-full w-full rounded-none" />
      ) : error ? (
        <div className="flex h-full items-center justify-center bg-white">
          <ErrorState message={t('fin.loadError')} onRetry={load} />
        </div>
      ) : reels.length === 0 ? (
        <div className="flex h-full items-center justify-center bg-white">
          <EmptyState
            icon={IconMovie}
            title={tab === 'following' ? t('fin.noFollows') : t('fin.noReels')}
            action={tab === 'following' ? <Button onClick={() => setTab('forYou')}>{t('fin.exploreForYou')}</Button> : null}
          />
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={onScroll}
          className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll"
        >
          {reels.map((reel, i) => (
            <div key={reel.id} className="h-full w-full">
              {Math.abs(i - activeIdx) <= 1 ? (
                <ReelPlayer reel={reel} muted={muted} onToggleMute={() => setMuted((m) => !m)} active={i === activeIdx} />
              ) : (
                <div className="h-full w-full bg-black" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
