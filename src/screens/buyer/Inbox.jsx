import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconMessageOff, IconMessages } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl} from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { AppHeader } from '../../components/AppHeader';
import { ShopAvatar } from '../../components/ShopAvatar';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

// Shared conversation list. `vendor` flag switches perspective + link base.
// `activeId` surligne la conversation ouverte — indispensable en deux
// panneaux sur ordinateur, où la liste reste visible à côté du fil.
export function ConversationList({ vendor = false, activeId = null }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const { data, loading, error, retry } = useAsync(async () => {
    let query = supabase
      .from('conversations')
      .select('id, last_message, last_message_at, buyer_unread, vendor_unread, shop_id, shops(name, avatar_url, is_verified)')
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

  // Live-refresh the list when a conversation changes (new/updated message).
  useEffect(() => {
    if (!user) return undefined;
    const channel = supabase
      .channel(`inbox-${vendor ? 'v' : 'b'}-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => retry())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, vendor, retry]);

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
        const active = c.id === activeId;
        return (
          <li key={c.id}>
            <Link
              to={`${base}/${c.id}`}
              className={`flex items-center gap-3 border-b border-hairline px-4 py-3 transition-colors ${
                active ? 'border-l-[3px] border-l-teal bg-teal-light pl-[13px]' : 'hover:bg-base'
              }`}
            >
              <ShopAvatar src={c.shops?.avatar_url ? storageThumbUrl('shops', c.shops.avatar_url) : null} fallbackSrc={c.shops?.avatar_url ? storageUrl('shops', c.shops.avatar_url) : null} name={c.shops?.name} seed={c.shop_id} className="h-12 w-12" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-1 text-body font-semibold text-ink">
                    <span className="line-clamp-1">{c.shops?.name}</span>
                    {c.shops?.is_verified && <VerifiedBadge size={13} />}
                  </p>
                  <span className="shrink-0 text-caption text-muted">{timeAgo(c.last_message_at, i18n.language)}</span>
                </div>
                {/* Un message non lu se lit en gras: on repère d'un coup d'œil
                    ce qui attend une réponse, sans compter les pastilles. */}
                <p className={`line-clamp-1 text-caption ${unread > 0 ? 'font-semibold text-ink' : 'text-muted'}`}>
                  {c.last_message || '—'}
                </p>
              </div>
              {unread > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-teal px-1 text-[11px] font-semibold text-white">{unread}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// Deux panneaux sur ordinateur (liste à gauche, fil à droite) — sur un écran
// large, ouvrir une conversation faisait disparaître toutes les autres, alors
// que la place ne manque pas. Sur mobile, rien ne change: une page à la fois.
export function MessagesShell({ vendor = false, activeId = null, children }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-[340px] shrink-0 flex-col border-r border-hairline lg:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-hairline px-4">
          <h1 className="text-section text-ink">{t('inbox.title')}</h1>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConversationList vendor={vendor} activeId={activeId} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export default function Inbox() {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isDesktop) {
    return (
      <MessagesShell>
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <IconMessages size={44} stroke={1.5} className="text-hairline" />
          <p className="text-body text-muted">{t('inbox.pickConversation')}</p>
        </div>
      </MessagesShell>
    );
  }

  return (
    <div>
      <AppHeader title={t('inbox.title')} back />
      <ConversationList />
    </div>
  );
}
