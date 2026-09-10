import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconEye, IconEyeOff, IconDeviceFloppy, IconExternalLink } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { Field, TextInput, Select } from '../../components/Field';
import { Skeleton, ErrorState } from '../../components/states';
import { accentClass } from '../../lib/apps';

// L'environnement Finjaro se tient d'ici.
//
// La liste des applications vit en base (table finjaro_apps): inscrire une
// nouvelle application, corriger son adresse ou la masquer se fait donc
// SANS redéploiement et sans passer par moi — et le sélecteur de toutes les
// applications Finjaro suit immédiatement.
const VIDE = { key: '', name: '', tagline: '', url: '', emoji: '', accent: 'teal', audience: 'tous', sort_order: 50 };

export default function AdminApps() {
  const { t } = useTranslation();
  const toast = useToast();
  const [edit, setEdit] = useState(null); // ligne en cours d'édition, ou VIDE pour un ajout
  const [busy, setBusy] = useState(false);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: rows, error: e } = await supabase
      .from('finjaro_apps')
      .select('*')
      .order('sort_order', { ascending: true });
    if (e) throw e;
    return rows || [];
  }, []);

  async function enregistrer() {
    const ligne = {
      key: edit.key.trim(),
      name: edit.name.trim(),
      tagline: edit.tagline?.trim() || null,
      url: edit.url.trim(),
      emoji: edit.emoji?.trim() || null,
      accent: edit.accent,
      audience: edit.audience,
      sort_order: Number(edit.sort_order) || 50,
    };
    if (!ligne.key || !ligne.name || !ligne.url) return toast.error(t('admin.apps.missing'));
    if (!/^https?:\/\//i.test(ligne.url)) return toast.error(t('admin.apps.badUrl'));
    setBusy(true);
    const { error: e } = edit.id
      ? await supabase.from('finjaro_apps').update(ligne).eq('id', edit.id)
      : await supabase.from('finjaro_apps').insert(ligne);
    setBusy(false);
    if (e) return toast.error(e.message);
    toast.success(t('admin.apps.saved'));
    setEdit(null);
    retry();
  }

  async function basculer(app) {
    const { error: e } = await supabase
      .from('finjaro_apps')
      .update({ is_active: !app.is_active })
      .eq('id', app.id);
    if (e) return toast.error(e.message);
    retry();
  }

  if (loading) return <div className="space-y-2 p-4"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>;
  if (error) return <ErrorState onRetry={retry} />;

  return (
    <div className="p-4">
      <p className="mb-3 text-caption text-muted">{t('admin.apps.intro')}</p>

      <ul className="space-y-2">
        {(data || []).map((a) => (
          <li key={a.id} className={`card flex items-center gap-3 p-3 ${a.is_active ? '' : 'opacity-60'}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-input text-[20px] ${accentClass(a.accent)}`}>
              {a.emoji || (a.name || '?').charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-semibold text-ink">{a.name}</p>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-1 text-caption text-muted"
              >
                <span className="truncate underline">{a.url}</span>
                <IconExternalLink size={12} className="shrink-0" />
              </a>
              <p className="text-caption text-muted">
                {t(`admin.apps.audience.${a.audience}`)} · {t('admin.apps.order')} {a.sort_order}
              </p>
            </div>
            <button
              onClick={() => basculer(a)}
              aria-label={a.is_active ? t('admin.apps.hide') : t('admin.apps.show')}
              className="rounded-full p-2 text-muted hover:bg-base"
            >
              {a.is_active ? <IconEye size={18} /> : <IconEyeOff size={18} />}
            </button>
            <button onClick={() => setEdit(a)} className="text-caption font-semibold text-teal">
              {t('common.edit')}
            </button>
          </li>
        ))}
      </ul>

      {edit ? (
        <div className="card mt-4 space-y-3 p-4">
          <h3 className="text-section text-ink">{edit.id ? edit.name : t('admin.apps.addTitle')}</h3>
          <Field label={t('admin.apps.name')} required>
            {(id) => <TextInput id={id} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} maxLength={60} />}
          </Field>
          <Field label={t('admin.apps.key')} hint={t('admin.apps.keyHint')} required>
            {(id) => (
              <TextInput
                id={id}
                value={edit.key}
                disabled={!!edit.id}
                onChange={(e) => setEdit({ ...edit, key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                maxLength={30}
              />
            )}
          </Field>
          <Field label={t('admin.apps.url')} required>
            {(id) => <TextInput id={id} type="url" inputMode="url" placeholder="https://" value={edit.url} onChange={(e) => setEdit({ ...edit, url: e.target.value })} />}
          </Field>
          <Field label={t('admin.apps.tagline')}>
            {(id) => <TextInput id={id} value={edit.tagline || ''} onChange={(e) => setEdit({ ...edit, tagline: e.target.value })} maxLength={90} />}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('admin.apps.emoji')}>
              {(id) => <TextInput id={id} value={edit.emoji || ''} onChange={(e) => setEdit({ ...edit, emoji: e.target.value })} maxLength={4} />}
            </Field>
            <Field label={t('admin.apps.order')}>
              {(id) => <TextInput id={id} type="number" value={edit.sort_order} onChange={(e) => setEdit({ ...edit, sort_order: e.target.value })} />}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('admin.apps.color')}>
              {(id) => (
                <Select id={id} value={edit.accent} onChange={(e) => setEdit({ ...edit, accent: e.target.value })}>
                  <option value="teal">{t('admin.apps.colors.teal')}</option>
                  <option value="brass">{t('admin.apps.colors.brass')}</option>
                  <option value="ink">{t('admin.apps.colors.ink')}</option>
                </Select>
              )}
            </Field>
            <Field label={t('admin.apps.audienceLabel')}>
              {(id) => (
                <Select id={id} value={edit.audience} onChange={(e) => setEdit({ ...edit, audience: e.target.value })}>
                  <option value="tous">{t('admin.apps.audience.tous')}</option>
                  <option value="vendeuse">{t('admin.apps.audience.vendeuse')}</option>
                  <option value="admin">{t('admin.apps.audience.admin')}</option>
                </Select>
              )}
            </Field>
          </div>
          <div className="flex gap-2">
            <Button onClick={enregistrer} loading={busy}><IconDeviceFloppy size={18} /> {t('common.save')}</Button>
            <Button variant="secondary" onClick={() => setEdit(null)}>{t('common.cancel')}</Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEdit({ ...VIDE })}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-hairline py-3 text-body font-semibold text-teal"
        >
          <IconPlus size={18} /> {t('admin.apps.add')}
        </button>
      )}
    </div>
  );
}
