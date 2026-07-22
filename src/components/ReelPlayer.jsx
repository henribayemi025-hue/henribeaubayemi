import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconHeart, IconHeartFilled, IconMessageCircle, IconShare3, IconVolume, IconVolumeOff, IconTag } from '@tabler/icons-react';
import { supabase, storageUrl } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import { useToast } from '../hooks/useToast';
import { ReelCommentsSheet } from './ReelCommentsSheet';
import { track } from '../lib/track';

// One full-screen reel. Autoplays when >60% visible; muted by default.
export function ReelPlayer({ reel, muted, onToggleMute, active }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { requireLogin } = useUI();
  const toast = useToast();
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(reel.likes || 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(reel.comments || 0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [active]);

  useEffect(() => {
    if (!user) return;
    supabase.from('reel_likes').select('id').eq('reel_id', reel.id).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [user, reel.id]);

  async function toggleLike() {
    if (!user) return requireLogin();
    if (liked) {
      setLiked(false); setLikes((n) => Math.max(0, n - 1));
      await supabase.from('reel_likes').delete().eq('reel_id', reel.id).eq('user_id', user.id);
      await supabase.from('reels').update({ likes: Math.max(0, likes - 1) }).eq('id', reel.id);
    } else {
      setLiked(true); setLikes((n) => n + 1);
      await supabase.from('reel_likes').insert({ reel_id: reel.id, user_id: user.id });
      await supabase.from('reels').update({ likes: likes + 1 }).eq('id', reel.id);
    }
  }

  async function share() {
    const url = `${window.location.origin}/boutique/${reel.shops?.slug}`;
    if (navigator.share) { try { await navigator.share({ title: reel.shops?.name, url }); await supabase.from('reels').update({ shares: (reel.shares || 0) + 1 }).eq('id', reel.id); return; } catch { /* fall through */ } }
    try { await navigator.clipboard.writeText(url); toast.success(t('common.shareCopied')); } catch { toast.error(t('errors.generic')); }
  }

  function openComments() {
    setCommentsOpen(true);
    track('comment', reel.id);
  }

  return (
    <div className="relative h-full w-full snap-start bg-black">
      <video
        ref={videoRef}
        src={storageUrl('reels', reel.video_url)}
        muted={muted}
        loop
        playsInline
        preload={active ? 'auto' : 'metadata'}
        className="h-full w-full object-contain"
        onClick={onToggleMute}
      />
      <button onClick={onToggleMute} className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white" aria-label={muted ? t('fin.unmute') : t('fin.mute')}>
        {muted ? <IconVolumeOff size={20} /> : <IconVolume size={20} />}
      </button>

      <div className="absolute bottom-24 right-3 z-20 flex flex-col items-center gap-5 text-white">
        <button onClick={toggleLike} className="flex flex-col items-center transition-transform active:scale-90" aria-label={t('fin.like')}>
          {liked ? <IconHeartFilled key={likes} size={30} className="text-danger animate-like-pop" /> : <IconHeart size={30} />}
          <span className="text-[11px]">{likes}</span>
        </button>
        <button onClick={openComments} className="flex flex-col items-center" aria-label={t('fin.comment')}>
          <IconMessageCircle size={30} />
          <span className="text-[11px]">{commentCount}</span>
        </button>
        <button onClick={share} className="flex flex-col items-center" aria-label={t('common.share')}>
          <IconShare3 size={30} />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-20 z-10 px-4 pr-20 text-white">
        <Link to={`/boutique/${reel.shops?.slug}`} className="flex items-center gap-2">
          <img
            src={reel.shops?.avatar_url ? storageUrl('shops', reel.shops.avatar_url) : '/favicon.svg'}
            alt={reel.shops?.name}
            className="h-9 w-9 rounded-full border border-white/50 object-cover"
          />
          <span className="text-body font-semibold">{reel.shops?.name}</span>
        </Link>
        {reel.caption && <p className="mt-2 line-clamp-2 text-caption">{reel.caption}</p>}
        {reel.product_id && (
          <Link to={`/product/${reel.product_id}`} className="mt-2 inline-flex items-center gap-1 rounded-pill bg-white/90 px-3 py-1 text-caption font-semibold text-ink">
            <IconTag size={15} /> {t('fin.viewProduct')}
          </Link>
        )}
      </div>

      <ReelCommentsSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        reelId={reel.id}
        onAdded={() => setCommentCount((n) => n + 1)}
      />
    </div>
  );
}
