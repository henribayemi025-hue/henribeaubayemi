// Le bloc cité, façon WhatsApp: barre de couleur à gauche, nom de l'auteur,
// puis un extrait. Sert à deux endroits — au-dessus de la zone de saisie
// pendant qu'on rédige la réponse, et à l'intérieur de la bulle une fois
// envoyée. Même composant pour que les deux ne divergent jamais.
export function apercuMessage(m, t) {
  if (!m) return t('chat.deletedMessage');
  if (m.body) return m.body;
  if (m.audio_url) return `🎤 ${t('chat.voiceMessage')}`;
  if (m.image_url) return `📷 ${t('chat.photo')}`;
  return '—';
}

export function QuotedMessage({ message, auteur, mine = false, onClick = null, onClose = null, t }) {
  const Balise = onClick ? 'button' : 'div';
  return (
    <Balise
      type={onClick ? 'button' : undefined}
      onClick={onClick || undefined}
      className={`flex w-full min-w-0 items-stretch gap-2 overflow-hidden rounded-input text-left ${
        mine ? 'bg-white/15' : 'bg-base'
      } ${onClick ? 'transition-opacity hover:opacity-80' : ''}`}
    >
      <span className={`w-1 shrink-0 rounded-full ${mine ? 'bg-white/70' : 'bg-teal'}`} />
      <span className="min-w-0 flex-1 py-1.5 pr-2">
        <span className={`block text-[11px] font-semibold ${mine ? 'text-white/90' : 'text-teal'}`}>{auteur}</span>
        <span className={`block line-clamp-2 text-caption ${mine ? 'text-white/80' : 'text-muted'}`}>
          {apercuMessage(message, t)}
        </span>
      </span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="shrink-0 px-2 text-muted hover:text-ink"
        >
          ×
        </button>
      )}
    </Balise>
  );
}
