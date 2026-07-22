import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconShieldLock, IconCircleCheck, IconChevronLeft } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useVendorStatus } from '../../hooks/useVendorStatus';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { Field, TextInput, TextArea, Select } from '../../components/Field';
import { ImageUpload } from '../../components/ImageUpload';
import { Spinner } from '../../components/Spinner';
import { CATEGORIES } from '../../lib/categories';
import { COUNTRIES, countryLabel } from '../../lib/countries';

const empty = {
  shop_name: '', country: 'CM', city: '', categories: [],
  first_name: '', last_name: '', id_front_url: null, id_back_url: null, phone: '',
  banner_url: null, avatar_url: null, description: '', whatsapp: '',
};

export default function BecomeVendor() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, status } = useVendorStatus();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(empty);
  const [agree, setAgree] = useState(false);
  const [termsErr, setTermsErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleCat = (id) => set({ categories: form.categories.includes(id) ? form.categories.filter((c) => c !== id) : [...form.categories, id] });

  const step1Valid = form.shop_name.trim() && form.country && form.categories.length > 0;

  async function submit() {
    if (!agree) {
      setTermsErr(true);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('vendor_applications').insert({ user_id: user.id, ...form });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  if (!done && (status === 'pending' || status === 'approved')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-section text-ink">{t('becomeVendor.alreadyPending')}</p>
        <Button className="mt-6 max-w-xs" onClick={() => navigate('/profile')}>{t('common.back')}</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <IconCircleCheck size={64} className="text-success" stroke={1.5} />
        <h1 className="mt-4 text-title text-ink">{t('becomeVendor.successTitle')}</h1>
        <p className="mt-2 text-body text-muted">{t('becomeVendor.successBody')}</p>
        <div className="mt-6 w-full max-w-xs space-y-2 text-left">
          {['next1', 'next2', 'next3', 'next4'].map((k, i) => (
            <div key={k} className="flex items-center gap-3 rounded-card border border-hairline p-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal/10 text-caption font-semibold text-teal">{i + 1}</span>
              <span className="text-body text-ink">{t(`becomeVendor.${k}`)}</span>
            </div>
          ))}
        </div>
        <Button className="mt-8 max-w-xs" onClick={() => navigate('/profile')}>{t('common.continue')}</Button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-hairline bg-white px-4">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} aria-label={t('common.back')} className="-ml-2 p-1"><IconChevronLeft size={24} /></button>
        <h1 className="text-section text-ink">{t('becomeVendor.title')}</h1>
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
            <Field label={t('becomeVendor.shopName')} required>{(id) => <TextInput id={id} value={form.shop_name} onChange={(e) => set({ shop_name: e.target.value })} />}</Field>
            <Field label={t('becomeVendor.country')} required>{(id) => <Select id={id} value={form.country} onChange={(e) => set({ country: e.target.value })}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{countryLabel(c.code, i18n.language)}</option>)}</Select>}</Field>
            <Field label={t('becomeVendor.city')}>{(id) => <TextInput id={id} value={form.city} onChange={(e) => set({ city: e.target.value })} />}</Field>
            <div>
              <span className="label">{t('becomeVendor.mainCategories')}</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => <button key={c.id} onClick={() => toggleCat(c.id)} className={`chip ${form.categories.includes(c.id) ? 'chip-active' : 'text-ink'}`}>{t(`categories.${c.id}`)}</button>)}
              </div>
              {form.categories.length === 0 && <p className="mt-1 text-caption text-muted">{t('becomeVendor.selectCategories')}</p>}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-section text-ink">{t('becomeVendor.step2Title')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('becomeVendor.firstName')}>{(id) => <TextInput id={id} value={form.first_name} onChange={(e) => set({ first_name: e.target.value })} />}</Field>
              <Field label={t('becomeVendor.lastName')}>{(id) => <TextInput id={id} value={form.last_name} onChange={(e) => set({ last_name: e.target.value })} />}</Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ImageUpload bucket="ids" value={form.id_front_url} onChange={(p) => set({ id_front_url: p })} label={t('becomeVendor.idFront')} shape="wide" />
              <ImageUpload bucket="ids" value={form.id_back_url} onChange={(p) => set({ id_back_url: p })} label={t('becomeVendor.idBack')} shape="wide" />
            </div>
            <Field label={t('becomeVendor.phone')}>{(id) => <TextInput id={id} type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />}</Field>
            <p className="flex items-start gap-2 rounded-card bg-success-bg p-3 text-caption text-success"><IconShieldLock size={18} className="mt-0.5 shrink-0" />{t('becomeVendor.dataReassurance')}</p>
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
              <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setTermsErr(false); }} className="mt-0.5 h-5 w-5 accent-[#0F4C4C]" />
              <span className="text-body text-ink">{t('becomeVendor.acceptTerms')}</span>
            </label>
            {termsErr && <p className="text-caption text-danger">{t('becomeVendor.termsRequired')}</p>}
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-hairline bg-white p-3">
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
