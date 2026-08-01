import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconX, IconSparkles } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';

const DISMISS_KEY = 'finjaro_announcement_dismissed';

// Bandeau d'annonce en haut de l'app (la bande orange du prototype).
//
// Le texte vient de la table `announcements`, écrit depuis l'espace admin —
// jamais figé dans le build: une promo codée en dur continuerait de promettre
// une opération terminée depuis des mois. Sans annonce active, le composant
// ne rend RIEN (pas de bande vide qui mange 40 px en haut de chaque écran).
//
// Refermable: le choix est mémorisé par ID d'annonce, donc fermer celle du
// jour ne masque pas la suivante.
export function AnnouncementBanner() {
  const { i18n } = useTranslation();
  const [ann, setAnn] = useState(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from('announcements')
      .select('id, label, text_fr, text_en, href')
      .eq('active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive || !data) return;
        if (localStorage.getItem(DISMISS_KEY) === data.id) return;
        setAnn(data);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!ann) return null;

  const text = (i18n.language === 'en' && ann.text_en) || ann.text_fr;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, ann.id);
    } catch {
      /* navigation privée: on ferme quand même pour cette session */
    }
    setAnn(null);
  }

  const body = (
    <>
      {ann.label && (
        <span className="shrink-0 rounded-sm bg-white/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
          {ann.label}
        </span>
      )}
      <IconSparkles size={14} className="shrink-0" />
      <span className="truncate">{text}</span>
    </>
  );

  return (
    <div className="relative z-40 flex shrink-0 items-center gap-2 bg-teal px-3 py-2 text-caption font-semibold text-white">
      {ann.href ? (
        <Link to={ann.href} className="flex min-w-0 flex-1 items-center gap-2">
          {body}
        </Link>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2">{body}</span>
      )}
      <button
        onClick={dismiss}
        aria-label="Fermer"
        className="-mr-1 shrink-0 rounded-full p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        <IconX size={15} />
      </button>
    </div>
  );
}
