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
  // Les diapositives DÉFILENT (translateX) au lieu de se fondre l'une dans
  // l'autre. Le fondu croisé superposait les deux titres pendant les 700 ms
  // de transition — on lisait "Kit de pinceaux" par-dessus "…de fleurs…",
  // illisible sur un vrai téléphone (signalé par Beau, capture à l'appui).
  // Un défilement ne peut pas produire ça: une seule diapo occupe le cadre.
  //
  // `loading="lazy"` ne servirait à rien ici (toutes les diapos sont montées
  // côte à côte), donc on garde le préchargement manuel: seule la diapo
  // courante et ses voisines immédiates reçoivent un `src`. Sans ça, un
  // chargement à froid téléchargeait les 8 images (~570 Ko) d'un coup.
  const [warm, setWarm] = useState(() => new Set([0, 1, SLIDE_COUNT - 1]));

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

  useEffect(() => {
    const n = slides.length;
    const nearby = [index, (index - 1 + n) % n, (index + 1) % n];
    setWarm((prev) => {
      if (nearby.every((i) => prev.has(i))) return prev; // no new fetch needed
      const next = new Set(prev);
      nearby.forEach((i) => next.add(i));
      return next;
    });
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
      className="relative aspect-[2/1] w-full max-h-96 touch-pan-y select-none overflow-hidden rounded-[20px] shadow-md lg:aspect-[3/1]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Rail horizontal: une seule diapo est dans le cadre à tout instant. */}
      <div
        className="flex h-full w-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s, i) => {
          const key = isProducts ? s.id : s.cat;
          const href = isProducts ? `/product/${s.id}` : `/category/${s.cat}`;
          // undefined (not null) so React omits the src attribute entirely for
          // a not-yet-warm slide — the browser never issues a request for it.
          const image = warm.has(i)
            ? (isProducts ? (s.images?.[0] ? storageUrl('products', s.images[0]) : null) : s.image)
            : undefined;
          return (
            <Link
              key={key}
              to={href}
              onClick={(e) => { if (dragged.current) e.preventDefault(); }}
              tabIndex={i === index ? 0 : -1}
              aria-hidden={i !== index}
              className="relative flex h-full w-full shrink-0 flex-col items-start justify-end p-4 text-left"
            >
              {image && (
                <>
                  {/* La photo REMPLIT le cadre. L'ancien montage — fond flou +
                      photo entière au centre — voulait ne jamais couper un
                      visage, mais sur une bannière large avec une photo en
                      portrait il produisait deux grosses bandes grises: ça ne
                      se lisait pas comme un choix, ça se lisait comme une
                      image cassée (signalé par Beau).
                      `object-top` garde le haut du cadrage, donc les visages,
                      qui sont presque toujours dans le tiers supérieur. Le
                      montage flou reste en place sur les fiches article, où
                      le cadre est carré et où rien n'est coupé. */}
                  <img src={image} alt="" draggable="false" className="absolute inset-0 h-full w-full object-cover object-top" />
                </>
              )}
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
      </div>
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
