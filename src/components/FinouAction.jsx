import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconLogin2, IconBuildingStore, IconPlus } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useVendorStatus } from '../hooks/useVendorStatus';
import { useUI } from '../hooks/useUI';

// One-tap follow-through when Finou detects an intent ('login' | 'sell').
// The destination is always decided from the REAL account state client-side
// (never from the LLM, which can't know it reliably) — login opens the
// existing login prompt; selling routes to add-product if already an
// approved vendor, to become-vendor otherwise. Pending applications render
// nothing (no dead button — the reply text already explains).
export function FinouAction({ action, onNavigate }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireLogin } = useUI();
  const { status } = useVendorStatus();

  if (action === 'login') {
    if (user) return null; // already signed in — nothing to offer
    return (
      <button
        onClick={() => { onNavigate?.(); requireLogin(); }}
        className="mt-2 inline-flex items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
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
          className="mt-2 inline-flex items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
        >
          <IconLogin2 size={14} /> {t('finou.actionLogin')}
        </button>
      );
    }
    if (status === 'approved') {
      return (
        <button
          onClick={() => { onNavigate?.(); navigate('/vendor/products/new'); }}
          className="mt-2 inline-flex items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
        >
          <IconPlus size={14} /> {t('finou.actionAddProduct')}
        </button>
      );
    }
    if (status === 'pending') return null; // already applying — reply text covers it
    return (
      <button
        onClick={() => { onNavigate?.(); navigate('/become-vendor'); }}
        className="mt-2 inline-flex items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
      >
        <IconBuildingStore size={14} /> {t('finou.actionBecomeVendor')}
      </button>
    );
  }

  return null;
}
