import { useUrlFichier } from '../lib/fichierPrive';

// Rend l'adresse utilisable d'un fichier de Léo : lien signé pour un fichier
// du dossier privé, adresse inchangée sinon. `children` reçoit l'adresse
// (undefined tant que le lien n'est pas arrivé, null si l'accès est refusé).
export function AvecUrl({ url, children }) {
  return children(useUrlFichier(url));
}

// Un lien vers un fichier de Léo, privé ou non.
export function LienFichier({ href, children, ...props }) {
  const u = useUrlFichier(href);
  return <a href={u || undefined} aria-disabled={!u || undefined} {...props}>{children}</a>;
}
