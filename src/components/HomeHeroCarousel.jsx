import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storageUrl } from '../lib/supabase';
import { Price } from './Price';
import mode from '../assets/categories/hero-mode.webp';
import beaute from '../assets/categories/hero-beaute.webp';
import evenement from '../assets/categories/hero-evenement.webp';
import deco from '../assets/categories/hero-deco.webp';
import mariages from '../assets/categories/hero-mariages.webp';
import cheveux from '../assets/categories/hero-cheveux.webp';
import montres from '../assets/categories/hero-montres.webp';
import accessoires from '../assets/categories/hero-accessoires.webp';

// Static fallback (category art), used only while products haven't loaded
// yet or if the catalog is too small for a real "top articles" carousel.
const CATEGORY_SLIDES = [
  { cat: 'mode', image: mode },
  { cat: 'beaute', image: beaute },
  { cat: 'mariages', image: mariages },
  { cat: 'evenement', image: evenement },
  { cat: 'cheveux', image: cheveux },
  { cat: 'deco', image: deco },
  { cat: 'montres', image: montres },
  { cat: 'accessoires', image: accessoires },
];

const SWIPE_THRESHOLD = 40; // px
const SLIDE_COUNT = 8;

// Changes once a day (same seed all day, new seed tomorrow) so the featured
// picks rotate without reshuffling on every reload — a stable "today's picks".
function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Auto-rotating promo banner (Amazon-style): today's top articles, picked
// from the highest-viewed products and reshuffled once per day so it isn't
// the same lineup every time — falls back to category art while products
// are still loading or the catalog is too thin. Swipeable and dot-tappable;
// manual interaction resets the auto-advance timer.
export function HomeHeroCarousel({ products }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const dragX = useRef(null);
  const dragged = useRef(false);

  const productSlides = useMemo(() => {
    if (!products || products.length < 4) return null;
    const topPool = [...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 20);
    return seededShuffle(topPool, todaySeed()).slice(0, SLIDE_COUNT);
  }, [products]);

  const slides = productSlides || CATEGORY_SLIDES;
  const isProducts = !!productSlides;

  useEffect(() => {
    setIndex(0);
  }, [isProducts]);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(id);
  }, [index, slides.length]);

  function goTo(i) {
    setIndex((i + slides.length) % slides.length);
  }

  function onPointerDown(e) {
    dragX.current = e.clientX;
    dragged.current = false;
  }
  function onPointerMove(e) {
    if (dragX.current == null) return;
    if (Math.abs(e.clientX - dragX.current) > 10) dragged.current = true;
  }
  function onPointerUp(e) {
    if (dragX.current == null) return;
    const delta = e.clientX - dragX.current;
    dragX.current = null;
    if (delta > SWIPE_THRESHOLD) goTo(index - 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(index + 1);
  }

  return (
    <div
      className="relative aspect-[2/1] w-full max-h-96 touch-pan-y select-none overflow-hidden rounded-2xl lg:aspect-[3/1]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {slides.map((s, i) => {
        const key = isProducts ? s.id : s.cat;
        const href = isProducts ? `/product/${s.id}` : `/category/${s.cat}`;
        const image = isProducts ? (s.images?.[0] ? storageUrl('products', s.images[0]) : null) : s.image;
        return (
          <Link
            key={key}
            to={href}
            onClick={(e) => { if (dragged.current) e.preventDefault(); }}
            className={`absolute inset-0 flex h-full w-full flex-col items-start justify-end p-4 text-left transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            {image && <img src={image} alt="" draggable="false" className="absolute inset-0 h-full w-full object-cover object-top" />}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
            {isProducts ? (
              <>
                <span className="relative mb-1 inline-flex w-fit items-center rounded-pill bg-brass px-2 py-0.5 text-[11px] font-bold uppercase text-white">
                  {t('home.topPick')}
                </span>
                <p className="relative line-clamp-1 text-title font-semibold text-white">{s.name}</p>
                <Price fcfa={s.price_fcfa} className="relative text-body font-semibold text-white" />
              </>
            ) : (
              <>
                <p className="relative text-title font-semibold text-white">{t(`categories.${s.cat}`)}</p>
                <p className="relative text-caption text-white/80">{t('home.heroCta')}</p>
              </>
            )}
          </Link>
        );
      })}
      <div className="absolute bottom-2 right-3 flex gap-1.5">
        {slides.map((s, i) => (
          <button
            key={isProducts ? s.id : s.cat}
            onClick={() => goTo(i)}
            aria-label={isProducts ? s.name : t(`categories.${s.cat}`)}
            className="p-1"
          >
            <span className={`block h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
