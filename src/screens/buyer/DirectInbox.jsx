import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconMessageOff, IconUserPlus } from '@tabler/icons-react';
import { supabase, storageThumbUrl, storageUrl } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { getPublicProfiles } from '../../lib/directMessages';
import { AppHeader } from '../../components/AppHeader';
import { ShopAvatar } from '../../components/ShopAvatar';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

// Messages personnels: deux piles jamais mélangées, comme TikTok/Instagram —
// une "demande" (l'autre ne te suit pas encore, un seul message envoyé)
// n'est pas une conversation ouverte, et la montrer pareil laisserait croire
// qu'on peut y répondre comme à n'importe quel message.
export default function DirectInbox() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('chats');

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: convs, error: err } = await supabase
      .from('direct_conversations')
      .select('id, user_a_id, user_b_id, initiator_id, unlocked, last_message, last_message_at, a_unread, b_unread')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });
    if (err) throw err;
    const otherIds = (convs || []).map((c) => (c.user_a_id === user.id ? c.user_b_id : c.user_a_id));
    const profiles = await getPublicProfiles([...new Set(otherIds)]);
    const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));
    return (convs || []).map((c) => {
      const otherId = c.user_a_id === user.id ? c.user_b_id : c.user_a_id;
      const unread = c.user_a_id === user.id ? c.a_unread : c.b_unread;
      return { ...c, other: byId[otherId] || { id: otherId, name: '—', avatar_url: null }, unread };
    });
  }, [user]);

  if (loading) {
    return (
      <div>
        <AppHeader title={t('dm.title')} back right={<FindButton navigate={navigate} />} />
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }
  if (error) return <ErrorState onRetry={retry} />;

  // Une "demande" en attente: pas encore débloquée, et je ne suis pas
  // celle qui a écrit — c'est à MOI de répondre pour l'ouvrir.
  const requests = data.filter((c) => !c.unlocked && c.initiator_id !== user.id);
  const chats = data.filter((c) => c.unlocked || c.initiator_id === user.id);
  const list = tab === 'chats' ? chats : requests;

  return (
    <div>
      <AppHeader title={t('dm.title')} back right={<FindButton navigate={navigate} />} />
      <div className="flex border-b border-hairline">
        {['chats', 'requests'].map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`flex-1 border-b-2 py-2.5 text-caption font-semibold ${
              tab === tb ? 'border-teal text-teal' : 'border-transparent text-muted'
            }`}
          >
            {t(tb === 'chats' ? 'dm.chatsTab' : 'dm.requestsTab')}
            {tb === 'requests' && requests.length > 0 && (
              <span className="ml-1.5 rounded-pill bg-danger px-1.5 py-0.5 text-[10px] text-white">{requests.length}</span>
            )}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={IconMessageOff} title={t(tab === 'chats' ? 'dm.emptyChats' : 'dm.emptyRequests')} />
      ) : (
        <ul>
          {list.map((c) => (
            <li key={c.id}>
              <Link
                to={`/profile/messages/${c.id}`}
                className="flex items-center gap-3 border-b border-hairline px-4 py-3 transition-colors hover:bg-base"
              >
                <ShopAvatar
                  src={c.other.avatar_url ? storageThumbUrl('shops', c.other.avatar_url) : null}
                  fallbackSrc={c.other.avatar_url ? storageUrl('shops', c.other.avatar_url) : null}
                  name={c.other.name}
                  seed={c.other.id}
                  className="h-12 w-12"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-body font-semibold text-ink">{c.other.name}</p>
                    <span className="shrink-0 text-caption text-muted">{timeAgo(c.last_message_at, i18n.language)}</span>
                  </div>
                  <p className={`line-clamp-1 text-caption ${c.unread > 0 ? 'font-semibold text-ink' : 'text-muted'}`}>
                    {c.last_message || '—'}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-teal px-1 text-[11px] font-semibold text-white">
                    {c.unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FindButton({ navigate }) {
  const { t } = useTranslation();
  return (
    <button onClick={() => navigate('/profile/people')} aria-label={t('dm.findPeople')} className="rounded-full p-1.5 text-ink">
      <IconUserPlus size={22} />
    </button>
  );
}
