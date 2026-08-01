import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconShieldLock, IconCircleCheck, IconChevronLeft, IconPackage, IconTool, IconPackages } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useVendorStatus } from '../../hooks/useVendorStatus';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { Field, TextInput, TextArea, Select } from '../../components/Field';
import { ImageUpload } from '../../components/ImageUpload';
import { Spinner } from '../../components/Spinner';
import { CATEGORIES, SERVICE_CATEGORIES } from '../../lib/categories';
import { COUNTRIES, countryLabel } from '../../lib/countries';
import { getPosition } from '../../lib/geo';

// Upload de la pièce d'identité (CNI) MASQUÉ à la demande de Beau (01/08):
// exiger — ou même montrer — la CNI freine les inscriptions de boutiques.
// Le code, le stockage (bucket `ids`) et la lecture OCR côté admin restent
// intacts: repasser ce drapeau à `true` réaffiche l'étape telle quelle.
const SHOW_ID_UPLOAD = false;

const empty = {
  shop_name: '', country: '', city: '', categories: [],
  first_name: '', last_name: '', id_front_url: null, id_back_url: null, phone: '',
  banner_url: null, avatar_url: null, description: '', whatsapp: '',
};

// Accent-free, url-safe slug from the shop name (a random suffix is added for uniqueness).
function slugify(s) {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // strip accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'boutique'
  );
}

