import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { IconMovie } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ReelPlayer } from '../../components/ReelPlayer';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { Button } from '../../components/Button';

export default function Fin() {
  const { t } = useTranslation();
  const { user } = useAuth();
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
        .select('*, shops(name, slug, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(30);
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
  }, [tab, user]);

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
    <div className="relative h-screen bg-black">
      <div className="absolute inset-x-0 top-0 z-20 flex justify-center gap-6 pt-3">
        {['forYou', 'following'].map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`text-body ${tab === tb ? 'font-semibold text-white' : 'text-white/60'}`}
          >
            {t(tb === 'forYou' ? 'fin.forYou' : 'fin.followingTab')}
          </button>
        ))}
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
            <div key={reel.id} className="h-screen w-full">
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
