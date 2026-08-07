import { useTranslation } from 'react-i18next';
import { IconGift, IconCopy, IconShare2, IconUsersGroup } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

// Les paliers « 10 amis = 5 € » et « 50 vendeurs actifs = 50 € » ont été
// retirés (décision Beau, 07/08): la récompense était affichée à tout le
// monde alors qu'aucun versement n'était en place. Une promesse d'argent
// visible dans l'app engage — juridiquement comme vis-à-vis des utilisatrices
// — et Google Play exige de la déclarer comme « récompense en espèces », ce
// qui durcit l'examen pour une fonctionnalité qui n'existait pas vraiment.
//
// Le parrainage lui-même reste entier: lien personnel, `referred_by` en base,
// et la liste des personnes parrainées. Seule la promesse chiffrée disparaît.
// Rétablir un programme récompensé demandera d'abord de décider du barème et
// du mode de versement.
export default function InviteFriend() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const toast = useToast();
  const link = profile?.referral_code ? `${window.location.origin}/auth?ref=${profile.referral_code}` : '';

  const { data, loading } = useAsync(async () => {
    if (!profile?.id) return { rows: [] };
    const { data: rows } = await supabase
      .from('profiles')
      .select('id, name, created_at')
      .eq('referred_by', profile.id)
      .order('created_at', { ascending: false });
    return { rows: rows || [] };
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
