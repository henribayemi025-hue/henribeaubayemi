import { useState, useEffect, useRef } from 'react';
import { IconPhoto } from '@tabler/icons-react';

// Lazy, decoding-async image with a graceful placeholder for flaky connections.
//
// `fallbackSrc`: optional full-size URL tried automatically if `src` (meant to
// be the lightweight thumbnail — see storageThumbUrl in lib/supabase.js) fails
// to load. A photo uploaded before thumbnails existed has no `_thumb` file, so
// its thumbnail URL 404s — this fallback means it still shows (at full size)
// instead of vanishing behind the placeholder icon.
//
// `placeholderSrc`: petite image affichée en flou pendant que `src` charge.
// Sert sur la fiche produit et le carrousel d'accueil, où `src` est la pleine
// taille — la vignette (480 px, 20-40 Ko) charge en 100-300 ms au Cameroun
// et remplit tout de suite l'espace, la vraie photo prend le relais quand
// elle est prête. À défaut de placeholder, un « shimmer » gris tourne le
// temps du chargement — jamais un fond vide avec juste une icône grise
// comme avant.
//
// `priority`: à mettre sur l'image « au-dessus de la ligne de flottaison » —
// la 1ʳᵉ photo d'une fiche produit, le hero de l'accueil. Passe le navigateur
// en loading=eager + fetchpriority=high pour qu'elle démarre AVANT tout le
// reste (elle DÉTERMINE le LCP mesuré par Google). Ne pas mettre partout,
// sinon plus rien n'est prioritaire.
// `fallback`: ce qu'on affiche à la place du cadre gris quand l'image
// renonce — l'initiale colorée d'une boutique, par exemple. Sans lui, une
// photo qui échoue laisse un rectangle gris muet.
//
// Une image qui ne répond NI succès NI erreur laissait l'animation de
// chargement tourner sans fin: c'est le rond gris vide que Beau a vu le
// 12/09 sur la liste des messages. Le navigateur ne déclenche `onError`
// que si la requête échoue vraiment — pas si elle reste suspendue. On
// pose donc notre propre limite de temps.
const DELAI_MAX_MS = 10_000;

export function SmartImage({ src, fallbackSrc, placeholderSrc, alt, className = '', rounded = '', fit = 'cover', priority = false, fallback = null }) {
  const [stage, setStage] = useState('primary'); // 'primary' | 'fallback' | 'failed'
  const [loaded, setLoaded] = useState(false);
  const stageRef = useRef(stage);
  stageRef.current = stage;
  // Lu par le compteur ci-dessous, qui ne doit pas se relancer à chaque
  // changement d'état — seulement quand l'image visée change.
  const loadedRef = useRef(false);
  loadedRef.current = loaded;

  useEffect(() => {
    setStage('primary');
    setLoaded(false);
  }, [src, fallbackSrc]);

  const current = stage === 'fallback' ? fallbackSrc : src;

  // Budget TOTAL, pas par tentative: sinon la vignette prend son délai, puis
  // la pleine taille le sien, et on fixe un rond gris deux fois plus
  // longtemps. Un vrai 404 continue, lui, de passer au repli tout de suite
  // par `handleError` — ce compteur n'est qu'un filet pour la requête qui
  // ne répond jamais.
  useEffect(() => {
    if (!src) return undefined;
    const id = setTimeout(() => {
      if (!loadedRef.current) setStage('failed');
    }, DELAI_MAX_MS);
    return () => clearTimeout(id);
  }, [src, fallbackSrc]);

  if (!current || stage === 'failed') {
    if (fallback) return fallback;
    return (
      <div className={`flex items-center justify-center bg-[#F3F3F3] ${className} ${rounded}`} aria-label={alt} role="img">
        <IconPhoto size={28} className="text-hairline" stroke={1.5} />
      </div>
    );
  }

  function handleError() {
    if (stageRef.current === 'primary' && fallbackSrc && fallbackSrc !== src) setStage('fallback');
    else setStage('failed');
  }

  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover';

  // Cas simple: pas de placeholder demandé — on rend l'image directement, avec
  // un fond gris derrière pour ne pas voir la trame de l'app pendant le
  // chargement. C'est le comportement historique, préservé pour ne pas
  // changer les cartes déjà correctes (ProductCard sert la vignette en `src`,
  // donc rien à placeholder).
  if (!placeholderSrc) {
    return (
      <div className={`relative overflow-hidden bg-[#F3F3F3] ${className} ${rounded}`}>
        {!loaded && <div className="absolute inset-0 animate-pulse bg-[#EDEAE3]" aria-hidden="true" />}
        <img
          src={current}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchpriority={priority ? 'high' : undefined}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`h-full w-full ${fitClass} transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    );
  }

  // Placeholder présent: on l'affiche EN PREMIER, en flou et légèrement zoomé
  // pour cacher les artefacts de compression du crop. La vraie image se pose
  // par-dessus avec une transition d'opacité quand elle est prête — pas de
  // clignotement, l'œil n'a pas l'impression d'un chargement.
  return (
    <div className={`relative overflow-hidden ${className} ${rounded}`}>
      <img
        src={placeholderSrc}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full scale-110 ${fitClass} blur-md`}
      />
      <img
        src={current}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchpriority={priority ? 'high' : undefined}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`relative h-full w-full ${fitClass} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
