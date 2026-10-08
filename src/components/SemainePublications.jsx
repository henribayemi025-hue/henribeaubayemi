import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCalendarWeek, IconCopy, IconMovie, IconShare, IconX, IconPhotoStar, IconChevronDown } from '@tabler/icons-react';
import { supabase, storageUrl } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { track } from '../lib/track';
import { lienBoutique } from '../lib/statutDuJour';
import { planDeLaSemaine, texteDuJour, ideeVideo, dessinerPublication } from '../lib/semainePublications';
import { avecOrigine } from '../lib/origine';

// « Ma semaine de publications » dans l'espace vendeuse (08/10, voir
// lib/semainePublications.js) : sept publications prêtes avec ses articles,
// une par jour, et une idée de vidéo à filmer au téléphone. Un appui sur
// « Partager » fabrique l'image du jour et ouvre la feuille de partage du
// téléphone (Instagram, Facebook, WhatsApp…) ; ailleurs, on enregistre
// l'image et on copie le texte. Finjaro ne publie rien.

export function SemainePublications({ shop }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [articles, setArticles] = useState(null); // null = pas encore chargé
  const [occupe, setOccupe] = useState(null);
  const [video, setVideo] = useState(false);

  useEffect(() => {
    if (!ouvert || articles) return;
    let annule = false;
    supabase.from('products').select('id, name, price_fcfa, price_on_request, images, created_at')
      .eq('shop_id', shop.id).eq('is_active', true).order('created_at', { ascending: false }).limit(30)
      .then(({ data, error }) => {
        if (annule) return;
        if (error) { toast.error(t('errors.generic')); setOuvert(false); return; }
        setArticles(data || []);
      });
    return () => { annule = true; };
  }, [ouvert, articles, shop.id, t, toast]);

  const plan = useMemo(() => planDeLaSemaine(articles || []), [articles]);
  const lien = avecOrigine(`https://${lienBoutique(shop.slug)}`, 'semaine');
  const texte = (item) => texteDuJour(item, { shop, langue: i18n.language, lien, t });
  const jourNom = (jour) => {
    const d = new Date(Date.UTC(2026, 9, 4 + jour)); // le 5 octobre 2026 est un lundi
    return d.toLocaleDateString(i18n.language, { weekday: 'long', timeZone: 'UTC' });
  };

  async function copier(item) {
    try {
      await navigator.clipboard.writeText(texte(item));
      toast.success(t('semaine.copie', 'Texte copié : colle-le sous ta publication.'));
    } catch {
      toast.error(t('semaine.copieImpossible', 'Copie impossible : sélectionne le texte à la main.'));
    }
  }

  async function partager(item) {
    if (occupe) return;
    setOccupe(item.jour);
    try {
      const blob = await dessinerPublication({
        shop, item, langue: i18n.language,
        textes: { theme: t(`semaine.themes.${item.theme}`), prixSurDemande: t('statut.priceOnRequest', 'Prix sur demande') },
      });
      if (!blob) throw new Error('canvas');
      const fichier = new File([blob], `finjaro-${shop.slug}-${item.jour}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [fichier] })) {
        try {
          await navigator.share({ files: [fichier], text: texte(item) });
          track('share_shop', shop.id, { via: 'semaine_publications', jour: item.jour, step: 'shared' });
          return;
        } catch (e) {
          if (e?.name === 'AbortError') return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fichier.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      try {
        await navigator.clipboard.writeText(texte(item));
        toast.success(t('semaine.enregistree', 'Image enregistrée et texte copié : publie-les ensemble.'));
      } catch {
        toast.success(t('semaine.enregistreeSansCopie', 'Image enregistrée : ajoute le texte en dessous.'));
      }
      track('share_shop', shop.id, { via: 'semaine_publications', jour: item.jour, step: 'downloaded' });
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setOccupe(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="flex w-full items-center gap-2.5 rounded-card border border-teal/30 bg-teal/5 p-3 text-left transition active:scale-[0.99]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal/15 text-teal">
          <IconCalendarWeek size={20} />
        </span>
        <span className="min-w-0">
          <span className="block text-body font-semibold text-ink">{t('semaine.cardTitle', 'Ta semaine de publications')}</span>
          <span className="block text-caption text-muted">{t('semaine.cardHint', '7 publications prêtes avec tes articles, une par jour')}</span>
        </span>
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 sm:items-center" onClick={() => setOuvert(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('semaine.cardTitle', 'Ta semaine de publications')}
            onClick={(e) => e.stopPropagation()}
            className="animate-slide-up flex max-h-[88vh] w-full max-w-app flex-col rounded-t-card bg-base shadow-xl sm:rounded-card"
          >
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <p className="text-section font-semibold text-ink">{t('semaine.cardTitle', 'Ta semaine de publications')}</p>
              <button type="button" onClick={() => setOuvert(false)} aria-label={t('common.close')} className="rounded-full p-1 text-muted hover:bg-hairline">
                <IconX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {articles === null ? (
                <div className="space-y-2" aria-label={t('common.loading', 'Chargement…')}>
                  {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-card bg-hairline" />)}
                </div>
              ) : plan.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <IconPhotoStar size={40} className="text-muted" />
                  <p className="text-body text-ink">{t('semaine.aucun', 'Ajoute au moins un article avec une photo pour préparer ta semaine.')}</p>
                </div>
              ) : (
                <>
                  <p className="mb-3 text-caption text-muted">{t('semaine.aide', 'Chaque jour, touche « Partager » : l’image et le texte partent ensemble sur Instagram, Facebook ou WhatsApp. La semaine prochaine, d’autres articles.')}</p>
                  <ul className="space-y-2.5">
                    {plan.map((item) => (
                      <li key={item.jour} className="rounded-card border border-hairline p-2.5">
                        <div className="flex gap-2.5">
                          <img src={storageUrl('products', item.article.images[0])} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-input object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="text-caption font-semibold text-teal"><span className="capitalize">{jourNom(item.jour)}</span> · {t(`semaine.themes.${item.theme}`)}</p>
                            <p className="mt-0.5 line-clamp-3 whitespace-pre-line break-words text-caption text-ink">{texte(item)}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button type="button" onClick={() => partager(item)} disabled={!!occupe}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-teal px-3 py-2 text-caption font-semibold text-white disabled:opacity-60">
                            <IconShare size={15} /> {occupe === item.jour ? t('common.loading', 'Chargement…') : t('semaine.partager', 'Partager')}
                          </button>
                          <button type="button" onClick={() => copier(item)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-pill border border-hairline px-3 py-2 text-caption font-semibold text-ink">
                            <IconCopy size={15} /> {t('semaine.copier', 'Copier le texte')}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 rounded-card border border-brass/40 bg-brass/10 p-3">
                    <button type="button" onClick={() => setVideo((v) => !v)} className="flex w-full items-center gap-2 text-left">
                      <IconMovie size={18} className="shrink-0 text-brass" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-body font-semibold text-ink">{t('semaine.video.titre', 'Ton idée de vidéo de la semaine')}</span>
                        <span className="block text-caption text-muted">{t('semaine.video.aide', '15 secondes au téléphone, sans montage')}</span>
                      </span>
                      <IconChevronDown size={16} className={`shrink-0 text-muted transition ${video ? 'rotate-180' : ''}`} />
                    </button>
                    {video && (
                      <ol className="mt-2 space-y-1.5">
                        {ideeVideo(plan, t).map((p) => (
                          <li key={p.secondes} className="text-caption text-ink">
                            <span className="font-semibold tabular-nums text-brass">{p.secondes}</span> {p.texte}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
