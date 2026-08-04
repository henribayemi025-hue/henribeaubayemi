import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconTrash, IconPhotoPlus, IconSparkles, IconLoader2, IconX } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { compressForUploadWithThumb } from '../../lib/image';
import { isVideoFile, videoDuration, videoPoster, posterPathFor, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from '../../lib/video';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Field, TextInput, TextArea, Select } from '../../components/Field';
import { ImageUpload } from '../../components/ImageUpload';
import { Spinner } from '../../components/Spinner';
import { CATEGORIES, attributeFieldsFor, SELECTABLE_SUBCATEGORIES, categoryHeadFor } from '../../lib/categories';
import { currencyForCountry } from '../../lib/currency';
import { convertFromFcfa, toFcfa } from '../../lib/currency';

const blank = { name: '', price_fcfa: '', compare_at_price_fcfa: '', description: '', category: 'femme_robes', stock: '1', images: [], video_url: null, price_on_request: false, sizes: [], colors: [], is_permanent: false, attributes: {} };
const MAX_IMAGES = 10;

// Tailles proposées en un clic selon le rayon: lettres pour les vêtements,
// pointures pour les chaussures. La vendeuse peut toujours taper la sienne
// (ex: « 38-40 », « Unique ») — les presets accélèrent, ils n'enferment pas.
const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const SIZED_HEADS = ['mode_femme', 'mode_homme', 'mode_a_trier', 'enfants_bebe', 'sport_loisirs'];

function sizePresetsFor(categoryId) {
  if (String(categoryId).includes('chaussures')) return SHOE_SIZES;
  if (SIZED_HEADS.includes(categoryHeadFor(categoryId))) return LETTER_SIZES;
  return null;
}

// Éditeur de liste courte (tailles, couleurs): presets en un tap + saisie
// libre. Les valeurs choisies restent visibles en chips actives, un tap
// les retire — même geste que les catégories de la boutique.
function TagPicker({ label, hint, values, presets, onChange, addLabel }) {
  const [draft, setDraft] = useState('');
  const list = values || [];

  function toggle(v) {
    onChange(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }
  function addDraft() {
    const v = draft.trim();
    if (!v) return;
    if (!list.includes(v)) onChange([...list, v]);
    setDraft('');
  }

  const extras = list.filter((v) => !(presets || []).includes(v));
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap gap-2">
        {(presets || []).map((v) => (
          <button key={v} type="button" onClick={() => toggle(v)} className={`chip ${list.includes(v) ? 'chip-active' : 'text-ink'}`}>
            {v}
          </button>
        ))}
        {extras.map((v) => (
          <button key={v} type="button" onClick={() => toggle(v)} className="chip chip-active">
            {v} ×
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDraft(); } }}
          placeholder={addLabel}
          className="flex-1"
        />
        <button type="button" onClick={addDraft} className="btn-ghost shrink-0 text-caption">{addLabel}</button>
      </div>
      {hint && <p className="mt-1 text-caption text-muted">{hint}</p>}
    </div>
  );
}

