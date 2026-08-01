import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconUsers, IconBan, IconCheck, IconShieldHalfFilled, IconBuildingStore } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/Field';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const FILTERS = [
  { key: 'all', match: () => true },
  { key: 'vendors', match: (u) => u.is_vendor },
  { key: 'suspended', match: (u) => u.is_suspended },
  { key: 'admins', match: (u) => u.is_admin },
];

export default function AdminUsers() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: rows, error: err } = await supabase
      .from('profiles')
      .select('id, name, phone, city, country, is_vendor, is_admin, is_suspended, report_count, created_at, referral_code')
      .order('created_at', { ascending: false });
    if (err) throw err;
    return rows || [];
  }, []);

  const filtered = useMemo(() => {
    const needle = normalize(q.trim());
    const f = FILTERS.find((x) => x.key === filter);
    return (data || [])
      .filter(f.match)
      .filter((u) => !needle || normalize(`${u.name} ${u.phone || ''} ${u.city || ''}`).includes(needle));
  }, [data, q, filter]);

  if (loading) return <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  return (
    <div className="space-y-3 p-4">
      <div className="relative">
        <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.searchUsers')} className="pl-10" />
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`chip shrink-0 ${filter === f.key ? 'chip-active' : 'text-ink'}`}
          >
            {t(`admin.userFilter.${f.key}`)}
            <span className="ml-1 font-semibold">({(data || []).filter(f.match).length})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={IconUsers} title={t('admin.noUsers')} />
      ) : (
        <ul className="divide-y divide-hairline rounded-card border border-hairline">
          {filtered.map((u) => (
            <li key={u.id}>
              <button onClick={() => setOpen(u)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-light text-body font-semibold text-teal">
                  {(u.name || '?').trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-body text-ink">
                    <span className="truncate font-medium">{u.name || '—'}</span>
                    {u.is_admin && <IconShieldHalfFilled size={14} className="shrink-0 text-brass" />}
                    {u.is_vendor && <IconBuildingStore size={14} className="shrink-0 text-teal" />}
                  </p>
                  <p className="truncate text-caption text-muted">
                    {[u.phone, u.city].filter(Boolean).join(' · ') || timeAgo(u.created_at, i18n.language)}
                  </p>
                </div>
                {u.is_suspended && (
                  <span className="shrink-0 rounded-pill bg-danger-bg px-2 py-0.5 text-[10px] font-bold text-danger">
                    {t('admin.suspended')}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <UserSheet user={open} onClose={() => setOpen(null)} onChanged={retry} lang={i18n.language} />
    </div>
  );
}

function UserSheet({ user, onClose, onChanged, lang }) {
  const { t } = useTranslation();
  const { user: me } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  // Se suspendre ou se retirer soi-même les droits d'admin fermerait la porte
  // de l'intérieur — l'écran d'administration ne serait plus accessible à
  // personne. Ces deux boutons sont donc désactivés sur son propre compte.
  const isSelf = user.id === me?.id;

  async function patch(fields, successKey) {
    setBusy(true);
    const { error } = await supabase.from('profiles').update(fields).eq('id', user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t(successKey));
    onChanged();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={user.name || t('admin.account')}>
      <dl className="space-y-1 text-body">
        <Row label={t('becomeVendor.phone')} value={user.phone} />
        <Row label={t('becomeVendor.city')} value={[user.city, user.country].filter(Boolean).join(', ')} />
        <Row label={t('admin.joinedOn')} value={timeAgo(user.created_at, lang)} />
        <Row label={t('admin.isVendor')} value={user.is_vendor ? t('common.yes') : t('common.no')} />
        <Row label={t('admin.reportCount')} value={user.report_count || 0} />
        <Row label={t('admin.referralCode')} value={user.referral_code} />
      </dl>

      <div className="mt-4 space-y-2">
        <Button
          variant="secondary"
          disabled={busy || isSelf}
          className={user.is_suspended ? '' : '!border-danger/50 !text-danger'}
          onClick={() => patch({ is_suspended: !user.is_suspended }, user.is_suspended ? 'admin.userReactivated' : 'admin.userSuspended')}
        >
          {user.is_suspended ? <IconCheck size={17} /> : <IconBan size={17} />}
          {user.is_suspended ? t('admin.reactivateAccount') : t('admin.suspendAccount')}
        </Button>
        <Button
          variant="secondary"
          disabled={busy || isSelf}
          onClick={() => patch({ is_admin: !user.is_admin }, user.is_admin ? 'admin.adminRevoked' : 'admin.adminGranted')}
        >
          <IconShieldHalfFilled size={17} />
          {user.is_admin ? t('admin.revokeAdmin') : t('admin.makeAdmin')}
        </Button>
        {isSelf && <p className="text-[11px] text-muted">{t('admin.selfLocked')}</p>}
      </div>
    </Modal>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-hairline py-1 last:border-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="truncate text-right font-medium text-ink">{value || '—'}</dd>
    </div>
  );
}
