import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconPhotoPlus, IconTrash, IconCheck, IconSearch } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { Field, TextInput, TextArea, Select } from '../../components/Field';
import { SmartImage } from '../../components/SmartImage';
import { Skeleton, ErrorState } from '../../components/states';
import { compressForUpload, THUMB_OPTS } from '../../lib/image';
import { CATEGORIES } from '../../lib/categories';
import { CURRENCIES, currencyForCountry, toFcfa } from '../../lib/currency';

// Publier un article À LA PLACE d'une vendeuse.
//
// 19 des 60 boutiques actives n'ont jamais publié un seul article. Elles se
// sont inscrites et se sont arrêtées là — et une boutique vide n'apparaît dans
// aucune recherche, donc elle ne rapporte rien et la vendeuse en conclut que
// Finjaro ne sert à rien.
//
// Beaucoup envoient leurs photos sur WhatsApp en demandant qu'on s'en occupe.
// Cet écran est la réponse: on choisit la boutique, on dépose les photos du
// téléphone, on met un nom et un prix, c'est en ligne.
//
// Le prix se saisit dans la devise de LA BOUTIQUE, pas dans celle de la
// personne qui publie: la vendeuse a annoncé ses prix dans sa monnaie, les
// retaper dans une autre donnerait un montant faux.
const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

const VIDE = { name: '', prix: '', description: '', category: 'mode', stock: '1', surDemande: false };

