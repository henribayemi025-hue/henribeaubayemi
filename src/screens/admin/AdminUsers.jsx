import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconUsers, IconBan, IconCheck, IconShieldHalfFilled, IconBuildingStore, IconUserX, IconAlertTriangle, IconEyeOff, IconMovie, IconPackage, IconKey, IconRefresh, IconCopy } from '@tabler/icons-react';
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

// Mot de passe temporaire lisible: on retire les caractères ambigus (0/O,
// 1/l/I) parce qu'il sera dicté ou recopié à la main sur WhatsApp, pas
// copié-collé par la vendeuse. 10 caractères tirés du hasard cryptographique.
function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const arr = new Uint32Array(10);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
}

const FILTERS = [
  { key: 'all', match: () => true },
  { key: 'vendors', match: (u) => u.is_vendor },
  { key: 'suspended', match: (u) => u.is_suspended },
  { key: 'admins', match: (u) => u.is_admin },
  { key: 'deletionRequested', match: (u) => !!u.deletion_requested_at },
];

export default function AdminUsers() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: rows, error: err } = await supabase
      .from('profiles')
      .select('id, name, phone, city, country, is_vendor, is_admin, is_suspended, report_count, created_at, referral_code, deletion_requested_at, deletion_reason')
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
                {u.deletion_requested_at && (
                  <span className="shrink-0 rounded-pill bg-danger-bg px-2 py-0.5 text-[10px] font-bold text-danger">
                    {t('admin.deletionRequested')}
                  </span>
                )}
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
      {user.deletion_requested_at && (
        <div className="mb-3 flex items-start gap-2 rounded-card border border-danger/40 bg-danger-bg p-3">
          <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <p className="text-caption font-semibold text-danger">
              {t('admin.deletionRequestedOn', { when: timeAgo(user.deletion_requested_at, lang) })}
            </p>
            {user.deletion_reason && (
              <p className="mt-1 text-caption text-ink">« {user.deletion_reason} »</p>
            )}
            <p className="mt-1 text-[11px] text-muted">{t('admin.deletionManualHint')}</p>
          </div>
        </div>
      )}

      <dl className="space-y-1 text-body">
        <Row label={t('becomeVendor.phone')} value={user.phone} />
        <Row label={t('becomeVendor.city')} value={[user.city, user.country].filter(Boolean).join(', ')} />
        <Row label={t('admin.joinedOn')} value={timeAgo(user.created_at, lang)} />
        <Row label={t('admin.isVendor')} value={user.is_vendor ? t('common.yes') : t('common.no')} />
        <Row label={t('admin.reportCount')} value={user.report_count || 0} />
        <Row label={t('admin.referralCode')} value={user.referral_code} />
      </dl>

      {/* Beau: « pouvoir voir le contenu de quelqu'un ». Suspendre un compte
          sans avoir regardé ce qu'il publie, c'est décider à l'aveugle: la
          liste des boutiques, des articles et des vidéos est ce qu'on veut
          lire AVANT d'appuyer sur le bouton rouge, pas après. */}
      <ContenuDuCompte userId={user.id} />

      <div className="mt-4 space-y-2">
        {user.deletion_requested_at && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => patch({ deletion_requested_at: null, deletion_reason: null }, 'admin.deletionMarkedDone')}
          >
            <IconUserX size={17} />
            {t('admin.deletionMarkDone')}
          </Button>
        )}
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

        <ResetPasswordBlock userId={user.id} userName={user.name} />
      </div>
    </Modal>
  );
}

