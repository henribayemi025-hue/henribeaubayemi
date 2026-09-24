import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconLoader2 } from '@tabler/icons-react';
import { Modal } from './Modal';
import { Button } from './Button';

// Les deux fonds proposés. Le crème est celui de l'application (`base` dans
// tailwind.config.js), pour que l'article paraisse posé chez Finjaro.
const FONDS = { creme: '#FAF6F0', blanc: '#FFFFFF' };

// « Retirer le fond » (demande de Beau, 24/09): la vendeuse touche « Fond »
// sur une photo d'article, voit l'avant/après, choisit crème ou blanc, puis
// garde ou annule. Rien n'est envoyé tant qu'elle n'a pas choisi « Garder ».
//
// Le détourage tourne dans le navigateur (lib/detourage.js + Web Worker):
// pas de serveur, pas de clé, et la photo ne quitte pas le téléphone avant
// l'envoi habituel. Le moteur n'est chargé qu'ici, à la première ouverture.
//
// `source`: adresse de la photo déjà envoyée. `onKeep(blob)`: reçoit l'image
// finale; c'est l'écran appelant qui l'envoie par le chemin habituel.
export function RetirerFond({ source, onClose, onKeep }) {
  const { t } = useTranslation();
  const [etape, setEtape] = useState('chargement'); // chargement | detourage | pret | erreur
  const [fond, setFond] = useState('creme');
  const [apercu, setApercu] = useState(null); // { url, blob }
  const [envoi, setEnvoi] = useState(false);
  const moduleRef = useRef(null);
  const decoupeRef = useRef(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      const mod = await import('../lib/detourage');
      moduleRef.current = mod;
      const [image] = await Promise.all([
        fetch(source).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.blob();
        }),
        mod.preparer(),
      ]);
      if (annule) return;
      setEtape('detourage');
      const decoupe = await mod.detourer(image);
      if (annule) return;
      decoupeRef.current = decoupe;
      setEtape('pret');
    })().catch(() => {
      if (!annule) setEtape('erreur');
    });
    return () => {
      annule = true;
    };
  }, [source]);

  // Recompose à chaque changement de fond: le masque est gardé, seul le fond
  // change — instantané.
  useEffect(() => {
    if (etape !== 'pret' || !decoupeRef.current) return undefined;
    let annule = false;
    let url = null;
    const mod = moduleRef.current;
    mod.composer(decoupeRef.current, FONDS[fond]).then((blob) => {
      if (annule) return;
      url = URL.createObjectURL(blob);
      setApercu({ url, blob });
    }).catch(() => !annule && setEtape('erreur'));
    return () => {
      annule = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [etape, fond]);

  async function garder() {
    if (!apercu) return;
    setEnvoi(true);
    try {
      await onKeep(apercu.blob);
    } finally {
      setEnvoi(false);
    }
  }

  const tuile = 'aspect-square w-full overflow-hidden rounded-card border border-hairline bg-base';

  return (
    <Modal open onClose={envoi ? () => {} : onClose} title={t('vendor.removeBg')}>
      <div className="grid grid-cols-2 gap-2">
        <figure>
          <div className={tuile}>
            <img src={source} alt="" className="h-full w-full object-contain" />
          </div>
          <figcaption className="mt-1 text-center text-caption text-muted">{t('vendor.removeBgBefore')}</figcaption>
        </figure>
        <figure>
          <div className={`${tuile} flex items-center justify-center`}>
            {etape === 'pret' && apercu ? (
              <img src={apercu.url} alt="" className="h-full w-full object-contain" />
            ) : etape === 'erreur' ? null : (
              <IconLoader2 size={26} className="animate-spin text-teal" />
            )}
          </div>
          <figcaption className="mt-1 text-center text-caption text-muted">{t('vendor.removeBgAfter')}</figcaption>
        </figure>
      </div>

      <p className="mt-3 text-caption text-muted" aria-live="polite">
        {etape === 'chargement' && t('vendor.removeBgLoading')}
        {etape === 'detourage' && t('vendor.removeBgWorking')}
        {etape === 'pret' && t('vendor.removeBgCheck')}
        {etape === 'erreur' && <span className="text-danger">{t('vendor.removeBgError')}</span>}
      </p>

      {etape === 'pret' && (
        <div className="mt-3 flex items-center gap-2" role="group" aria-label={t('vendor.removeBgBackdrop')}>
          <span className="text-caption font-semibold text-ink">{t('vendor.removeBgBackdrop')}</span>
          {[
            ['creme', t('vendor.removeBgCream')],
            ['blanc', t('vendor.removeBgWhite')],
          ].map(([cle, libelle]) => (
            <button
              key={cle}
              type="button"
              onClick={() => setFond(cle)}
              aria-pressed={fond === cle}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-semibold ${
                fond === cle ? 'border-teal text-teal' : 'border-hairline text-ink'
              }`}
            >
              <span className="h-4 w-4 rounded-full border border-hairline" style={{ background: FONDS[cle] }} />
              {libelle}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onClose} disabled={envoi}>
          {t('common.cancel')}
        </Button>
        <Button onClick={garder} loading={envoi} disabled={etape !== 'pret' || !apercu}>
          {t('vendor.removeBgKeep')}
        </Button>
      </div>
    </Modal>
  );
}
