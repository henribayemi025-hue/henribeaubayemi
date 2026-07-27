import { useTranslation } from 'react-i18next';
import { IconGift, IconCopy, IconShare2, IconUsersGroup, IconRosetteDiscountCheckFilled } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

const FRIENDS_GOAL = 10;
const VENDORS_GOAL = 50;

export default function InviteFriend() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const toast = useToast();
  const link = profile?.referral_code ? `${window.location.origin}/auth?ref=${profile.referral_code}` : '';

  const { data, loading } = useAsync(async () => {
    if (!profile?.id) return { rows: [], sellingVendors: 0 };
    const { data: rows } = await supabase
      .from('profiles')
      .select('id, name, created_at')
      .eq('referred_by', profile.id)
      .order('created_at', { ascending: false });
    const ids = (rows || []).map((r) => r.id);
    let sellingVendors = 0;
    if (ids.length > 0) {
      // A referred vendor "counts" only once they've actually sold something —
      // matches Beau's payout rule (real transaction, not just a shop signup).
      const { data: shops } = await supabase.from('shops').select('id, owner_id').in('owner_id', ids);
      const shopIds = (shops || []).map((s) => s.id);
      if (shopIds.length > 0) {
        const { data: paidOrders } = await supabase
          .from('orders')
          .select('shop_id')
          .in('shop_id', shopIds)
          .not('paid_at', 'is', null);
        sellingVendors = new Set((paidOrders || []).map((o) => o.shop_id)).size;
      }
    }
    return { rows: rows || [], sellingVendors };
  }, [profile?.id]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t('referral.copied'));
    } catch {
      toast.error(t('errors.generic'));
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Finjaro', url: link });
        return;
      } catch {
        /* user cancelled or unsupported — fall through to clipboard */
      }
    }
    copyLink();
  }

  return (
    <div className="pb-6">
      <AppHeader title={t('referral.title')} back />
      <div className="space-y-6 p-4">
        <div className="rounded-2xl bg-ink p-5 text-white">
          <IconGift size={28} className="text-brass" />
          <p className="mt-2 text-body">{t('referral.intro')}</p>
        </div>

        <div>
          <p className="mb-2 text-caption font-semibold text-muted">{t('referral.yourLink')}</p>
          <div className="flex items-center gap-2 rounded-input border border-hairline p-2">
            <span className="flex-1 truncate text-caption text-ink">{link || '…'}</span>
            <button onClick={copyLink} aria-label={t('referral.copy')} className="rounded-full p-2 text-teal hover:bg-teal-light">
              <IconCopy size={18} />
            </button>
          </div>
          <button
            onClick={shareLink}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-input bg-teal py-3 text-body font-semibold text-white"
          >
            <IconShare2 size={18} /> {t('referral.share')}
          </button>
        </div>

        {!loading && (
          <div className="space-y-3">
            <MilestoneCard
              done={data.rows.length}
              goal={FRIENDS_GOAL}
              label={t('referral.friendsGoal', { goal: FRIENDS_GOAL })}
              reward={t('referral.friendsReward')}
            />
            <MilestoneCard
              done={data.sellingVendors}
              goal={VENDORS_GOAL}
              label={t('referral.vendorsGoal', { goal: VENDORS_GOAL })}
              reward={t('referral.vendorsReward')}
            />
          </div>
        )}

        <div>
          <h2 className="mb-2 text-section text-ink">{t('referral.invited')} {data?.rows.length > 0 && `(${data.rows.length})`}</h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : data.rows.length === 0 ? (
            <EmptyState icon={IconUsersGroup} title={t('referral.emptyInvited')} />
          ) : (
            <ul className="divide-y divide-hairline rounded-card border border-hairline">
              {data.rows.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-body text-ink">{p.name}</span>
                  <span className="text-caption text-muted">{timeAgo(p.created_at, i18n.language)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MilestoneCard({ done, goal, label, reward }) {
  const reached = done >= goal;
  const pct = Math.min(100, Math.round((done / goal) * 100));
  return (
    <div className={`rounded-card border p-3 ${reached ? 'border-teal bg-teal-light' : 'border-hairline'}`}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-body font-semibold text-ink">
          {reached && <IconRosetteDiscountCheckFilled size={16} className="text-teal" />}
          {label}
        </p>
        <p className="text-caption font-semibold text-teal">{reward}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-pill bg-hairline">
        <div className="h-full rounded-pill bg-teal transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-caption text-muted">{done} / {goal}</p>
    </div>
  );
}
