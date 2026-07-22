import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowRight, IconShieldCheck, IconTruckDelivery, IconSparkles } from '@tabler/icons-react';
import { CATEGORIES } from '../src/lib/categories';
import { useSettings } from '../src/hooks/useSettings';

// Marketing landing — same "Lagune & Encre" design system as the app.
export default function Landing() {
  const { t } = useTranslation();
  const { language, setLanguage } = useSettings();

  return (
    <div className="mx-auto min-h-screen max-w-app bg-white">
      <header className="flex h-14 items-center px-4">
        <span className="flex items-center gap-1 text-title font-semibold text-teal">Finjaro<span className="h-1.5 w-1.5 rounded-full bg-brass" /></span>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} className="text-caption font-semibold text-teal">
            {language === 'fr' ? 'EN' : 'FR'}
          </button>
          <Link to="/auth" className="text-caption font-semibold text-teal">{t('auth.login')}</Link>
        </div>
      </header>

      <section className="px-6 pt-10 text-center">
        <span className="inline-flex items-center gap-1 rounded-pill bg-teal/10 px-3 py-1 text-caption font-semibold text-teal">
          <IconSparkles size={14} /> {t('common.tagline')}
        </span>
        <h1 className="mt-4 text-[28px] font-semibold leading-tight text-ink">
          {language === 'fr'
            ? 'La marketplace beauté, mode & déco pour l’Afrique et la diaspora.'
            : 'The beauty, fashion & decor marketplace for Africa and the diaspora.'}
        </h1>
        <p className="mt-3 text-body text-muted">
          {language === 'fr'
            ? 'Découvre des boutiques vérifiées, commande en toute confiance et vends au monde entier.'
            : 'Discover verified shops, order with confidence, and sell to the whole world.'}
        </p>
        <Link to="/" className="btn-primary mx-auto mt-6 max-w-xs">
          {language === 'fr' ? 'Entrer dans Finjaro' : 'Enter Finjaro'} <IconArrowRight size={18} />
        </Link>
      </section>

      <section className="mt-10 px-4">
        <h2 className="mb-3 px-2 text-section text-ink">{t('categories.title')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.slice(0, 9).map((c) => (
            <Link key={c.id} to={`/category/${c.id}`} className="overflow-hidden rounded-card border border-hairline">
              <img src={c.banner} alt="" aria-hidden="true" loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <p className="px-2 py-1.5 text-caption text-ink">{t(`categories.${c.id}`)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-3 px-6">
        <Feature icon={IconShieldCheck} title={language === 'fr' ? 'Boutiques vérifiées' : 'Verified shops'} desc={language === 'fr' ? 'Identité et téléphone contrôlés.' : 'Identity and phone checked.'} />
        <Feature icon={IconTruckDelivery} title={language === 'fr' ? 'Paiement à la livraison' : 'Cash on delivery'} desc={language === 'fr' ? 'Tu paies à la réception.' : 'You pay on receipt.'} />
        <Feature icon={IconSparkles} title="Finou Chou" desc={language === 'fr' ? 'Ton assistant shopping IA.' : 'Your AI shopping assistant.'} />
      </section>

      <footer className="mt-12 px-6 pb-10 text-center">
        <Link to="/" className="btn-secondary mx-auto max-w-xs">
          {language === 'fr' ? 'Commencer maintenant' : 'Get started now'}
        </Link>
        <p className="mt-6 text-caption text-muted">© {new Date().getFullYear()} Finjaro — {t('common.tagline')}</p>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-hairline p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal"><Icon size={22} /></span>
      <div>
        <p className="text-body font-semibold text-ink">{title}</p>
        <p className="text-caption text-muted">{desc}</p>
      </div>
    </div>
  );
}
