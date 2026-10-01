// Fichiers des dossiers PRIVÉS (photos et vocaux des conversations, documents
// des entreprises de Léo) : audit du 01/10, C-2 et C-3.
//
// Un dossier public sert n'importe quel fichier à quiconque a son adresse,
// sans compte et pour toujours. Ici le stockage ne délivre un fichier qu'à une
// personne connectée qui a le droit de le lire (règles d'accès en base), sous
// la forme d'un lien signé qui expire au bout d'une heure.
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

const DUREE_S = 3600;
const cache = new Map();

export async function lienSigne(dossier, chemin) {
  if (!dossier || !chemin) return null;
  const cle = `${dossier}/${chemin}`;
  const connu = cache.get(cle);
  // Une minute de marge : un lien qui expire pendant la lecture d'un vocal
  // couperait le son.
  if (connu && connu.expire > Date.now() + 60_000) return connu.url;
  const { data, error } = await supabase.storage.from(dossier).createSignedUrl(chemin, DUREE_S);
  if (error || !data?.signedUrl) return null;
  cache.set(cle, { url: data.signedUrl, expire: Date.now() + DUREE_S * 1000 });
  return data.signedUrl;
}

// undefined tant que le lien n'est pas arrivé, null si l'accès est refusé.
export function useLienSigne(dossier, chemin) {
  const [url, setUrl] = useState(undefined);
  useEffect(() => {
    let vivant = true;
    setUrl(undefined);
    lienSigne(dossier, chemin).then((u) => { if (vivant) setUrl(u); }, () => { if (vivant) setUrl(null); });
    return () => { vivant = false; };
  }, [dossier, chemin]);
  return url;
}
