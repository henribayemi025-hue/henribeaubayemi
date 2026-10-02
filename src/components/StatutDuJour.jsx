import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconBrandWhatsapp, IconDownload, IconX, IconPhotoStar } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { track } from '../lib/track';
import { choisirArticles, dessinerStatut, lienBoutique } from '../lib/statutDuJour';
import { avecOrigine } from '../lib/origine';
import { Button } from './Button';

// « Ton statut du jour » dans l'espace vendeuse (idée 1 du 01/10, voir
// lib/statutDuJour.js). Un appui fabrique l'image ; un second la partage
// (WhatsApp propose « Statut » dans la feuille de partage du téléphone).
// Sur un ordinateur, ou un navigateur qui ne partage pas de fichier, on
// télécharge l'image et on copie le lien.

export function StatutDuJour({ shop }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [image, setImage] = useState(null); // { blob, url }
  const [busy, setBusy] = useState(false);
  const [aucun, setAucun] = useState(false);

  useEffect(() => () => { if (image?.url) URL.revokeObjectURL(image.url); }, [image]);

  async function fabriquer() {
    setOuvert(true);
    if (image || busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price_fcfa, price_on_request, images, created_at')
        .eq('shop_id', shop.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      const articles = choisirArticles(data);
      if (articles.length === 0) { setAucun(true); return; }
      const blob = await dessinerStatut({
        shop,
        articles,
        langue: i18n.language,
        textes: {
          titre: t('statut.imageTitle', 'Ma sélection du jour'),
          invitation: t('statut.imageInvite', 'Commandez sur ma boutique'),
          prixSurDemande: t('statut.priceOnRequest', 'Prix sur demande'),
        },
      });
      if (!blob) throw new Error('canvas');
      setImage({ blob, url: URL.createObjectURL(blob) });
    } catch {
      toast.error(t('errors.generic'));
      setOuvert(false);
    } finally {
      setBusy(false);
    }
  }

  // Étiqueté : une visite venue du statut se reconnaît (02/10).
  const lien = avecOrigine(`https://${lienBoutique(shop.slug)}`, 'statut');
  const texte = t('statut.shareText', { link: lien, defaultValue: 'Ma sélection du jour 👉 {{link}}' });

  async function partager() {
    const fichier = new File([image.blob], `statut-${shop.slug}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [fichier] })) {
      try {
        await navigator.share({ files: [fichier], text: texte });
        track('share_shop', shop.id, { via: 'statut_du_jour', step: 'shared' });
        return;
      } catch (e) {
        if (e?.name === 'AbortError') return; // elle a fermé la feuille de partage
      }
    }
    telecharger();
  }

  async function telecharger() {
    const a = document.createElement('a');
    a.href = image.url;
    a.download = `statut-${shop.slug}.png`;
    a.click();
    try {
      await navigator.clipboard.writeText(texte);
      toast.success(t('statut.downloaded', 'Image enregistrée, lien copié : ajoute-les à ton statut.'));
    } catch {
      toast.success(t('statut.downloadedNoCopy', 'Image enregistrée : ajoute-la à ton statut avec le lien de ta boutique.'));
    }
    track('share_shop', shop.id, { via: 'statut_du_jour', step: 'downloaded' });
  }

  return (
    <>
      <button
        type="button"
        onClick={fabriquer}
        className="flex w-full items-center gap-2.5 rounded-card border border-brass/40 bg-brass/10 p-3 text-left transition active:scale-[0.99]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          <IconBrandWhatsapp size={20} />
        </span>
        <span className="min-w-0">
          <span className="block text-body font-semibold text-ink">{t('statut.cardTitle', 'Ton statut WhatsApp du jour')}</span>
          <span className="block text-caption text-muted">{t('statut.cardHint', '3 de tes articles et le lien de ta boutique, prêts à poster')}</span>
        </span>
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 sm:items-center" onClick={() => setOuvert(false)}>
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="animate-slide-up w-full max-w-app rounded-t-card bg-base p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-card"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-section font-semibold text-ink">{t('statut.cardTitle', 'Ton statut WhatsApp du jour')}</p>
              <button type="button" onClick={() => setOuvert(false)} aria-label={t('common.close')} className="rounded-full p-1 text-muted hover:bg-hairline">
                <IconX size={18} />
              </button>
            </div>

            {aucun ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <IconPhotoStar size={40} className="text-muted" />
                <p className="text-body text-ink">{t('statut.noProducts', 'Ajoute au moins un article avec une photo pour fabriquer ton statut.')}</p>
              </div>
            ) : !image ? (
              <div className="mx-auto aspect-[9/16] w-1/2 animate-pulse rounded-card bg-hairline" aria-label={t('common.loading', 'Chargement…')} />
            ) : (
              <>
                <img src={image.url} alt="" className="mx-auto aspect-[9/16] w-1/2 rounded-card object-cover shadow-md" />
                <p className="mt-3 text-center text-caption text-muted">
                  {t('statut.howTo', 'Partage-la sur WhatsApp et choisis « Mon statut ». Demain, l’image change toute seule.')}
                </p>
                <div className="mt-3 grid gap-2">
                  <Button onClick={partager}><IconBrandWhatsapp size={18} /> {t('statut.share', 'Partager')}</Button>
                  <button type="button" onClick={telecharger} className="flex items-center justify-center gap-1.5 py-1 text-caption font-semibold text-muted">
                    <IconDownload size={15} /> {t('statut.download', 'Enregistrer l’image')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
