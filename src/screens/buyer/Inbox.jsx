import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconMessageOff } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { AppHeader } from '../../components/AppHeader';
import { SmartImage } from '../../components/SmartImage';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

// Shared conversation list. `vendor` flag switches perspective + link base.
export function ConversationList({ vendor = false }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const { data, loading, error, retry } = useAsync(async () => {
    let query = supabase
      .from('conversations')
      .select('id, last_message, last_message_at, buyer_unread, vendor_unread, shop_id, shops(name, avatar_url)')
      .order('last_message_at', { ascending: false });
    if (vendor) {
      const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).maybeSingle();
      query = query.eq('shop_id', shop?.id || '00000000-0000-0000-0000-000000000000');
    } else {
      query = query.eq('buyer_id', user.id);
    }
    const { data: convs, error: err } = await query;
    if (err) throw err;
    return convs || [];
  }, [user, vendor]);

  const base = vendor ? '/vendor/messages' : '/chat';

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }
  if (error) return <ErrorState onRetry={retry} />;
  if (data.length === 0) return <EmptyState icon={IconMessageOff} title={t('inbox.empty')} hint={t('inbox.emptyHint')} />;

  return (
    <ul>
      {data.map((c) => {
        const unread = vendor ? c.vendor_unread : c.buyer_unread;
        return (
          <li key={c.id}>
            <Link to={`${base}/${c.id}`} className="flex items-center gap-3 border-b border-hairline px-4 py-3">
              <SmartImage src={c.shops?.avatar_url ? storageUrl('shops', c.shops.avatar_url) : null} alt={c.shops?.name} className="h-12 w-12" rounded="rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="line-clamp-1 text-body font-semibold text-ink">{c.shops?.name}</p>
                  <span className="text-caption text-muted">{timeAgo(c.last_message_at, i18n.language)}</span>
                </div>
                <p className="line-clamp-1 text-caption text-muted">{c.last_message || '—'}</p>
              </div>
              {unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal px-1 text-[11px] font-semibold text-white">{unread}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function Inbox() {
  const { t } = useTranslation();
  return (
    <div>
      <AppHeader title={t('inbox.title')} back />
      <ConversationList />
    </div>
  );
}
