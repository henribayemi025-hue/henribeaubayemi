import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconLogin2, IconBuildingStore, IconPlus, IconShare2, IconTrash, IconGift, IconArrowRight } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useVendorStatus } from '../hooks/useVendorStatus';
import { useUI } from '../hooks/useUI';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';

// Le registre des ecrans que Finia peut ouvrir (migration
// 0067_destinations_finia.sql). Chargee une fois par session client: c'est
// une table publique en lecture, quasi jamais modifiee — pas besoin de la
// redemander a chaque bulle de chat.
let destinationsCache = null;
let destinationsPromise = null;
function loadDestinations() {
  if (destinationsCache) return Promise.resolve(destinationsCache);
  if (!destinationsPromise) {
    destinationsPromise = supabase
      .from('assistant_destinations')
      .select('id,route,libelle_bouton,necessite_connexion,necessite_boutique')
      .eq('actif', true)
      .then(({ data }) => {
        destinationsCache = data || [];
        return destinationsCache;
      });
  }
  return destinationsPromise;
}

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
  const [destinations, setDestinations] = useState(destinationsCache);

  useEffect(() => {
    if (action?.startsWith('goto:') && !destinations) {
      loadDestinations().then(setDestinations);
    }
  }, [action, destinations]);

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

  if (action === 'vendor_space') {
    // Vendeur perdu en mode acheteur (« où est ma boutique ? », « je ne
    // trouve pas mes articles »): la réponse texte explique le mode vendeur,
    // ce bouton l'y emmène. Pas encore vendeur -> le formulaire d'ouverture;
    // candidature en cours -> rien, le texte suffit.
    if (status === 'approved') {
      return (
        <button
          onClick={() => { onNavigate?.(); navigate('/switch/to-vendor'); }}
          className="mt-2 flex w-fit items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
        >
          <IconBuildingStore size={14} /> {t('finou.actionVendorSpace')}
        </button>
      );
    }
    if (status === 'pending') return null;
    return (
      <button
        onClick={() => { onNavigate?.(); navigate('/become-vendor'); }}
        className="mt-2 flex w-fit items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
      >
        <IconBuildingStore size={14} /> {t('finou.actionBecomeVendor')}
      </button>
    );
  }

  if (action === 'referral') {
    // Symetrique a 'sell': pas de boutique -> on ouvre la porte d'entree
    // (le parrainage recompense une boutique, pas juste un compte), sinon
    // direct vers l'ecran ou elle partage son lien.
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
    if (status !== 'approved' || !shop) {
      return (
        <button
          onClick={() => { onNavigate?.(); navigate('/become-vendor'); }}
          className="mt-2 flex w-fit items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
        >
          <IconBuildingStore size={14} /> {t('finou.actionBecomeVendor')}
        </button>
      );
    }
    return (
      <button
        onClick={() => { onNavigate?.(); navigate('/profile/invite'); }}
        className="mt-2 flex w-fit items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
      >
        <IconGift size={14} /> {t('finou.actionReferral')}
      </button>
    );
  }

  if (action?.startsWith('goto:')) {
    // Le generique: tout ce qui n'a pas sa propre logique (sell, referral...)
    // passe par ici. Meme garde-fous connexion/boutique que les actions
    // fixes, mais lus dans la table plutot que codes en dur pour chaque
    // nouvel ecran — c'est tout le but du registre.
    const dest = destinations?.find((d) => d.id === action.slice(5));
    if (!dest) return null; // pas encore charge, ou id inconnu — pas de bouton casse
    if (dest.necessite_connexion && !user) {
      return (
        <button
          onClick={() => { onNavigate?.(); requireLogin(); }}
          className="mt-2 flex w-fit items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
        >
          <IconLogin2 size={14} /> {t('finou.actionLogin')}
        </button>
      );
    }
    if (dest.necessite_boutique && (status !== 'approved' || !shop)) {
      return (
        <button
          onClick={() => { onNavigate?.(); navigate('/become-vendor'); }}
          className="mt-2 flex w-fit items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
        >
          <IconBuildingStore size={14} /> {t('finou.actionBecomeVendor')}
        </button>
      );
    }
    return (
      <button
        onClick={() => { onNavigate?.(); navigate(dest.route); }}
        className="mt-2 flex w-fit items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
      >
        <IconArrowRight size={14} /> {dest.libelle_bouton}
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