export default function VendorProductEdit() {
  const { id } = useParams();
  const { shop } = useOutletContext();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const multiRef = useRef(null);
  const isNew = id === 'new';
  // Vendors enter prices in their shop's own currency (France → EUR, Cameroun →
  // FCFA…). We store canonically in FCFA and convert on the way in/out.
  const shopCurrency = currencyForCountry(shop.country);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0); // images still uploading
  const [errors, setErrors] = useState({});
  const [genLoading, setGenLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null); // AI draft, editable before use
  const [listingLoading, setListingLoading] = useState(false);
  const [priceHint, setPriceHint] = useState(null); // { fcfa, samples } — médiane catalogue
  const [scriptLoading, setScriptLoading] = useState(false);
  const [reelScript, setReelScript] = useState(null);

  // Auto-Listing (Finou 2.0 #12, partie texte): la première photo déjà
  // uploadée → titre + description + catégorie proposés d'un coup. Tout
  // atterrit dans les champs ÉDITABLES, rien n'est enregistré sans que la
  // vendeuse relise et sauve elle-même. Le repère de prix est la médiane du
  // catalogue (calculée serveur), jamais un chiffre inventé par l'IA.
  async function fillFromPhoto() {
    if (!form.images[0]) return;
    setListingLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vendor-copilot', {
        body: { mode: 'listing', image_path: form.images[0], lang: i18n.language },
      });
      if (error || !data?.title) throw error || new Error('empty');
      setForm((f) => ({
        ...f,
        // On ne piétine jamais ce que la vendeuse a déjà tapé.
        name: f.name.trim() ? f.name : data.title,
        description: f.description.trim() ? f.description : data.description,
        category: data.category || f.category,
      }));
      setPriceHint(data.price_hint_fcfa ? { fcfa: data.price_hint_fcfa, samples: data.price_samples } : null);
      toast.success(t('vendor.listingFilled'));
    } catch {
      toast.error(t('vendor.copilotError'));
    } finally {
      setListingLoading(false);
    }
  }

  // Script Reel/TikTok (Finou 2.0 #15, partie texte) pour promouvoir la fiche.
  async function generateReelScript() {
    if (!form.name.trim()) {
      toast.info(t('vendor.copilotNeedName'));
      return;
    }
    setScriptLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vendor-copilot', {
        body: { mode: 'reel_script', name: form.name.trim(), description: form.description, lang: i18n.language },
      });
      if (error || !data?.scenes) throw error || new Error('empty');
      setReelScript(data);
    } catch {
      toast.error(t('vendor.copilotError'));
    } finally {
      setScriptLoading(false);
    }
  }

  // Vendor Copilot: ask Gemini (via the vendor-copilot edge fn) for a marketing
  // description. Never auto-fills — the draft lands in an editable preview the
  // vendor validates with "Utiliser".
  async function generateDescription() {
    if (!form.name.trim()) {
      toast.info(t('vendor.copilotNeedName'));
      return;
    }
    setGenLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vendor-copilot', {
        body: {
          name: form.name.trim(),
          category: form.category,
          price: form.price_fcfa,
          currency: shopCurrency,
          lang: i18n.language,
        },
      });
      if (error || !data?.description) throw error || new Error('empty');
      setSuggestion(data.description);
    } catch {
      toast.error(t('vendor.copilotError'));
    } finally {
      setGenLoading(false);
    }
  }

  useEffect(() => {
    if (isNew) return;
    supabase.from('products').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) {
        const shown = convertFromFcfa(data.price_fcfa, shopCurrency);
        const shownCompare = data.compare_at_price_fcfa != null ? convertFromFcfa(data.compare_at_price_fcfa, shopCurrency) : null;
        setForm({
          ...data,
          price_fcfa: String(shopCurrency === 'FCFA' ? Math.round(shown) : Number(shown.toFixed(2))),
          compare_at_price_fcfa: shownCompare == null ? '' : String(shopCurrency === 'FCFA' ? Math.round(shownCompare) : Number(shownCompare.toFixed(2))),
          stock: String(data.stock ?? 0),
          images: data.images || [],
          sizes: data.sizes || [],
          colors: data.colors || [],
          attributes: data.attributes || {},
        });
      }
      setLoading(false);
    });
  }, [id, isNew, shopCurrency]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = t('common.required');
    // Un article « sur demande » n'a par définition pas de prix à saisir.
    if (!form.price_on_request && (form.price_fcfa === '' || Number(form.price_fcfa) < 0)) {
      e.price = t('common.required');
    }
    // Un prix barré ne veut rien dire s'il n'est pas STRICTEMENT au-dessus du
    // prix demandé — sinon on afficherait une "promo" à l'envers ou à 0 %.
    if (form.compare_at_price_fcfa !== '' && Number(form.compare_at_price_fcfa) <= Number(form.price_fcfa || 0)) {
      e.compareAtPrice = t('vendor.compareAtPriceError');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    if (uploads > 0) {
      toast.info(t('vendor.imageStillUploading'));
      return;
    }
    setBusy(true);
    // Guard against a stalled network request leaving the button spinning
    // forever: abort after 25s and surface a retryable error instead.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const payload = {
        shop_id: shop.id,
        name: form.name.trim(),
        price_on_request: !!form.price_on_request,
        // Sur demande: on stocke 0 et l'affichage acheteur ne montre jamais
        // ce chiffre (voir isPriceOnRequest).
        price_fcfa: form.price_on_request ? 0 : toFcfa(Number(form.price_fcfa), shopCurrency),
        compare_at_price_fcfa: form.compare_at_price_fcfa === '' ? null : toFcfa(Number(form.compare_at_price_fcfa), shopCurrency),
        description: form.description.trim() || null,
        category: form.category,
        stock: Math.max(0, Math.round(Number(form.stock) || 0)),
        images: form.images.filter(Boolean),
        video_url: form.video_url || null,
        sizes: (form.sizes || []).filter(Boolean),
        colors: (form.colors || []).filter(Boolean),
        is_permanent: !!form.is_permanent,
        // Seuls les champs de la catégorie choisie partent en base — changer
        // de catégorie ne laisse pas traîner la surface d'un ancien brouillon
        // immobilier sur une paire de chaussures.
        attributes: Object.fromEntries(
          attributeFieldsFor(form.category)
            .map(({ key }) => [key, String(form.attributes?.[key] ?? '').trim()])
            .filter(([, v]) => v !== '')
        ),
      };
      const res = isNew
        ? await supabase.from('products').insert(payload).abortSignal(controller.signal)
        : await supabase.from('products').update(payload).eq('id', id).abortSignal(controller.signal);
      if (res.error) throw res.error;
      toast.success(t('vendor.productSaved'));
      navigate('/vendor/products');
    } catch (err) {
      toast.error(err?.name === 'AbortError' ? t('errors.network') : err?.message || t('errors.generic'));
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }

  async function del() {
    if (!window.confirm(t('vendor.deleteProductConfirm'))) return;
    setBusy(true);
    const { error } = await supabase.from('products').delete().eq('id', id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('vendor.productDeleted'));
    navigate('/vendor/products');
  }

  function setImage(idx, path) {
    setForm((f) => {
      const images = [...f.images];
      if (path === null) images.splice(idx, 1);
      else images[idx] = path;
      return { ...f, images };
    });
  }

  // Pick many photos at once from the gallery and upload them in parallel.
  // Uses allSettled so one bad file never blocks the others, and unique UUID
  // names so two uploads can't collide.
  // Une vidéo par article (voir migration 0039). Refusée si trop lourde ou
  // trop longue: le navigateur ne sait pas la ré-encoder, donc le seul
  // garde-fou est à l'envoi. Une image de couverture est extraite au passage —
  // c'est elle qui s'affiche tant que la vidéo n'est pas chargée.
  async function uploadVideo(file) {
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(t('vendor.videoTooLarge', { mb: Math.round(MAX_VIDEO_BYTES / 1024 / 1024) }));
      return;
    }
    setUploads((n) => n + 1);
    try {
      const seconds = await videoDuration(file).catch(() => 0);
      if (seconds > MAX_VIDEO_SECONDS) {
        toast.error(t('vendor.videoTooLong', { seconds: MAX_VIDEO_SECONDS }));
        return;
      }
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('products').upload(path, file, { upsert: false, contentType: file.type || 'video/mp4' });
      if (error) throw error;
      // Meilleur effort: sans couverture la vidéo s'affiche quand même, elle
      // met juste un instant à apparaître.
      videoPoster(file)
        .then((blob) => supabase.storage.from('products').upload(posterPathFor(path), blob, { upsert: false, contentType: 'image/jpeg' }))
        .catch(() => {});
      setForm((f) => ({ ...f, video_url: path }));
      toast.success(t('vendor.videoAdded'));
    } catch (err) {
      toast.error(err.message || t('errors.generic'));
    } finally {
      setUploads((n) => Math.max(0, n - 1));
    }
  }

  async function onMultiFiles(e) {
    const picked = Array.from(e.target.files || []);
    if (multiRef.current) multiRef.current.value = '';
    if (!picked.length) return;
    // Une même sélection peut mélanger photos et vidéos — on trie ici plutôt
    // que d'imposer deux boutons séparés.
    const videos = picked.filter(isVideoFile);
    const files = picked.filter((f) => !isVideoFile(f));
    if (videos.length) {
      if (form.video_url) toast.info(t('vendor.videoReplaced'));
      uploadVideo(videos[0]);
      if (videos.length > 1) toast.info(t('vendor.videoOnlyOne'));
    }
    if (!files.length) return;
    const room = MAX_IMAGES - form.images.length;
    if (room <= 0) {
      toast.info(t('vendor.productImagesHint', { count: MAX_IMAGES }));
      return;
    }
    const batch = files.slice(0, room);
    setUploads((n) => n + batch.length);
    try {
      const results = await Promise.allSettled(
        batch.map(async (file) => {
          // Downscale + re-encode — phone photos routinely arrive at several
          // MB, which is what makes the catalog feel slow to load. Réglages
          // centralisés dans lib/image.js. Une vignette légère part en plus,
          // sous le même nom + `_thumb` — c'est elle que les grilles affichent.
          const { full, thumb } = await compressForUploadWithThumb(file);
          const uuid = crypto.randomUUID();
          const path = `${user.id}/${uuid}.${full.ext}`;
          const thumbPath = `${user.id}/${uuid}_thumb.${full.ext}`;
          const { error } = await supabase.storage.from('products').upload(path, full.blob, { upsert: false, contentType: full.contentType });
          if (error) throw error;
          supabase.storage.from('products').upload(thumbPath, thumb.blob, { upsert: false, contentType: thumb.contentType }).catch(() => {});
          return path;
        })
      );
      const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
      const failed = results.length - ok.length;
      if (ok.length) setForm((f) => ({ ...f, images: [...f.images, ...ok].slice(0, MAX_IMAGES) }));
      if (failed) toast.error(t('errors.generic'));
    } finally {
      setUploads((n) => Math.max(0, n - batch.length));
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div>
      <AppHeader
        title={isNew ? t('vendor.newProduct') : t('vendor.editProduct')}
        back
        right={!isNew && <button onClick={del} aria-label={t('common.delete')} className="p-1 text-danger"><IconTrash size={20} /></button>}
      />
      <div className="space-y-4 p-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">{t('vendor.productImages')}</span>
            {form.images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => multiRef.current?.click()}
                className="btn-ghost text-caption"
              >
                <IconPhotoPlus size={18} /> {t('vendor.addPhotos')}
              </button>
            )}
          </div>
          <input ref={multiRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={onMultiFiles} />
          {/* Existing photos + one empty slot to add another, up to MAX_IMAGES. */}
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: Math.min(form.images.length + 1, MAX_IMAGES) }).map((_, i) => (
              <ImageUpload
                key={i}
                bucket="products"
                value={form.images[i] || null}
                onChange={(p) => setImage(i, p)}
                onBusyChange={(b) => setUploads((n) => Math.max(0, n + (b ? 1 : -1)))}
                shape="square"
                onAddMany={() => multiRef.current?.click()}
              />
            ))}
          </div>
          {form.video_url && (
            <div className="relative mt-2 w-1/3 overflow-hidden rounded-card border border-hairline bg-black">
              <video
                src={storageUrl('products', form.video_url)}
                muted
                loop
                autoPlay
                playsInline
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, video_url: null }))}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
                aria-label={t('common.delete')}
              >
                <IconX size={16} />
              </button>
            </div>
          )}
          <p className="mt-1 text-caption text-muted">
            {t('vendor.productImagesHint', { count: MAX_IMAGES })} {t('vendor.productVideoHint', { seconds: MAX_VIDEO_SECONDS })}
          </p>
          {/* Cet écran sert à UN article: les 10 photos sont 10 vues du même
              produit. Qui arrive ici avec 70 photos d'articles différents
              doit trouver la sortie ICI, pas repartir chercher un bouton
              dans l'écran précédent. */}
          {isNew && (
            <Link
              to="/vendor/products/bulk"
              replace
              className="mt-2 flex items-center gap-2 rounded-card border border-teal/25 bg-teal/8 p-3 text-caption font-semibold text-teal"
            >
              <IconPhotoPlus size={18} className="shrink-0" />
              {t('vendor.bulkFromSingle')}
            </Link>
          )}
          {/* Auto-Listing: visible dès qu'une photo est là. Remplit titre/
              description/catégorie (sans écraser ce qui est déjà tapé) —
              la vendeuse relit et corrige avant d'enregistrer. */}
          {form.images.length > 0 && (
            <button
              type="button"
              onClick={fillFromPhoto}
              disabled={listingLoading}
              className="mt-2 flex items-center gap-1.5 text-caption font-semibold text-teal disabled:opacity-50"
            >
              {listingLoading ? <IconLoader2 size={15} className="animate-spin" /> : <IconSparkles size={15} />}
              {t('vendor.fillFromPhoto')}
            </button>
          )}
        </div>
        <Field label={t('vendor.productName')} required error={errors.name}>
          {(fid) => <TextInput id={fid} value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        </Field>
        {/* Prix sur demande: pour qui n'a pas encore fixé son prix, ou vend au
            cas par cas. Sans ça, un article à 0 s'affiche « 0 FCFA » — lu
            comme gratuit — et reste commandable à ce prix. */}
        <label className="flex items-start gap-3 rounded-card border border-hairline p-3">
          <input
            type="checkbox"
            checked={!!form.price_on_request}
            onChange={(e) => setForm({ ...form, price_on_request: e.target.checked })}
            className="mt-0.5 h-5 w-5 accent-[#C25E38]"
          />
          <span className="flex-1">
            <span className="block text-body text-ink">{t('vendor.priceOnRequest')}</span>
            <span className="mt-0.5 block text-caption text-muted">{t('vendor.priceOnRequestHelp')}</span>
          </span>
        </label>
        {!form.price_on_request && (
          <Field label={`${t('vendor.productPrice')} (${shopCurrency})`} required error={errors.price}>
            {(fid) => <TextInput id={fid} type="number" inputMode="decimal" value={form.price_fcfa} error={errors.price} onChange={(e) => setForm({ ...form, price_fcfa: e.target.value })} />}
          </Field>
        )}
        {/* Optionnel — vide = pas de promo affichée. Le % s'affiche seul,
            calculé côté client ET revérifié partout où le prix s'affiche
            (jamais de "-30%" que le calcul ne confirme pas). */}
        <Field label={`${t('vendor.compareAtPrice')} (${shopCurrency})`} hint={t('vendor.compareAtPriceHint')} error={errors.compareAtPrice}>
          {(fid) => (
            <TextInput
              id={fid}
              type="number"
              inputMode="decimal"
              value={form.compare_at_price_fcfa}
              error={errors.compareAtPrice}
              onChange={(e) => setForm({ ...form, compare_at_price_fcfa: e.target.value })}
            />
          )}
        </Field>
        {/* Repère HONNÊTE issu du catalogue (médiane d'articles comparables),
            jamais un prix "optimal" sorti du chapeau — la vendeuse décide. */}
        {priceHint && (
          <p className="-mt-2 text-caption text-muted">
            {t('vendor.priceHint', {
              price: Math.round(convertFromFcfa(priceHint.fcfa, shopCurrency)),
              currency: shopCurrency,
              count: priceHint.samples,
            })}
          </p>
        )}
        {/* Sélecteur en cascade (façon Amazon): rayon puis sous-catégorie
            précise quand elle existe (Mode Femme > Robes...). form.category
            stocke toujours l'id final (la sous-catégorie si choisie, sinon
            le rayon) — c'est cette valeur qui part en base, inchangée pour
            le reste de l'app. */}
        {(() => {
          const head = categoryHeadFor(form.category);
          const subcats = SELECTABLE_SUBCATEGORIES[head];
          return (
            <>
              <Field label={t('vendor.productCategory')}>
                {(fid) => (
                  <Select
                    id={fid}
                    value={head}
                    onChange={(e) => {
                      const newHead = e.target.value;
                      const newSubcats = SELECTABLE_SUBCATEGORIES[newHead];
                      setForm({ ...form, category: newSubcats ? newSubcats[0] : newHead, attributes: {} });
                    }}
                  >
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(`categories.${c.id}`)}</option>)}
                  </Select>
                )}
              </Field>
              {subcats && (
                <Field label={t('vendor.productSubcategory')}>
                  {(fid) => (
                    <Select id={fid} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {subcats.map((id) => <option key={id} value={id}>{t(`categories.${id}`)}</option>)}
                    </Select>
                  )}
                </Field>
              )}
            </>
          );
        })()}
        {/* Champs spécifiques à la catégorie (pivot): une annonce immobilière
            demande une surface, un véhicule une année/kilométrage… La config
            vit dans ATTRIBUTE_FIELDS (lib/categories.js). */}
        {attributeFieldsFor(form.category).length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {attributeFieldsFor(form.category).map(({ key, type }) => (
              <Field key={key} label={t(`productAttrs.${key}`)}>
                {(fid) => (
                  <TextInput
                    id={fid}
                    type={type === 'number' ? 'number' : 'text'}
                    inputMode={type === 'number' ? 'numeric' : undefined}
                    value={form.attributes?.[key] ?? ''}
                    onChange={(e) => setForm({ ...form, attributes: { ...form.attributes, [key]: e.target.value } })}
                  />
                )}
              </Field>
            ))}
          </div>
        )}
        <Field label={t('vendor.productStock')}>
          {(fid) => <TextInput id={fid} type="number" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />}
        </Field>
        {/* Tailles/couleurs — c'était LE manque signalé par Beau: pas de XL/
            XXL sur les robes. L'acheteuse devra choisir sa taille avant
            l'ajout au panier, et la commande arrive avec la variante. */}
        <TagPicker
          label={t('vendor.productSizes')}
          hint={t('vendor.productSizesHint')}
          values={form.sizes}
          presets={sizePresetsFor(form.category)}
          onChange={(sizes) => setForm({ ...form, sizes })}
          addLabel={t('vendor.addSize')}
        />
        <TagPicker
          label={t('vendor.productColors')}
          hint={t('vendor.productColorsHint')}
          values={form.colors}
          presets={null}
          onChange={(colors) => setForm({ ...form, colors })}
          addLabel={t('vendor.addColor')}
        />
        {/* Uniquement utile quand la boutique tourne par arrivage — sinon la
            case n'aurait aucun effet visible et ne ferait qu'encombrer. */}
        {shop.rotation_enabled && (
          <label className="flex items-start gap-3 rounded-card border border-hairline p-3">
            <input
              type="checkbox"
              checked={!!form.is_permanent}
              onChange={(e) => setForm({ ...form, is_permanent: e.target.checked })}
              className="mt-0.5 h-5 w-5 accent-[#C25E38]"
            />
            <span className="flex-1">
              <span className="block text-body text-ink">{t('vendor.productPermanent')}</span>
              <span className="mt-0.5 block text-caption text-muted">{t('vendor.productPermanentHelp')}</span>
            </span>
          </label>
        )}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">{t('vendor.productDescription')}</span>
            <button
              type="button"
              onClick={generateDescription}
              disabled={genLoading}
              className="btn-ghost text-caption text-teal disabled:opacity-50"
            >
              {genLoading ? <IconLoader2 size={16} className="animate-spin" /> : <IconSparkles size={16} />}
              {t('vendor.copilotGenerate')}
            </button>
          </div>
          <TextArea id="product-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          {suggestion != null && (
            <div className="mt-2 rounded-card border border-teal/40 bg-teal/5 p-3">
              <p className="mb-1.5 flex items-center gap-1 text-caption font-semibold text-teal">
                <IconSparkles size={14} /> {t('vendor.copilotSuggestion')}
              </p>
              <TextArea id="copilot-suggestion" value={suggestion} onChange={(e) => setSuggestion(e.target.value)} />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setForm((f) => ({ ...f, description: suggestion })); setSuggestion(null); }}
                  className="rounded-input bg-teal px-3 py-1.5 text-caption font-semibold text-white transition active:scale-95"
                >
                  {t('vendor.copilotUse')}
                </button>
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={genLoading}
                  className="rounded-input border border-hairline px-3 py-1.5 text-caption font-semibold text-ink disabled:opacity-50"
                >
                  {t('vendor.copilotRegenerate')}
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  className="rounded-input px-3 py-1.5 text-caption text-muted"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Script Reel/TikTok généré pour promouvoir la fiche — la vendeuse le
            copie et filme elle-même, rien n'est publié automatiquement. */}
        <div>
          <button
            type="button"
            onClick={generateReelScript}
            disabled={scriptLoading}
            className="flex items-center gap-1.5 text-caption font-semibold text-teal disabled:opacity-50"
          >
            {scriptLoading ? <IconLoader2 size={15} className="animate-spin" /> : <IconSparkles size={15} />}
            {t('vendor.reelScript')}
          </button>
          {reelScript && (
            <div className="mt-2 space-y-2 rounded-card border border-brass/40 bg-brass/5 p-3">
              <p className="text-body font-semibold text-ink">🎬 {reelScript.hook}</p>
              <ol className="list-decimal space-y-1.5 pl-5">
                {reelScript.scenes.map((s, i) => (
                  <li key={i} className="text-caption text-ink">
                    <span className="font-semibold">{s.shot}</span>
                    <br />« {s.text} »
                  </li>
                ))}
              </ol>
              <p className="text-caption font-semibold text-ink">{reelScript.cta}</p>
              <p className="text-caption text-muted">{(reelScript.hashtags || []).map((h) => `#${h}`).join(' ')}</p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-input bg-teal px-3 py-1.5 text-caption font-semibold text-white"
                  onClick={async () => {
                    const text = [
                      reelScript.hook,
                      ...reelScript.scenes.map((s, i) => `${i + 1}. ${s.shot} — « ${s.text} »`),
                      reelScript.cta,
                      (reelScript.hashtags || []).map((h) => `#${h}`).join(' '),
                    ].join('\n');
                    try {
                      await navigator.clipboard.writeText(text);
                      toast.success(t('common.shareCopied'));
                    } catch {
                      toast.error(t('errors.generic'));
                    }
                  }}
                >
                  {t('vendor.copyScript')}
                </button>
                <button type="button" onClick={() => setReelScript(null)} className="rounded-input px-3 py-1.5 text-caption text-muted">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="sticky bottom-0 z-30 border-t border-hairline bg-white p-3">
        <Button onClick={save} loading={busy} disabled={uploads > 0}>
          {uploads > 0 ? t('vendor.imageStillUploading') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}
