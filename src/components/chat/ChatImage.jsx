import { useState } from 'react';
import { IconPhoto } from '@tabler/icons-react';

// Photo envoyée dans le chat.
//
// Beau: « la photo dans le chat, ça ne fit pas dans le truc ». Elle était
// enfermée dans un carré de 160 px avec recadrage: une photo verticale (le
// cas courant depuis un téléphone) se faisait couper en haut et en bas. Ici
// la photo garde SES proportions, on plafonne seulement la hauteur.
//
// L'image n'est JAMAIS masquée par display:none pendant le chargement: un
// navigateur ne charge pas une image en chargement paresseux qui n'est pas
// rendue, donc elle restait sur le voile gris indéfiniment. Elle est donc
// toujours dans la page, simplement transparente, avec le voile par-dessus.
export function ChatImage({ src, onClick, alt = '' }) {
  const [etat, setEtat] = useState('chargement'); // chargement | ok | echec

  if (etat === 'echec') {
    return (
      <div
        className="mb-1 flex h-32 w-44 items-center justify-center rounded-input bg-[#F3F3F3]"
        role="img"
        aria-label={alt}
      >
        <IconPhoto size={26} className="text-hairline" stroke={1.5} />
      </div>
    );
  }

  const enCours = etat === 'chargement';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative mb-1 block overflow-hidden rounded-input ${enCours ? 'h-32 w-44' : ''}`}
    >
      {enCours && <span className="absolute inset-0 animate-pulse rounded-input bg-[#EDEAE3]" aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        decoding="async"
        onLoad={() => setEtat('ok')}
        onError={() => setEtat('echec')}
        className={`block max-h-72 w-auto max-w-full rounded-input object-contain transition-opacity duration-200 ${
          enCours ? 'h-full w-full opacity-0' : 'opacity-100'
        }`}
      />
    </button>
  );
}
