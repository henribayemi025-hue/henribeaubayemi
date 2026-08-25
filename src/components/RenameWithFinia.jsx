import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSparkles, IconCheck } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl } from '../lib/supabase';
import { runPool, sleep, AI_POOL, AI_SPACING_MS } from '../lib/pool';
import { useToast } from '../hooks/useToast';
import { Modal } from './Modal';
import { Button } from './Button';
import { TextInput } from './Field';
import { SmartImage } from './SmartImage';

// Rendre lisibles les articles que « Appliquer à tous » a numérotés.
//
// Beau, en découvrant les 120: « je ne sais pas comment on va faire pour les
// cent vingt articles, on va seulement se battre ».
//
// Il n'y a pas à se battre: les photos sont là, les prix sont là, il ne
// manque que le nom — et Finia sait le lire sur la photo, c'est déjà ce
// qu'elle fait dans l'ajout en masse. Ce qui manquait, c'était un chemin
// pour les articles DÉJÀ publiés.
//
// TROIS RÈGLES, et elles ne sont pas négociables:
//
//   * Rien n'est enregistré sans que la vendeuse ait vu la proposition. Un
//     nom d'article, c'est sa boutique, pas la nôtre. L'écran propose, elle
//     valide — et elle peut corriger chaque ligne avant.
//   * Chaque proposition est faite d'APRÈS SA PHOTO. Rien n'est inventé:
//     Finia décrit ce qu'elle voit, elle ne devine pas ce qui pourrait s'y
//     trouver.
//   * On ne touche ni au prix, ni au rayon, ni au stock. Uniquement le nom.
//     La vendeuse a fixé le reste; le reprendre « pendant qu'on y est »
//     serait modifier son travail sans qu'elle l'ait demandé.
export function RenameWithFinia({ open, onClose, products, onSaved }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  // { id, image, ancien, propose } — `propose` vide tant que Finia n'a pas lu.
  const [lignes, setLignes] = useState(() =>
    products.map((p) => ({ id: p.id, image: p.images?.[0] ?? null, ancien: p.name, propose: '' })),
  );
  const [avance, setAvance] = useState(null); // { fait, total } pendant la lecture
  const [saving, setSaving] = useState(false);

  const pretes = lignes.filter((l) => l.propose.trim() && l.propose.trim() !== l.ancien);

  async function lireLesPhotos() {
    const todo = lignes.map((l, i) => ({ ...l, i })).filter((l) => !l.propose.trim());
    if (!todo.length) return;
    setAvance({ fait: 0, total: todo.length });
    await runPool(todo, AI_POOL, async (ligne) => {
      try {
        const { data, error } = await supabase.functions.invoke('vendor-copilot', {
          body: { mode: 'listing', image_path: ligne.image, lang: i18n.language },
        });
        if (error || !data?.title) throw error || new Error('empty');
        setLignes((ls) => ls.map((l, idx) => (idx === ligne.i ? { ...l, propose: data.title } : l)));
      } catch {
        // Meilleur effort: cette photo restera sans proposition, et la
        // vendeuse gardera son nom actuel. Mieux vaut une ligne vide qu'un
        // nom au hasard sur un article en vente.
      } finally {
        setAvance((p) => (p ? { ...p, fait: p.fait + 1 } : p));
        await sleep(AI_SPACING_MS);
      }
    });
    setAvance(null);
  }

  async function enregistrer() {
    if (!pretes.length) return;
    setSaving(true);
    // Un article à la fois: une écriture groupée sur `products` demanderait
    // un upsert avec toutes les colonnes obligatoires, et écraserait le prix
    // ou le stock si l'une d'elles manquait à l'appel.
    let ok = 0;
    let dernierEchec = '';
    for (const l of pretes) {
      const { error } = await supabase
        .from('products')
        .update({ name: l.propose.trim() })
        .eq('id', l.id);
      if (error) dernierEchec = error.message;
      else ok += 1;
    }
    setSaving(false);
    if (!ok) {
      toast.error(dernierEchec || t('errors.generic'));
      return;
    }
    toast.success(t('vendor.renameSaved', { count: ok }));
    onSaved?.(Object.fromEntries(pretes.slice(0, ok).map((l) => [l.id, l.propose.trim()])));
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t('vendor.renameTitle')}>
      <div className="space-y-3">
        <p className="text-caption text-muted">{t('vendor.renameIntro', { count: lignes.length })}</p>

        {avance ? (
          <div className="rounded-card border border-hairline p-3">
            <p className="text-caption text-ink">{t('vendor.renameReading', avance)}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-hairline">
              <div
                className="h-full bg-teal transition-all"
                style={{ width: `${Math.round((avance.fait / avance.total) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <Button onClick={lireLesPhotos} disabled={saving}>
            <IconSparkles size={18} /> {t('vendor.renameRun')}
          </Button>
        )}

        <ul className="space-y-2">
          {lignes.map((l, i) => (
            <li key={l.id} className="flex items-start gap-2 rounded-card border border-hairline p-2">
              <SmartImage
                src={l.image ? storageThumbUrl('products', l.image) : null}
                fallbackSrc={l.image ? storageUrl('products', l.image) : null}
                alt={l.ancien}
                className="h-14 w-14 shrink-0 rounded-input"
              />
              <div className="min-w-0 flex-1">
                {/* L'ancien nom reste visible: c'est ce qui permet de voir
                    d'un coup d'oeil que la proposition parle bien du meme
                    article, et de refuser si ce n'est pas le cas. */}
                <p className="truncate text-[11px] text-muted line-through">{l.ancien}</p>
                <TextInput
                  value={l.propose}
                  placeholder={t('vendor.renamePlaceholder')}
                  onChange={(e) =>
                    setLignes((ls) => ls.map((x, idx) => (idx === i ? { ...x, propose: e.target.value } : x)))
                  }
                  className="mt-1 text-caption"
                />
              </div>
            </li>
          ))}
        </ul>

        <Button onClick={enregistrer} loading={saving} disabled={!pretes.length}>
          <IconCheck size={18} /> {t('vendor.renameSave', { count: pretes.length })}
        </Button>
        <p className="text-[11px] text-muted">{t('vendor.renameFootnote')}</p>
      </div>
    </Modal>
  );
}
