import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconMessageCircle, IconFlag, IconUserCircle } from '@tabler/icons-react';
import { storageThumbUrl, storageUrl } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useUI } from '../../hooks/useUI';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { getPublicProfile, followUser, unfollowUser, startDirectConversation, directErrorKey } from '../../lib/directMessages';
import { AppHeader } from '../../components/AppHeader';
import { ShopAvatar } from '../../components/ShopAvatar';
import { Button } from '../../components/Button';
import { BlockButton } from '../../components/BlockButton';
import { ReportModal } from '../../components/ReportModal';
import { Skeleton, ErrorState, EmptyState } from '../../components/states';

// La fiche publique d'UN COMPTE (pas une boutique): nom, avatar, compteurs
// d'abonnements — jamais téléphone/adresse/e-mail (get_public_profile,
// migration 0099, n'expose que ça). C'est ici qu'on suit quelqu'un et
// qu'on lui écrit.
export default function PublicProfile() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireLogin } = useUI();
  const toast = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: person, loading, error, retry } = useAsync(async () => getPublicProfile(id), [id]);

  async function toggleFollow() {
    if (!user) return requireLogin();
    setBusy(true);
    try {
      if (person.i_follow) {
        await unfollowUser(user.id, id);
      } else {
        await followUser(user.id, id);
      }
      retry();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function write() {
    if (!user) return requireLogin();
    setBusy(true);
    try {
      const convId = await startDirectConversation(id);
      navigate(`/profile/messages/${convId}`);
    } catch (e) {
      toast.error(t(directErrorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div>
        <AppHeader title="" back />
        <div className="space-y-3 p-4">
          <Skeleton className="mx-auto h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    );
  }
  if (error) return <ErrorState onRetry={retry} />;
  if (!person) {
    return (
      <div>
        <AppHeader title="" back />
        <EmptyState icon={IconUserCircle} title={t('admin.deletedTarget')} />
      </div>
    );
  }

  const isSelf = user?.id === person.id;
  const avatar = person.avatar_url ? storageThumbUrl('shops', person.avatar_url) : null;
  const avatarFallback = person.avatar_url ? storageUrl('shops', person.avatar_url) : null;

  return (
    <div className="pb-6">
      <AppHeader
        title={person.name}
        back
        right={
          !isSelf && (
            <>
              <BlockButton userId={person.id} />
              <button onClick={() => setReportOpen(true)} className="p-1.5 text-muted" aria-label={t('report.report')}>
                <IconFlag size={19} />
              </button>
            </>
          )
        }
      />
      <div className="flex flex-col items-center gap-2 px-4 pt-6 text-center">
        <ShopAvatar src={avatar} fallbackSrc={avatarFallback} name={person.name} seed={person.id} className="h-20 w-20" />
        <p className="text-title text-ink">{person.name}</p>
        <div className="flex gap-4 text-caption text-muted">
          <span>{t('dm.followers', { count: person.followers_count })}</span>
          <span>{t('dm.followingCount', { count: person.following_count })}</span>
        </div>

        {!isSelf && (
          <div className="mt-3 flex w-full max-w-xs gap-2">
            <Button variant={person.i_follow ? 'secondary' : 'primary'} loading={busy} onClick={toggleFollow} className="flex-1">
              {person.i_follow ? t('dm.unfollow') : person.follows_me ? t('dm.followBack') : t('dm.follow')}
            </Button>
            <Button
              variant="secondary"
              disabled={!person.i_follow}
              loading={busy}
              onClick={write}
              className="flex-1"
              title={!person.i_follow ? t('dm.mustFollowHint') : undefined}
            >
              <IconMessageCircle size={18} /> {t('dm.write')}
            </Button>
          </div>
        )}
        {!isSelf && !person.i_follow && <p className="mt-1 text-caption text-muted">{t('dm.mustFollowHint')}</p>}
      </div>

      {!isSelf && <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} targetType="user" targetId={person.id} />}
    </div>
  );
}
