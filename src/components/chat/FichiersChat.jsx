import { useLienSigne } from '../../lib/fichierPrive';
import { ChatImage } from './ChatImage';
import { VoiceMessage } from './VoiceMessage';

// Photo et vocal d'une conversation, lus par lien signé : le dossier « chat »
// est privé depuis le 01/10 (audit C-3). Seuls les deux participants, et
// l'équipe Finjaro, peuvent obtenir le lien.

export function ChatImagePrivee({ chemin, onOuvrir }) {
  const url = useLienSigne('chat', chemin);
  // En attente : pas de src (voile de chargement). Refusé : src vide, ce qui
  // fait afficher l'icône « photo indisponible » par ChatImage.
  return <ChatImage src={url === undefined ? undefined : url || ''} onClick={() => url && onOuvrir?.(url)} />;
}

export function VocalPrive({ chemin, seconds, mine }) {
  const url = useLienSigne('chat', chemin);
  return <VoiceMessage src={url || undefined} graine={chemin} seconds={seconds} mine={mine} />;
}
