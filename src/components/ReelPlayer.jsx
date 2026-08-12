import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ReportButton } from './ReportButton';
import { IconHeart, IconHeartFilled, IconMessageCircle, IconShare3, IconVolume, IconVolumeOff, IconShoppingBagPlus, IconPlus, IconCheck } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import { useToast } from '../hooks/useToast';
import { useCart } from '../hooks/useCart';
import { ReelCommentsSheet } from './ReelCommentsSheet';
import { ShopAvatar } from './ShopAvatar';
import { Price } from './Price';
import { track } from '../lib/track';
import { networkMessage } from '../lib/netError';
import { visitorId } from '../lib/visitor';

// Ombre systématique derrière icônes/texte blancs: une vidéo claire (fond
// blanc, robe blanche…) faisait disparaître les icônes blanches et le texte
// devenait illisible sans un fond sombre dédié. Un drop-shadow marche quel
// que soit le contenu de la vidéo, contrairement à un dégradé fixe seul.
const ICON_SHADOW = { filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.6))' };

// One full-screen reel. Autoplays when >60% visible; muted by default.
export function ReelPlayer({ reel, muted, onToggleMute, active }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { requireLogin } = useUI();
  const toast = useToast();
  const cart = useCart();
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(reel.likes || 0);
  const [following, setFollowing] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(reel.comments || 0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
      setProgress(0);
    }
  }, [active]);

  useEffect(() => {
    // Le cœur déjà donné se retrouve aussi SANS compte: on interroge alors
    // avec le jeton de l'appareil au lieu de l'identifiant du compte.
    const q = user
      ? supabase.from('reel_likes').select('id').eq('reel_id', reel.id).eq('user_id', user.id)
      : supabase.from('reel_likes').select('id').eq('reel_id', reel.id).eq('visitor_id', visitorId());
    q.maybeSingle().then(({ data }) => setLiked(!!data));
    if (!user) return;
    if (reel.shop_id) {
      supabase.from('shop_follows').select('id').eq('follower_id', user.id).eq('shop_id', reel.shop_id).maybeSingle()
        .then(({ data }) => setFollowing(!!data));
    }
  }, [user, reel.id, reel.shop_id]);

  // Le compteur est tenu par la base (trigger trg_reel_like_change, migration
  // 0043) — comme celui des commentaires et des abonnés. On n'écrit donc PLUS
  // reels.likes ici: le faire en plus du trigger compterait double. On se
  // contente d'ajouter/retirer la ligne, et si l'écriture échoue on remet
  // l'affichage dans son état d'avant plutôt que de laisser un like fantôme
  // qui disparaîtra au prochain chargement.
  // Aimer ne demande PAS de compte.
  //
  // Beau: « pour moi quelqu'un qui n'a pas de compte peut liker les reels ».
  // C'est le geste le plus léger de l'app: exiger une inscription pour un
  // cœur fait fuir la personne avant qu'elle ait rien vu. Sans compte, la
  // ligne porte le jeton de l'appareil (voir lib/visitor.js) au lieu d'un
  // identifiant de compte — le compteur, lui, reste tenu par la base.
  async function toggleLike() {
    const owner = user ? { user_id: user.id } : { visitor_id: visitorId() };
    const [col, val] = Object.entries(owner)[0];
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((n) => (wasLiked ? Math.max(0, n - 1) : n + 1));
    const { error } = wasLiked
      ? await supabase.from('reel_likes').delete().eq('reel_id', reel.id).eq(col, val)
      : await supabase.from('reel_likes').insert({ reel_id: reel.id, ...owner });
    if (error) {
      setLiked(wasLiked);
      setLikes((n) => (wasLiked ? n + 1 : Math.max(0, n - 1)));
      toast.error(networkMessage(error, t));
    }
  }

  // Suivre la boutique sans quitter le reel — jusqu'ici, il fallait ouvrir la
  // fiche boutique juste pour ça. Le "+" façon TikTok à côté de l'avatar.
  async function toggleFollow(e) {
    e.preventDefault();
    if (!user) return requireLogin();
    if (!reel.shop_id) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    const { error } = wasFollowing
      ? await supabase.from('shop_follows').delete().eq('follower_id', user.id).eq('shop_id', reel.shop_id)
      : await supabase.from('shop_follows').insert({ follower_id: user.id, shop_id: reel.shop_id });
    if (error) {
      setFollowing(wasFollowing); // l'abonnement n'a pas pris: on ne le prétend pas
      toast.error(networkMessage(error, t));
      return;
    }
    if (!wasFollowing) track('follow', reel.shop_id);
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

  function buyProduct() {
    const p = reel.products;
    if (!p) return;
    cart.add({ ...p, shop_id: p.shop_id || reel.shop_id, shop_name: reel.shops?.name });
  }

  return (
    <div className="relative h-full w-full snap-start bg-black">
      {/* Barre de progression façon Reels/TikTok: repère de "combien il reste"
          qui manquait totalement — la vidéo bouclait sans aucun indice. */}
      <div className="absolute inset-x-0 top-0 z-30 h-0.5 bg-white/20">
        <div className="h-full bg-white transition-[width] duration-150 ease-linear" style={{ width: `${progress}%` }} />
      </div>

      <video
        ref={videoRef}
        src={storageUrl('reels', reel.video_url)}
        muted={muted}
        loop
        playsInline
        preload={active ? 'auto' : 'metadata'}
        onTimeUpdate={(e) => {
          const { currentTime, duration } = e.currentTarget;
          if (duration) setProgress((currentTime / duration) * 100);
        }}
        className="h-full w-full object-contain"
        onClick={onToggleMute}
      />

      {/* Dégradés de lisibilité, haut ET bas: avant, le texte/les icônes ne
          comptaient que sur leur couleur blanche — invisibles sur une vidéo
          claire. Un scrim sombre fixe fonctionne quel que soit le contenu. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-72 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

      <button onClick={onToggleMute} style={ICON_SHADOW} className="absolute right-3 top-3 z-20 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm" aria-label={muted ? t('fin.unmute') : t('fin.mute')}>
        {muted ? <IconVolumeOff size={20} /> : <IconVolume size={20} />}
      </button>

      <div className="absolute bottom-24 right-3 z-20 flex flex-col items-center gap-5 text-white" style={ICON_SHADOW}>
        {/* Avatar boutique + bouton suivre rapide, au-dessus de la pile
            like/commentaire/partager — même emplacement que TikTok. */}
        {reel.shops && (
          <div className="relative">
            <Link to={`/boutique/${reel.shops.slug}`} className="block">
              {/* ShopAvatar (pas un <img> brut): un dégradé + l'initiale de
                  la boutique en repli, jamais l'icône "image cassée" avec le
                  nom tronqué par-dessus — c'est exactement ce que Beau a vu
                  sur une boutique dont la miniature ne chargeait pas. */}
              <ShopAvatar
                src={reel.shops.avatar_url ? storageThumbUrl('shops', reel.shops.avatar_url) : null}
                fallbackSrc={reel.shops.avatar_url ? storageUrl('shops', reel.shops.avatar_url) : null}
                name={reel.shops.name}
                seed={reel.shop_id}
                className="h-11 w-11 border-2 border-white"
              />
            </Link>
            {user?.id !== reel.shops.owner_id && (
              <button
                onClick={toggleFollow}
                aria-label={following ? t('common.following') : t('common.follow')}
                className={`absolute -bottom-1.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-2 border-black text-white transition-colors ${following ? 'bg-success' : 'bg-teal'}`}
              >
                {following ? <IconCheck size={11} /> : <IconPlus size={11} />}
              </button>
            )}
          </div>
        )}
        <button onClick={toggleLike} className="flex flex-col items-center transition-transform active:scale-90" aria-label={t('fin.like')}>
          {liked ? <IconHeartFilled key={likes} size={30} className="text-danger animate-like-pop" /> : <IconHeart size={30} />}
          <span className="text-[11px] font-medium">{likes}</span>
        </button>
        <button onClick={openComments} className="flex flex-col items-center" aria-label={t('fin.comment')}>
          <IconMessageCircle size={30} />
          <span className="text-[11px] font-medium">{commentCount}</span>
        </button>
        <button onClick={share} className="flex flex-col items-center" aria-label={t('common.share')}>
          <IconShare3 size={30} />
        </button>
        <ReportButton targetType="reel" targetId={reel.id} variant="overlay" />
      </div>

      <div className="absolute inset-x-0 bottom-20 z-10 px-3 pr-20 text-white">
        {reel.product_id && reel.products && (
          <div className="mb-2 flex items-center gap-2 rounded-2xl bg-white/95 p-2 pr-3 shadow-lg">
            <Link to={`/product/${reel.product_id}`} className="flex min-w-0 flex-1 items-center gap-2">
              <img
                src={reel.products.images?.[0] ? storageThumbUrl('products', reel.products.images[0]) : '/favicon.svg'}
                alt={reel.products.name}
                className="h-11 w-11 shrink-0 rounded-input object-cover"
                onError={(e) => {
                  const full = reel.products.images?.[0] ? storageUrl('products', reel.products.images[0]) : null;
                  if (full && e.currentTarget.src !== full) e.currentTarget.src = full;
                }}
              />
              <div className="min-w-0">
                <p className="line-clamp-1 text-caption font-semibold text-ink">{reel.products.name}</p>
                <Price fcfa={reel.products.price_fcfa} className="text-caption font-semibold text-teal" />
              </div>
            </Link>
            <button
              onClick={buyProduct}
              disabled={reel.products.stock <= 0}
              className="flex shrink-0 items-center gap-1 rounded-pill bg-teal px-3 py-2 text-caption font-semibold text-white disabled:bg-hairline disabled:text-muted"
            >
              <IconShoppingBagPlus size={15} /> {t('fin.buyNow')}
            </button>
          </div>
        )}
        <Link to={`/boutique/${reel.shops?.slug}`} className="flex items-center gap-2 px-1" style={ICON_SHADOW}>
          <img
            src={reel.shops?.avatar_url ? storageThumbUrl('shops', reel.shops.avatar_url) : '/favicon.svg'}
            alt={reel.shops?.name}
            onError={(e) => {
              const full = reel.shops?.avatar_url ? storageUrl('shops', reel.shops.avatar_url) : null;
              if (full && e.currentTarget.src !== full) e.currentTarget.src = full;
            }}
            className="h-9 w-9 rounded-full border border-white/50 object-cover"
          />
          <span className="text-body font-semibold">{reel.shops?.name}</span>
        </Link>
        {reel.caption && <p className="mt-2 line-clamp-2 px-1 text-caption" style={ICON_SHADOW}>{reel.caption}</p>}
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
