import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconBrandGoogleFilled, IconMail, IconUserPlus, IconArrowLeft } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from './Spinner';

// La porte d'une application de l'environnement Finjaro (Legion, Mon
// argent) quand on n'est pas connecté.
//
// Beau, 22/09, capture de la page de connexion d'Accounting à l'appui: « il
// doit y avoir un truc comme ça pour Legion, Mon argent ». À gauche, ce
// que fait l'application en quatre cartes; à droite, « Continuer avec
// Google », e-mail ou téléphone, « Créer un compte », et la phrase « le
// même compte que sur Finjaro ». Un inconnu comprend où il est et entre
// chez lui — pas chez Beau.

const APPLIS = {
  legion: {
    logo: '/logos/leo.png',
    nom: 'Léo',
    fond: 'legion-app bg-legion-bg text-legion-ink',
    panneau: 'border-legion-line bg-legion-panel',
    carte: 'border-legion-line bg-legion-card',
    accent: 'bg-legion-gold text-legion-bg',
    sourd: 'text-legion-muted',
    ligne: 'border-legion-line',
    cartes: [
      ['porte.legion.c1t', 'Une équipe qui existe', 'porte.legion.c1', 'Des agents avec un nom, un visage et un poste : direction, marketing, finances, produit, concurrence.'],
      ['porte.legion.c2t', 'Un plan chaque matin', 'porte.legion.c2', 'Les responsables écrivent le plan de la semaine et du mois, à partir des vrais chiffres.'],
      ['porte.legion.c3t', 'Des livrables, pas des promesses', 'porte.legion.c3', 'Chaque agent rend son travail dans son salon : analyse, proposition, brouillon. Tu valides, ou tu renvoies.'],
      ['porte.legion.c4t', 'Tes données, en lecture seule', 'porte.legion.c4', 'Branche ta boutique Finjaro : ils lisent tes ventes et ton stock, jamais les numéros de tes clientes.'],
    ],
    accroche: ['porte.legion.accroche', 'Ton entreprise, avec une équipe d’agents qui travaillent chaque matin.'],
  },
  argent: {
    logo: '/logos/argent.png',
    nom: 'Mon argent',
    fond: 'bg-money-bg text-money-ink',
    panneau: 'border-money-line bg-money-card',
    carte: 'border-money-line bg-money-card',
    accent: 'bg-money-accent text-white',
    sourd: 'text-money-muted',
    ligne: 'border-money-line',
    cartes: [
      ['porte.argent.c1t', 'Tes comptes, d’un coup d’œil', 'porte.argent.c1', 'Espèces, mobile money, banque : combien tu as, et où.'],
      ['porte.argent.c2t', 'Un budget qui tient', 'porte.argent.c2', 'Ce qui entre, ce qui sort, mois par mois.'],
      ['porte.argent.c3t', 'L’épargne et les projets', 'porte.argent.c3', 'Des objectifs avec une date, et le chemin pour y arriver.'],
      ['porte.argent.c4t', 'Le njangi', 'porte.argent.c4', 'La tontine entre amis, tenue proprement.'],
    ],
    accroche: ['porte.argent.accroche', 'Ton argent, clair, sur ton téléphone et ton ordinateur.'],
  },
};

export function PorteApplication({ app, from }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const a = APPLIS[app];

  async function google() {
    const { error } = await signInWithGoogle(from);
    if (error) navigate('/auth', { state: { from } });
  }

  return (
    <div className={`h-dvh overflow-y-auto ${a.fond}`}>
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-6 lg:justify-center lg:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={a.logo} alt="" className="h-10 w-10 rounded-input object-cover" />
            <span className="text-section font-semibold">{a.nom}</span>
          </div>
          <Link to="/apps" className={`flex items-center gap-1 text-caption font-semibold ${a.sourd}`}><IconArrowLeft size={14} /> Finjaro</Link>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:mt-10 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
          <section>
            <h1 className="text-title font-semibold leading-tight">{t(a.accroche[0], a.accroche[1])}</h1>
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {a.cartes.map(([kt, dt, kd, dd]) => (
                <li key={kt} className={`rounded-card border p-4 ${a.carte}`}>
                  <p className="text-body font-semibold">{t(kt, dt)}</p>
                  <p className={`mt-1 text-caption leading-snug ${a.sourd}`}>{t(kd, dd)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className={`h-fit rounded-2xl border p-5 ${a.panneau}`}>
            <p className="text-body font-semibold">{t('porte.entrer', 'Entrer')}</p>
            <p className={`mt-0.5 text-caption ${a.sourd}`}>{t('porte.memeCompte', 'Le même compte que sur Finjaro.')}</p>
            <div className="mt-4 space-y-2.5">
              <button type="button" onClick={google} className={`flex w-full items-center justify-center gap-2 rounded-input px-4 py-3 text-body font-semibold ${a.accent}`}>
                <IconBrandGoogleFilled size={18} /> {t('porte.google', 'Continuer avec Google')}
              </button>
              <div className={`flex items-center gap-3 text-[11px] uppercase tracking-wider ${a.sourd}`}>
                <span className={`h-px flex-1 border-t ${a.ligne}`} /> {t('porte.ou', 'ou')} <span className={`h-px flex-1 border-t ${a.ligne}`} />
              </div>
              <button type="button" onClick={() => navigate('/auth', { state: { from, mode: 'login' } })}
                className={`flex w-full items-center justify-center gap-2 rounded-input border px-4 py-3 text-body font-semibold ${a.ligne}`}>
                <IconMail size={18} /> {t('porte.email', 'E-mail ou téléphone')}
              </button>
              <button type="button" onClick={() => navigate('/auth', { state: { from, mode: 'signup' } })}
                className={`flex w-full items-center justify-center gap-2 rounded-input px-4 py-3 text-body font-semibold ${a.sourd}`}>
                <IconUserPlus size={18} /> {t('porte.creer', 'Créer un compte')}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Le gardien: connecté → l'application; sinon → sa porte (et non la page
// de connexion de la place de marché, qui ne dit pas où l'on est).
export function Porte({ app, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className={`flex h-dvh items-center justify-center ${APPLIS[app].fond}`}>
        <Spinner />
      </div>
    );
  }
  if (!user) return <PorteApplication app={app} from={location.pathname} />;
  return children;
}
