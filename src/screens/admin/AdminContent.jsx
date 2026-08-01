import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSparkles, IconId, IconLoader2, IconCheck, IconX } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { Field, TextInput } from '../../components/Field';
import { ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

// Contenu piloté par l'administration: le bandeau d'annonce de l'app et les
// candidatures vendeur (avec lecture assistée de la pièce d'identité quand
// elle a été fournie — l'upload est masqué du parcours d'inscription depuis
// le 01/08, les anciennes candidatures en ont encore).
export default function AdminContent() {
  const { t } = useTranslation();

  const { data, loading, error, retry } = useAsync(async () => {
    const [annRes, appsRes] = await Promise.all([
      supabase.from('announcements').select('id, active, label, text_fr, text_en, href').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase
        .from('vendor_applications')
        .select('id, shop_name, first_name, last_name, phone, country, city, id_front_url, id_back_url, status, created_at')
        .order('created_at', { ascending: false })
        .limit(30),
    ]);
    return { announcement: annRes.data || null, applications: appsRes.data || [] };
  }, []);

  if (loading) return <div className="space-y-3 p-4"><Skeleton className="h-64 w-full" /></div>;
  if (error) return <ErrorState onRetry={retry} />;

  return (
    <div className="space-y-6 p-4">
      <AnnouncementEditor current={data.announcement} onSaved={retry} />

      <div>
        <h2 className="mb-2 text-section text-ink">{t('admin.applications')}</h2>
        {data.applications.length === 0 ? (
          <p className="rounded-card border border-hairline px-3 py-4 text-center text-caption text-muted">{t('admin.noApplications')}</p>
        ) : (
          <ul className="space-y-2">
            {data.applications.map((a) => <ApplicationCard key={a.id} app={a} onChanged={retry} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

// Éditeur du bandeau d'annonce affiché en haut de l'app. Le texte est une
// donnée, pas du code: Beau l'écrit ici et il part en ligne — sans annonce
// active, aucun bandeau ne s'affiche.
function AnnouncementEditor({ current, onSaved }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState({
    label: current?.label || '',
    text_fr: current?.text_fr || '',
    text_en: current?.text_en || '',
    href: current?.href || '',
    active: current?.active ?? false,
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!form.text_fr.trim()) {
      toast.info(t('admin.annNeedText'));
      return;
    }
    setBusy(true);
    const payload = {
      label: form.label.trim() || null,
      text_fr: form.text_fr.trim(),
      text_en: form.text_en.trim() || null,
      href: form.href.trim() || null,
      active: form.active,
      updated_at: new Date().toISOString(),
    };
    const { error } = current?.id
      ? await supabase.from('announcements').update(payload).eq('id', current.id)
      : await supabase.from('announcements').insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t('common.saved'));
      onSaved?.();
    }
  }

  return (
    <section className="rounded-card border border-hairline p-4">
      <h2 className="text-section text-ink">{t('admin.annTitle')}</h2>
      <p className="mt-0.5 text-caption text-muted">{t('admin.annHint')}</p>

      {/* Aperçu fidèle: exactement le rendu qu'auront les utilisatrices. */}
      {form.text_fr.trim() && (
        <div className="mt-3 flex items-center gap-2 rounded-input bg-teal px-3 py-2 text-caption font-semibold text-white">
          {form.label.trim() && (
            <span className="shrink-0 rounded-sm bg-white/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              {form.label}
            </span>
          )}
          <IconSparkles size={14} className="shrink-0" />
          <span className="truncate">{form.text_fr}</span>
        </div>
      )}

      <div className="mt-3 space-y-3">
        <Field label={t('admin.annLabel')}>
          {(id) => <TextInput id={id} value={form.label} placeholder="SUPER-APP" onChange={(e) => setForm({ ...form, label: e.target.value })} />}
        </Field>
        <Field label={t('admin.annTextFr')} required>
          {(id) => <TextInput id={id} value={form.text_fr} onChange={(e) => setForm({ ...form, text_fr: e.target.value })} />}
        </Field>
        <Field label={t('admin.annTextEn')}>
          {(id) => <TextInput id={id} value={form.text_en} onChange={(e) => setForm({ ...form, text_en: e.target.value })} />}
        </Field>
        <Field label={t('admin.annHref')} hint={t('admin.annHrefHint')}>
          {(id) => <TextInput id={id} value={form.href} placeholder="/category/seconde_main" onChange={(e) => setForm({ ...form, href: e.target.value })} />}
        </Field>
        <label className="flex items-center gap-3 rounded-card border border-hairline p-3">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="h-5 w-5 accent-[#C25E38]"
          />
          <span className="flex-1 text-body text-ink">{t('admin.annActive')}</span>
        </label>
        <Button onClick={save} loading={busy}>{t('common.save')}</Button>
      </div>
    </section>
  );
}

// Candidature vendeur + KYC assisté par OCR. Le bouton envoie le CHEMIN de la
// pièce à la fonction kyc-ocr; c'est elle qui lit le fichier du bucket privé
// côté serveur (service-role) et renvoie les champs extraits. L'IA n'approuve
// ni ne rejette RIEN — elle pose les infos côte à côte avec ce que la
// candidate a déclaré, et l'humain tranche.
function ApplicationCard({ app, onChanged }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [ocr, setOcr] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(null); // 'front' | 'back' | null
  const [ocrError, setOcrError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function analyze(side) {
    const path = side === 'front' ? app.id_front_url : app.id_back_url;
    if (!path) return;
    setOcrLoading(side);
    setOcrError(false);
    try {
      const { data, error } = await supabase.functions.invoke('kyc-ocr', { body: { image_path: path } });
      if (error || !data?.type_piece) throw error || new Error('empty');
      setOcr(data);
    } catch {
      setOcrError(true);
    } finally {
      setOcrLoading(null);
    }
  }

  async function decide(status) {
    setBusy(true);
    const { error } = await supabase.from('vendor_applications').update({ status }).eq('id', app.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t(status === 'approved' ? 'admin.appApproved' : 'admin.appRejected'));
    onChanged?.();
  }

  const declared = [app.first_name, app.last_name].filter(Boolean).join(' ');
  const extracted = ocr ? [ocr.prenom, ocr.nom].filter(Boolean).join(' ') : '';
  const norm = (x) => (x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const match = ocr && declared && extracted ? norm(declared) === norm(extracted) : null;
  const hasId = app.id_front_url || app.id_back_url;
  const status = app.status || 'pending';

  return (
    <li className="rounded-card border border-hairline p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="line-clamp-1 text-body font-semibold text-ink">{app.shop_name}</p>
          <p className="text-caption text-muted">
            {declared || '—'} · {[app.city, app.country].filter(Boolean).join(', ')} · {timeAgo(app.created_at, i18n.language)}
          </p>
        </div>
        <span className={`chip shrink-0 ${status === 'approved' ? 'border-success text-success' : status === 'rejected' ? 'border-danger text-danger' : 'border-brass text-brass'}`}>
          {t(`admin.appStatus.${status}`, { defaultValue: status })}
        </span>
      </div>

      {hasId && (
        <div className="mt-2 flex flex-wrap gap-2">
          {app.id_front_url && (
            <button onClick={() => analyze('front')} disabled={!!ocrLoading} className="chip text-teal disabled:opacity-50">
              {ocrLoading === 'front' ? <IconLoader2 size={14} className="animate-spin" /> : <IconId size={14} />}
              {t('admin.kycAnalyzeFront')}
            </button>
          )}
          {app.id_back_url && (
            <button onClick={() => analyze('back')} disabled={!!ocrLoading} className="chip text-teal disabled:opacity-50">
              {ocrLoading === 'back' ? <IconLoader2 size={14} className="animate-spin" /> : <IconId size={14} />}
              {t('admin.kycAnalyzeBack')}
            </button>
          )}
        </div>
      )}
      {ocrError && <p className="mt-2 text-caption text-danger">{t('admin.kycError')}</p>}
      {ocr && (
        <div className="mt-2 rounded-input bg-base p-2.5 text-caption">
          <p className="text-ink">
            <span className="font-semibold">{t('admin.kycType')}:</span> {ocr.type_piece}
            {' · '}
            <span className="font-semibold">{t('admin.kycReadable')}:</span> {ocr.lisible ? '✓' : '✗'}
          </p>
          {extracted && (
            <p className="mt-1 text-ink">
              <span className="font-semibold">{t('admin.kycName')}:</span> {extracted}
              {match != null && (
                <span className={`ml-1 font-semibold ${match ? 'text-success' : 'text-danger'}`}>
                  {match ? t('admin.kycMatch') : t('admin.kycMismatch', { declared })}
                </span>
              )}
            </p>
          )}
          {ocr.date_naissance && <p className="mt-0.5 text-muted">{t('admin.kycBirth')}: {ocr.date_naissance}</p>}
          {ocr.date_expiration && <p className="mt-0.5 text-muted">{t('admin.kycExpiry')}: {ocr.date_expiration}</p>}
          {ocr.remarques && <p className="mt-0.5 text-muted">{ocr.remarques}</p>}
          <p className="mt-1.5 text-[11px] text-muted">{t('admin.kycDisclaimer')}</p>
        </div>
      )}

      {status === 'pending' && (
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" disabled={busy} className="flex-1" onClick={() => decide('approved')}>
            <IconCheck size={17} /> {t('admin.approve')}
          </Button>
          <Button variant="secondary" disabled={busy} className="flex-1 !border-danger/50 !text-danger" onClick={() => decide('rejected')}>
            <IconX size={17} /> {t('admin.reject')}
          </Button>
        </div>
      )}
    </li>
  );
}