export default function AdminPublier() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();

  const [q, setQ] = useState('');
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState(VIDE);
  const [devise, setDevise] = useState('FCFA');
  const [photos, setPhotos] = useState([]); // { id, blob, apercu }
  const [busy, setBusy] = useState(false);
  const [publies, setPublies] = useState([]); // ce qui vient de partir, pour la trace

  const { data: boutiques, loading, error, retry } = useAsync(async () => {
    const { data: rows, error: e } = await supabase
      .from('shops')
      .select('id, name, city, country, slug, status, products(id)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (e) throw e;
    return (rows || []).map((s) => ({ ...s, articles: s.products?.length || 0 }));
  }, []);

  // Les boutiques VIDES d'abord: ce sont elles qu'on est venu remplir.
  const liste = useMemo(() => {
    const terme = q.trim().toLowerCase();
    return (boutiques || [])
      .filter((s) => !terme || s.name?.toLowerCase().includes(terme) || s.city?.toLowerCase().includes(terme))
      .sort((a, b) => a.articles - b.articles || a.name.localeCompare(b.name));
  }, [boutiques, q]);

  const vides = (boutiques || []).filter((s) => s.articles === 0).length;

  function choisir(s) {
    setShop(s);
    setForm(VIDE);
    setPhotos([]);
    setPublies([]);
    setDevise(currencyForCountry(s.country) || 'FCFA');
  }

  async function ajouterPhotos(e) {
    const fichiers = Array.from(e.target.files || []);
    e.target.value = ''; // pour pouvoir re-choisir le même fichier
    if (!fichiers.length) return;
    const prets = [];
    for (const f of fichiers) {
      try {
        const { blob } = await compressForUpload(f);
        prets.push({ id: uid(), blob, apercu: URL.createObjectURL(blob) });
      } catch {
        toast.error(t('admin.publier.photoIllisible', { nom: f.name }));
      }
    }
    setPhotos((p) => [...p, ...prets].slice(0, 6));
  }

  function retirerPhoto(id) {
    setPhotos((p) => {
      const cible = p.find((x) => x.id === id);
      if (cible) URL.revokeObjectURL(cible.apercu);
      return p.filter((x) => x.id !== id);
    });
  }

  const valide =
    !!shop && form.name.trim().length > 1 && (form.surDemande || Number(form.prix) > 0) && photos.length > 0;

  async function publier() {
    if (!valide) return;
    setBusy(true);
    try {
      // Les photos partent dans le dossier de la personne connectée: c'est ce
      // que la règle du stockage autorise, et le chemin n'a aucune importance
      // pour l'affichage — seul compte ce qui est écrit dans products.images.
      const chemins = [];
      for (const ph of photos) {
        const type = ph.blob.type || 'image/jpeg';
        const ext = type === 'image/webp' ? 'webp' : 'jpg';
        const base = uid();
        const chemin = `${user.id}/${base}.${ext}`;
        const { error: e1 } = await supabase.storage
          .from('products')
          .upload(chemin, ph.blob, { upsert: false, contentType: type });
        if (e1) throw e1;
        chemins.push(chemin);
        // Vignette: au mieux. Si elle manque, l'application retombe sur la
        // pleine taille, personne ne voit de trou.
        compressForUpload(ph.blob, THUMB_OPTS)
          .then((v) =>
            supabase.storage
              .from('products')
              .upload(`${user.id}/${base}_thumb.${ext}`, v.blob, { upsert: false, contentType: v.contentType })
          )
          .catch(() => {});
      }

      const { data: id, error: e2 } = await supabase.rpc('admin_publier_article', {
        p_shop_id: shop.id,
        p_name: form.name.trim(),
        p_price_fcfa: form.surDemande ? 0 : toFcfa(Number(form.prix), devise),
        p_category: form.category,
        p_images: chemins,
        p_description: form.description.trim() || null,
        p_stock: Math.max(0, Number(form.stock) || 1),
        p_price_on_request: form.surDemande,
      });
      if (e2) throw e2;

      setPublies((p) => [{ id, nom: form.name.trim() }, ...p]);
      photos.forEach((ph) => URL.revokeObjectURL(ph.apercu));
      setPhotos([]);
      setForm({ ...VIDE, category: form.category });
      toast.success(t('admin.publier.enLigne'));
      retry();
    } catch (err) {
      const code = String(err?.message || '').split(':')[0].trim();
      const connus = {
        not_admin: 'admin.publier.errNonAdmin',
        shop_not_found: 'admin.publier.errBoutique',
        shop_unavailable: 'admin.publier.errBoutiqueFermee',
        name_required: 'admin.publier.errNom',
        price_required: 'admin.publier.errPrix',
      };
      toast.error(connus[code] ? t(connus[code]) : err?.message || t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  // ── Choix de la boutique ───────────────────────────────────────────────
  if (!shop) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-caption text-muted">
          {t('admin.publier.intro', { vides })}
        </p>
        <div className="relative">
          <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <TextInput
            id="rech-boutique"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('admin.publier.chercher')}
            className="pl-9"
          />
        </div>
        <ul className="divide-y divide-hairline">
          {liste.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => choisir(s)}
                className="flex w-full items-center justify-between gap-3 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-body font-semibold text-ink">{s.name}</span>
                  <span className="block truncate text-caption text-muted">
                    {[s.city, s.country].filter(Boolean).join(', ')}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-pill px-2.5 py-1 text-caption font-semibold ${
                    s.articles === 0 ? 'bg-warning-bg text-warning' : 'bg-teal-light text-teal'
                  }`}
                >
                  {s.articles === 0 ? t('admin.publier.vide') : t('vendor.itemCount', { count: s.articles })}
                </span>
              </button>
            </li>
          ))}
          {liste.length === 0 && <li className="py-6 text-center text-caption text-muted">{t('admin.publier.aucune')}</li>}
        </ul>
      </div>
    );
  }

  // ── Publication ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-section text-ink">{shop.name}</p>
          <p className="text-caption text-muted">{[shop.city, shop.country].filter(Boolean).join(', ')}</p>
        </div>
        <button onClick={() => setShop(null)} className="shrink-0 text-caption font-semibold text-teal">
          {t('admin.publier.changerBoutique')}
        </button>
      </div>

      {publies.length > 0 && (
        <div className="rounded-card bg-success-bg p-3">
          <p className="text-caption font-semibold text-success">
            {t('admin.publier.dejaPublies', { count: publies.length })}
          </p>
          <ul className="mt-1 space-y-0.5">
            {publies.map((p) => (
              <li key={p.id} className="flex items-center gap-1.5 text-caption text-ink">
                <IconCheck size={13} className="shrink-0 text-success" /> {p.nom}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="card space-y-3">
        <Field label={t('admin.publier.photos')} required>
          {() => (
            <div className="flex flex-wrap gap-2">
              {photos.map((ph) => (
                <div key={ph.id} className="relative">
                  <SmartImage src={ph.apercu} alt="" className="h-20 w-20 rounded-input" />
                  <button
                    onClick={() => retirerPhoto(ph.id)}
                    aria-label={t('common.delete')}
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white"
                  >
                    <IconTrash size={13} />
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-input border-[1.5px] border-dashed border-hairline text-caption text-muted">
                  <IconPhotoPlus size={20} />
                  {t('admin.publier.ajouter')}
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={ajouterPhotos} />
                </label>
              )}
            </div>
          )}
        </Field>

        <Field label={t('admin.publier.nom')} required>
          {(id) => (
            <TextInput
              id={id}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('admin.publier.nomExemple')}
            />
          )}
        </Field>

        <label className="flex items-center gap-2 text-body text-ink">
          <input
            type="checkbox"
            checked={form.surDemande}
            onChange={(e) => setForm({ ...form, surDemande: e.target.checked })}
            className="h-4 w-4 accent-teal"
          />
          {t('product.priceOnRequest')}
        </label>

        {!form.surDemande && (
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label={t('admin.publier.prix')} required>
                {(id) => (
                  <TextInput
                    id={id}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={form.prix}
                    onChange={(e) => setForm({ ...form, prix: e.target.value })}
                  />
                )}
              </Field>
            </div>
            <div className="w-32">
              <Field label={t('admin.publier.devise')}>
                {(id) => (
                  <Select id={id} value={devise} onChange={(e) => setDevise(e.target.value)}>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Field label={t('admin.publier.rayon')}>
              {(id) => (
                <Select id={id} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{t(`categories.${c.id}`)}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <div className="w-32">
            <Field label={t('admin.publier.stock')}>
              {(id) => (
                <TextInput
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              )}
            </Field>
          </div>
        </div>

        <Field label={`${t('admin.publier.description')} ${t('common.optional')}`}>
          {(id) => (
            <TextArea
              id={id}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('admin.publier.descriptionExemple')}
            />
          )}
        </Field>
      </section>

      <p className="text-caption text-muted">{t('admin.publier.rappelDevise', { devise })}</p>

      <Button onClick={publier} loading={busy} disabled={!valide}>
        {t('admin.publier.cta')}
      </Button>

      {shop.slug && (
        <a
          href={`/boutique/${shop.slug}`}
          target="_blank"
          rel="noreferrer"
          className="block py-2 text-center text-caption font-semibold text-teal"
        >
          {t('admin.publier.voirBoutique')}
        </a>
      )}
    </div>
  );
}
