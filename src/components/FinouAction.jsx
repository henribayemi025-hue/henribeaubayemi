import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconLogin2, IconBuildingStore, IconPlus, IconShare2, IconTrash } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useVendorStatus } from '../hooks/useVendorStatus';
import { useUI } from '../hooks/useUI';
import { useToast } from '../hooks/useToast';

// One-tap follow-through when Finou detects an intent ('login' | 'sell').
// The destination is always decided from the REAL account state client-side
// (never from the LLM, which can't know it reliably) — login opens the
// existing login prompt; selling routes to add-product if already an
// approved vendor, to become-vendor otherwise. Pending applications render
// nothing (no dead button — the reply text already explains).
// `onStartWizard` (only passed from FinouChou) offers the guided in-chat
// product wizard as the primary path for an approved vendor, alongside the
// classic full-form shortcut.
export function FinouAction({ action, onNavigate, onStartWizard, onStartDelete }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireLogin } = useUI();
  const { status, shop } = useVendorStatus();
  const toast = useToast();

  async function shareShop() {
    const url = `${window.location.origin}/boutique/${shop.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shop.name, url });
        return;
      } catch {
        /* user cancelled or unsupported — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('vendor.shopLinkCopied'));
    } catch {
      toast.error(t('errors.generic'));
    }
  }

  if (action === 'login') {
    if (user) return null; // already signed in — nothing to offer
    return (
      <button
        onClick={() => { onNavigate?.(); requireLogin(); }}
        className="mt-2 flex w-fit items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
      >
        <IconLogin2 size={14} /> {t('finou.actionLogin')}
      </button>
    );
  }

  if (action === 'sell') {
    if (!user) {
      return (
        <button
          onClick={() => { onNavigate?.(); requireLogin(); }}
          className="mt-2 flex w-fit items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
        >
          <IconLogin2 size={14} /> {t('finou.actionLogin')}
        </button>
      );
    }
    if (status === 'approved') {
      return (
        <div className="mt-2 flex flex-wrap gap-2">
          {onStartWizard && (
            <button
              onClick={onStartWizard}
              className="inline-flex items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
            >
              <IconPlus size={14} /> {t('finou.actionAddProduct')}
            </button>
          )}
          <button
            onClick={() => { onNavigate?.(); navigate('/vendor/products/new'); }}
            className={
              onStartWizard
                ? 'inline-flex items-center gap-1 rounded-pill border border-hairline px-3 py-1 text-caption font-semibold text-ink'
                : 'inline-flex items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white'
            }
          >
            <IconPlus size={14} /> {onStartWizard ? t('finou.actionFullForm') : t('finou.actionAddProduct')}
          </button>
        </div>
      );
    }
    if (status === 'pending') return null; // already applying — reply text covers it
    return (
      <button
        onClick={() => { onNavigate?.(); navigate('/become-vendor'); }}
        className="mt-2 flex w-fit items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
      >
        <IconBuildingStore size={14} /> {t('finou.actionBecomeVendor')}
      </button>
    );
  }

  if (action === 'share_shop') {
    if (status !== 'approved' || !shop) return null; // no shop to share
    return (
      <button
        onClick={shareShop}
        className="mt-2 flex w-fit items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
      >
        <IconShare2 size={14} /> {t('finou.actionShareShop')}
      </button>
    );
  }

  if (action === 'delete_product') {
    if (status !== 'approved' || !onStartDelete) return null; // no shop / not in FinouChou
    return (
      <button
        onClick={onStartDelete}
        className="mt-2 flex w-fit items-center gap-1 rounded-pill border border-danger px-3 py-1 text-caption font-semibold text-danger"
      >
        <IconTrash size={14} /> {t('finouDelete.title')}
      </button>
    );
  }

  return null;
}