export default function BecomeVendor() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, status, reload } = useVendorStatus();
  const toast = useToast();
  const [step, setStep] = useState(1);
  // Le pays part du pays DÉTECTÉ (ou choisi dans Paramètres), pas d'un
  // « Cameroun » codé en dur. C'est lui qui fixe la devise de saisie des
  // prix: un vendeur en France qui ne remarquait pas la liste se retrouvait
  // à taper ses prix en FCFA — et n'avait ensuite aucun moyen de corriger,
  // le pays n'étant pas modifiable une fois la boutique créée (il l'est
  // désormais, voir VendorShop).
  const { country: detectedCountry } = useSettings();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    // Ne jamais écraser un choix déjà fait à la main.
    setForm((f) => (f.country ? f : { ...f, country: detectedCountry || 'CM' }));
  }, [detectedCountry]);
  const [agree, setAgree] = useState(false);
  const [termsErr, setTermsErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleCat = (id) => set({ categories: form.categories.includes(id) ? form.categories.filter((c) => c !== id) : [...form.categories, id] });

  // 'products' | 'services' | 'both' — pilote quelles listes de catégories
  // sont proposées. Changer de type vide la sélection: garder des rayons
  // produits sur une boutique passée en "services" est précisément ce qui
  // la rendait invisible dans l'annuaire.
  //
  // Valeur initiale lue dans l'URL (?kind=services): un prestataire qui clique
  // "Proposer mes services" depuis l'annuaire arrivait sur un écran intitulé
  // "Devenir vendeur" pré-réglé sur "Produits" — il croyait s'être trompé de
  // bouton. Il arrive maintenant sur le bon type déjà coché.
  const [params] = useSearchParams();
  const askedKind = params.get('kind');
  const [kind, setKindState] = useState(
    ['products', 'services', 'both'].includes(askedKind) ? askedKind : 'products'
  );
  // Le formulaire est le même (identité, KYC, contacts) — seuls les MOTS
  // changent, pour qu'un plombier ne lise jamais "ma boutique".
  const providerWording = kind === 'services';
  const setKind = (k) => {
    setKindState(k);
    set({ categories: [] });
  };
  const showProductCats = kind === 'products' || kind === 'both';
  const showServiceCats = kind === 'services' || kind === 'both';

  const step1Valid = form.shop_name.trim() && form.country && form.categories.length > 0;

  async function submit() {
    if (!agree) {
      setTermsErr(true);
      return;
    }
    setBusy(true);
    try {
      // Keep the application record (stores ID docs when provided, useful for a
      // future Admin) — but it no longer gates activation.
      await supabase.from('vendor_applications').insert({ user_id: user.id, ...form });
      // Create the shop immediately: the user becomes a vendor right away, even
      // without an ID. is_verified stays false until the 4 badge conditions hold.
      const slug = `${slugify(form.shop_name)}-${Math.random().toString(36).slice(2, 6)}`;
      const pos = await getPosition(); // best-effort, for "Autour de moi"
      const { error: shopErr } = await supabase.from('shops').insert({
        owner_id: user.id,
        slug,
        name: form.shop_name.trim(),
        country: form.country,
        city: form.city || null,
        categories: form.categories,
        bio: form.description || null,
        whatsapp: form.whatsapp || form.phone || null,
        avatar_url: form.avatar_url,
        banner_url: form.banner_url,
        lat: pos?.lat ?? null,
        lng: pos?.lng ?? null,
      });
      if (shopErr) throw shopErr;
      await supabase.from('profiles').update({ is_vendor: true }).eq('id', user.id);
      await reload();
      setDone(true);
    } catch (e) {
      toast.error(e.message || t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  // Already a vendor (has a shop) — send them to their seller space.
  if (!done && status === 'approved') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-section text-ink">{t('becomeVendor.alreadyVendor')}</p>
        <Button className="mt-6 max-w-xs" onClick={() => navigate('/switch/to-vendor')}>{t('profile.switchToVendor')}</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
        <IconCircleCheck size={64} className="text-success" stroke={1.5} />
        <h1 className="mt-4 text-title text-ink">{t('becomeVendor.activatedTitle')}</h1>
        <p className="mt-2 max-w-sm text-body text-muted">{t('becomeVendor.activatedBody')}</p>
        <Button className="mt-8 max-w-xs" onClick={() => navigate('/switch/to-vendor')}>{t('becomeVendor.goToVendorSpace')}</Button>
        <Button variant="ghost" className="mt-2" onClick={() => navigate('/profile')}>{t('common.back')}</Button>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-hairline bg-white px-4">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} aria-label={t('common.back')} className="-ml-2 p-1"><IconChevronLeft size={24} /></button>
        <h1 className="text-section text-ink">
          {providerWording ? t('becomeVendor.titleProvider') : t('becomeVendor.title')}
        </h1>
      </header>

      <div className="px-4 pt-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-pill ${s <= step ? 'bg-teal' : 'bg-hairline'}`} />
          ))}
        </div>
        <p className="mt-2 text-caption text-muted">{t('becomeVendor.stepLabel', { current: step })}</p>
      </div>

      <div className="space-y-4 p-4">
        {step === 1 && (
          <>
            <h2 className="text-section text-ink">{t('becomeVendor.step1Title')}</h2>
            <Field label={providerWording ? t('becomeVendor.providerName') : t('becomeVendor.shopName')} required>{(id) => <TextInput id={id} value={form.shop_name} onChange={(e) => set({ shop_name: e.target.value })} />}</Field>
            <Field label={t('becomeVendor.country')} required>{(id) => <Select id={id} value={form.country} onChange={(e) => set({ country: e.target.value })}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{countryLabel(c.code, i18n.language)}</option>)}</Select>}</Field>
            <Field label={t('becomeVendor.city')}>{(id) => <TextInput id={id} value={form.city} onChange={(e) => set({ city: e.target.value })} />}</Field>
            {/* Question posée AVANT les catégories: "est-ce que je vends des
                articles, je propose des services, ou les deux ?". Sans elle,
                une prestataire tombait sur une liste de rayons produits et
                se rangeait dans "accessoires" faute de mieux — c'est
                exactement ce qui est arrivé à une vraie boutique
                (informatique classée en accessoires, donc absente de
                l'annuaire des services). */}
            <div>
              <span className="label">{t('becomeVendor.activityKind')}</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['products', IconPackage, t('becomeVendor.kindProducts')],
                  ['services', IconTool, t('becomeVendor.kindServices')],
                  ['both', IconPackages, t('becomeVendor.kindBoth')],
                ].map(([k, Icon, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    aria-pressed={kind === k}
                    className={`flex flex-col items-center gap-1 rounded-card border p-3 text-center transition ${
                      kind === k ? 'border-teal bg-teal/5 text-teal' : 'border-hairline text-muted'
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-caption font-semibold leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {showProductCats && (
              <div>
                <span className="label">{t('becomeVendor.mainCategories')}</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => <button key={c.id} type="button" onClick={() => toggleCat(c.id)} className={`chip ${form.categories.includes(c.id) ? 'chip-active' : 'text-ink'}`}>{t(`categories.${c.id}`)}</button>)}
                </div>
              </div>
            )}

            {showServiceCats && (
              <div>
                <span className="label">{t('vendor.shopServiceCategories')}</span>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_CATEGORIES.map((c) => <button key={c.id} type="button" onClick={() => toggleCat(c.id)} className={`chip ${form.categories.includes(c.id) ? 'chip-active' : 'text-ink'}`}>{t(`categories.${c.id}`)}</button>)}
                </div>
              </div>
            )}

            {form.categories.length === 0 && <p className="text-caption text-muted">{t('becomeVendor.selectCategories')}</p>}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-section text-ink">{t('becomeVendor.step2Title')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('becomeVendor.firstName')}>{(id) => <TextInput id={id} value={form.first_name} onChange={(e) => set({ first_name: e.target.value })} />}</Field>
              <Field label={t('becomeVendor.lastName')}>{(id) => <TextInput id={id} value={form.last_name} onChange={(e) => set({ last_name: e.target.value })} />}</Field>
            </div>
            {SHOW_ID_UPLOAD && (
              <>
                <p className="text-caption text-muted">{t('becomeVendor.idOptional')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <ImageUpload bucket="ids" value={form.id_front_url} onChange={(p) => set({ id_front_url: p })} label={t('becomeVendor.idFront')} shape="wide" />
                  <ImageUpload bucket="ids" value={form.id_back_url} onChange={(p) => set({ id_back_url: p })} label={t('becomeVendor.idBack')} shape="wide" />
                </div>
              </>
            )}
            <Field label={t('becomeVendor.phone')}>{(id) => <TextInput id={id} type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />}</Field>
            {SHOW_ID_UPLOAD && (
              <p className="flex items-start gap-2 rounded-card bg-success-bg p-3 text-caption text-success"><IconShieldLock size={18} className="mt-0.5 shrink-0" />{t('becomeVendor.dataReassurance')}</p>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-section text-ink">{t('becomeVendor.step3Title')}</h2>
            <ImageUpload bucket="shops" value={form.banner_url} onChange={(p) => set({ banner_url: p })} label={t('becomeVendor.banner')} shape="wide" />
            <ImageUpload bucket="shops" value={form.avatar_url} onChange={(p) => set({ avatar_url: p })} label={t('becomeVendor.shopPhoto')} shape="round" />
            <Field label={t('becomeVendor.description')}>{(id) => <TextArea id={id} value={form.description} onChange={(e) => set({ description: e.target.value })} />}</Field>
            <Field label={`${t('becomeVendor.whatsapp')} ${t('common.optional')}`}>{(id) => <TextInput id={id} type="tel" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} />}</Field>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-section text-ink">{t('becomeVendor.step4Title')}</h2>
            <div className="space-y-1 rounded-card border border-hairline p-4 text-body">
              <Recap label={t('becomeVendor.shopName')} value={form.shop_name} />
              <Recap label={t('becomeVendor.country')} value={countryLabel(form.country, i18n.language)} />
              <Recap label={t('becomeVendor.city')} value={form.city} />
              <Recap label={t('becomeVendor.mainCategories')} value={form.categories.map((c) => t(`categories.${c}`)).join(', ')} />
              <Recap label={`${t('becomeVendor.firstName')} ${t('becomeVendor.lastName')}`} value={`${form.first_name} ${form.last_name}`.trim()} />
              <Recap label={t('becomeVendor.phone')} value={form.phone} />
            </div>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setTermsErr(false); }} className="mt-0.5 h-5 w-5 accent-[#C25E38]" />
              <span className="text-body text-ink">{t('becomeVendor.acceptTerms')}</span>
            </label>
            {termsErr && <p className="text-caption text-danger">{t('becomeVendor.termsRequired')}</p>}
          </>
        )}
      </div>

      <div className="sticky bottom-0 z-30 border-t border-hairline bg-white p-3">
        {step < 4 ? (
          <Button disabled={step === 1 && !step1Valid} onClick={() => setStep(step + 1)}>{t('common.continue')}</Button>
        ) : (
          <Button onClick={submit} loading={busy}>{t('becomeVendor.submit')}</Button>
        )}
      </div>
    </div>
  );
}

function Recap({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-hairline py-1 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value || '—'}</span>
    </div>
  );
}