// Ce que cette personne a publié. Chargé seulement à l'ouverture de la fiche
// (une requête par compte consulté, pas pour les 55 lignes de la liste).
function ContenuDuCompte({ userId }) {
  const { t } = useTranslation();
  const [etat, setEtat] = useState({ loading: true, shops: [], products: [], reels: [] });

  useEffect(() => {
    let vivant = true;
    (async () => {
      const { data: shops } = await supabase
        .from('shops')
        .select('id, name, slug, status, moderation_hidden_at')
        .eq('owner_id', userId);
      const ids = (shops || []).map((s) => s.id);
      if (!ids.length) {
        if (vivant) setEtat({ loading: false, shops: [], products: [], reels: [] });
        return;
      }
      const [{ data: products }, { data: reels }] = await Promise.all([
        supabase.from('products')
          .select('id, name, is_active, moderation_hidden_at')
          .in('shop_id', ids).order('created_at', { ascending: false }).limit(50),
        supabase.from('reels')
          .select('id, caption, moderation_hidden_at')
          .in('shop_id', ids).order('created_at', { ascending: false }).limit(30),
      ]);
      if (vivant) setEtat({ loading: false, shops: shops || [], products: products || [], reels: reels || [] });
    })();
    return () => { vivant = false; };
  }, [userId]);

  if (etat.loading) return <Skeleton className="mt-4 h-20 w-full" />;
  if (!etat.shops.length) {
    return <p className="mt-4 rounded-card bg-base p-3 text-caption text-muted">{t('admin.noContent')}</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {etat.shops.map((s) => (
        <div key={s.id} className="rounded-card border border-hairline p-3">
          <p className="flex items-center gap-1.5 text-body font-semibold text-ink">
            <IconBuildingStore size={16} className="shrink-0 text-teal" />
            <span className="truncate">{s.name}</span>
            {(s.moderation_hidden_at || s.status !== 'active') && (
              <IconEyeOff size={15} className="shrink-0 text-danger" />
            )}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-caption text-muted">
            <span className="inline-flex items-center gap-1">
              <IconPackage size={13} /> {t('admin.contentProducts', { count: etat.products.length })}
            </span>
            <span className="inline-flex items-center gap-1">
              <IconMovie size={13} /> {t('admin.contentReels', { count: etat.reels.length })}
            </span>
          </p>
          {s.slug && (
            <a href={`/boutique/${s.slug}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-caption font-semibold text-teal">
              {t('admin.openTarget')}
            </a>
          )}
        </div>
      ))}

      {/* Les titres, pas seulement les nombres: c'est en lisant les intitulés
          qu'on repère ce qui ne va pas. */}
      <ul className="max-h-56 divide-y divide-hairline overflow-y-auto rounded-card border border-hairline">
        {[
          ...etat.products.map((p) => ({ id: `p${p.id}`, nom: p.name, hors: !!p.moderation_hidden_at || !p.is_active, Icon: IconPackage })),
          ...etat.reels.map((r) => ({ id: `r${r.id}`, nom: r.caption || '—', hors: !!r.moderation_hidden_at, Icon: IconMovie })),
        ].map((x) => (
          <li key={x.id} className="flex items-center gap-2 px-3 py-1.5">
            <x.Icon size={13} className="shrink-0 text-muted" />
            <span className={`truncate text-caption ${x.hors ? 'text-muted line-through' : 'text-ink'}`}>{x.nom}</span>
          </li>
        ))}
      </ul>
    </div>
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

// Réinitialiser le mot de passe d'un compte. Ce n'est PAS un simple update de
// `profiles`: définir le mot de passe de quelqu'un d'autre passe par la clé de
// service, côté serveur — d'où l'appel à la fonction edge `admin-reset-password`.
// Le mot de passe est fabriqué ici, montré à l'admin AVANT et APRÈS l'envoi:
// c'est lui qui devra le transmettre à la personne (un compte téléphone n'a pas
// d'e-mail où recevoir un lien). On ne l'affiche donc jamais tout seul dans un
// journal — il ne vit que dans cet écran.
function ResetPasswordBlock({ userId, userName }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function start() {
    setPwd(genPassword());
    setDone(false);
    setOpen(true);
  }

  async function confirm() {
    if (pwd.trim().length < 6) return toast.error(t('admin.resetPasswordTooShort'));
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('admin-reset-password', {
      body: { user_id: userId, new_password: pwd.trim() },
    });
    setBusy(false);
    if (error || data?.error) return toast.error(t('admin.resetPasswordError'));
    setDone(true);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(pwd);
      toast.success(t('admin.copied'));
    } catch {
      toast.error(t('admin.copyFailed'));
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={start}>
        <IconKey size={17} />
        {t('admin.resetPassword')}
      </Button>
    );
  }

  return (
    <div className="rounded-card border border-hairline bg-base p-3">
      <p className="flex items-center gap-1.5 text-body font-semibold text-ink">
        <IconKey size={16} className="shrink-0 text-brass" />
        {t('admin.resetPasswordFor', { name: userName || t('admin.account') })}
      </p>

      {done ? (
        <>
          <p className="mt-2 text-caption text-muted">{t('admin.resetPasswordDoneHint')}</p>
          <div className="mt-2 flex items-center gap-2 rounded-input border border-hairline bg-white p-2">
            <code className="flex-1 select-all text-body font-semibold tracking-wide text-ink">{pwd}</code>
            <button type="button" onClick={copy} className="btn-ghost inline-flex items-center gap-1 text-caption font-semibold text-teal">
              <IconCopy size={15} /> {t('admin.copy')}
            </button>
          </div>
          <Button variant="secondary" className="mt-3" onClick={() => setOpen(false)}>
            {t('common.close')}
          </Button>
        </>
      ) : (
        <>
          <p className="mt-1 text-caption text-muted">{t('admin.resetPasswordIntro')}</p>
          <div className="mt-2 flex items-center gap-2">
            <TextInput value={pwd} onChange={(e) => setPwd(e.target.value)} className="font-semibold tracking-wide" />
            <button
              type="button"
              onClick={() => setPwd(genPassword())}
              disabled={busy}
              className="btn-ghost inline-flex shrink-0 items-center gap-1 text-caption font-semibold text-teal"
            >
              <IconRefresh size={15} /> {t('admin.regenerate')}
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirm} loading={busy}>
              {t('admin.resetPasswordConfirm')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
