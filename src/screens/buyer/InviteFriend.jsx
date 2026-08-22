import { useTranslation } from 'react-i18next';
import { IconGift, IconCopy, IconShare2, IconUsersGroup, IconSparkles, IconBuildingStore } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';
import { estEnAvant } from '../../lib/featured';

// Les paliers « 10 amis = 5 € » et « 50 vendeurs actifs = 50 € » ont été
// retirés (décision Beau, 07/08): la récompense était affichée à tout le
// monde alors qu'aucun versement n'était en place. Une promesse d'argent
// visible dans l'app engage — juridiquement comme vis-à-vis des utilisatrices
// — et Google Play exige de la déclarer comme « récompense en espèces ».
//
// Il ne restait donc qu'un lien à partager, sans rien au bout, et rangé dans
// le seul menu acheteuse. Résultat mesuré: 55 comptes, chacun avec son code,
// et ZÉRO filleul enregistré depuis l'ouverture.
//
// Beau, 15/08: « le parrainage c'est pas genre argent, c'est genre bonus
// visibilité ». La récompense est donc une place devant sur l'accueil et dans
// l'annuaire, sept jours par filleule qui ouvre VRAIMENT sa boutique — pas à
// l'inscription, sinon on paierait des faux comptes. C'est ce que cette page
// annonce, et c'est la base qui l'attribue: rien ne peut se donner tout seul.
export default function InviteFriend() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const toast = useToast();
  const link = profile?.referral_code ? `${window.location.origin}/auth?ref=${profile.referral_code}` : '';

  const { data, loading } = useAsync(async () => {
    if (!profile?.id) return { rows: [], shop: null };
    const [{ data: rows }, { data: shop }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, name, created_at, is_vendor')
        .eq('referred_by', profile.id)
        .order('created_at', { ascending: false }),
      // La boutique de la personne, s'il y en a une: c'est elle qui porte la
      // mise en avant, pas le compte.
      supabase
        .from('shops')
        .select('id, featured_until')
        .eq('owner_id', profile.id)
        .maybeSingle(),
    ]);
    return { rows: rows || [], shop: shop || null };
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
        await navigator.share({ title: 'Finjaro', text: t('referral.shareText'), url: link });
        return;
      } catch {
        /* user cancelled or unsupported — fall through to clipboard */
      }
    }
    copyLink();
  }

  const enAvant = estEnAvant(data?.shop);
  // On ne compte que les filleules qui ont OUVERT une boutique: c'est ce qui
  // donne des jours, et afficher un autre nombre à côté de la récompense
  // ferait croire à un dû qui n'existe pas.
  const vendeuses = (data?.rows || []).filter((p) => p.is_vendor).length;

  return (
    <div className="pb-6">
      <AppHeader title={t('referral.title')} back />
      <div className="space-y-6 p-4">
        <div className="rounded-2xl bg-ink p-5 text-white">
          <IconGift size={28} className="text-brass" />
          <p className="mt-2 text-body">{t('referral.intro')}</p>
          <p className="mt-2 text-caption text-white/70">{t('referral.rewardRule')}</p>
        </div>

        {/* L'état de la récompense, en clair. Une vendeuse doit pouvoir
            vérifier qu'elle a bien reçu ce qu'on lui a promis — sinon la
            promesse ne vaut rien la deuxième fois. */}
        {data?.shop && (
          <div className={`flex items-start gap-3 rounded-card border p-3 ${enAvant ? 'border-brass/40 bg-brass/8' : 'border-hairline'}`}>
            <IconSparkles size={20} className={`mt-0.5 shrink-0 ${enAvant ? 'text-brass' : 'text-muted'}`} />
            <div className="min-w-0">
              <p className="text-body font-semibold text-ink">
                {enAvant
                  ? t('referral.featuredUntil', { when: new Date(data.shop.featured_until).toLocaleDateString(i18n.language) })
                  : t('referral.notFeatured')}
              </p>
              <p className="mt-0.5 text-caption text-muted">
                {t('referral.vendorsBrought', { count: vendeuses })}
              </p>
            </div>
          </div>
        )}

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
                <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-body text-ink">{p.name}</span>
                    {/* Qui a ouvert une boutique — donc qui a rapporté des
                        jours de mise en avant, et qui n'en a pas encore. */}
                    {p.is_vendor && <IconBuildingStore size={14} className="shrink-0 text-teal" />}
                  </span>
                  <span className="shrink-0 text-caption text-muted">{timeAgo(p.created_at, i18n.language)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
