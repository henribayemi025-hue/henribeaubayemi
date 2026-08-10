import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconShoppingBag, IconBuildingStore, IconSparkles } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';

// « J'ai rechargé et je n'ai pas vu la visite. » — Beau, sur un compte créé
// onze minutes plus tôt, donc largement dans les temps.
//
// La cause: la marque « déjà vue » était posée sur le NAVIGATEUR, pas sur la
// personne. Or l'ancienne version la posait aussi pour les comptes anciens.
// Beau, connecté depuis des jours sur son compte habituel, avait donc déjà la
// marque; en créant un compte neuf dans le même navigateur, il héritait de la
// marque de l'ancien et la visite ne s'ouvrait jamais.
//
// Ce n'est pas qu'un problème de test: au Cameroun un téléphone sert souvent à
// plusieurs personnes. Avec une marque commune, la deuxième inscription du
// téléphone n'aurait jamais eu droit à la visite. La marque suit maintenant le
// compte.
const seenKey = (uid) => `finjaro:welcome-seen:${uid}`;

// Un compte de moins de 24 h est un compte qui vient d'arriver. Au-delà, la
// personne a déjà navigué: lui ouvrir une visite guidée serait déplacé.
const FRESH_MS = 24 * 60 * 60 * 1000;

// La visite guidée, proposée AU BON MOMENT: juste après l'inscription.
//
// Beau: « je viens de créer un compte et nulle part on ne m'a proposé la
// tournée de l'app ». Le guide existait pourtant — mais uniquement caché dans
// les suggestions de Finia, donc réservé à ceux qui pensaient à l'ouvrir.
// Quelqu'un qui vient de s'inscrire arrivait sur un fil d'articles sans que
// rien ne lui dise ce qu'il peut faire ici.
//
// UNE question, pas un carrousel de six écrans: acheter ou vendre ? C'est la
// seule chose qui change tout le reste, et c'est exactement ce que Finia
// demande en premier. Le choix ouvre l'assistante avec la question déjà
// posée — la personne n'a même pas à savoir quoi écrire.
export function WelcomeTour() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { openFinou } = useUI();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    try {
      if (localStorage.getItem(seenKey(user.id))) return;
    } catch { /* stockage indisponible: on montre, ce n'est pas grave */ }
    // Un compte ancien n'a rien à marquer: son âge suffit à l'écarter, et
    // écrire quoi que ce soit ici est précisément ce qui bloquait les autres.
    const created = new Date(profile?.created_at || user.created_at || 0).getTime();
    if (!created || Date.now() - created > FRESH_MS) return;
    setShow(true);
  }, [user, profile]);

  function dismiss() {
    try { localStorage.setItem(seenKey(user.id), '1'); } catch { /* noop */ }
    setShow(false);
  }

  function choose(question) {
    dismiss();
    openFinou(question);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center">
      <div className="w-full max-w-app rounded-t-2xl bg-white p-5 lg:rounded-2xl">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-light text-teal">
          <IconSparkles size={24} />
        </span>
        <p className="mt-3 text-center text-section text-ink">
          {t('welcome.title', { name: (profile?.name || '').split(' ')[0] || '' })}
        </p>
        <p className="mt-1 text-center text-caption text-muted">{t('welcome.hint')}</p>

        <div className="mt-4 space-y-2">
          <button
            onClick={() => choose(t('welcome.askBuy'))}
            className="flex w-full items-center gap-3 rounded-card border border-hairline p-3.5 text-left transition active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-base text-teal">
              <IconShoppingBag size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold text-ink">{t('welcome.buyTitle')}</span>
              <span className="block text-caption text-muted">{t('welcome.buyHint')}</span>
            </span>
          </button>

          <button
            onClick={() => choose(t('welcome.askSell'))}
            className="flex w-full items-center gap-3 rounded-card border border-hairline p-3.5 text-left transition active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-base text-teal">
              <IconBuildingStore size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold text-ink">{t('welcome.sellTitle')}</span>
              <span className="block text-caption text-muted">{t('welcome.sellHint')}</span>
            </span>
          </button>
        </div>

        <button onClick={dismiss} className="mt-3 w-full py-2 text-caption font-semibold text-muted">
          {t('welcome.skip')}
        </button>
      </div>
    </div>
  );
}
