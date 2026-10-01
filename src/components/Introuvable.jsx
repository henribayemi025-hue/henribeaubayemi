import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSearch } from '@tabler/icons-react';
import { useSettings } from '../hooks/useSettings';
import { fetchProductPage } from '../lib/homeCache';
import { ProductCard } from './ProductCard';

// Une seule page « introuvable » (audit du 01/10, M-10 et M-11) pour une
// adresse inconnue, un article retiré ou une boutique fermée. Avant : l'accueil
// hors de sa mise en page (débordement de 1 187 px au téléphone) pour la
// première, un mot et un bouton Retour pour les deux autres — une cliente qui
// suit un vieux lien repartait. Ici : ce qui s'est passé, une recherche, les
// rubriques, et de vrais articles du moment.
//
// `genre` : 'page' | 'produit' | 'boutique'. `boutique` (facultatif) : la
// boutique d'un article retiré, si elle existe encore.
export function Introuvable({ genre = 'page', boutique = null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { country } = useSettings();
  const [q, setQ] = useState('');
  const [articles, setArticles] = useState([]);

  // Le serveur renvoie la page de l'application (200) pour toute adresse : on
  // dit au moins aux moteurs de recherche de ne pas indexer cette page-ci.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    let vivant = true;
    fetchProductPage(country, null)
      .then((page) => { if (vivant) setArticles((page?.items || []).slice(0, 8)); })
      .catch(() => {});
    return () => { vivant = false; };
  }, [country]);

  function chercher(e) {
    e.preventDefault();
    const terme = q.trim();
    navigate(terme ? `/search?q=${encodeURIComponent(terme)}` : '/search');
  }

  return (
    <div className="mx-auto w-full max-w-app px-4 py-8 lg:max-w-5xl">
      <p className="text-caption font-semibold uppercase tracking-wider text-brass">{t('introuvable.surtitre')}</p>
      <h1 className="mt-1 font-serif text-[28px] font-semibold leading-tight text-ink lg:text-[36px]">{t(`introuvable.titre_${genre}`)}</h1>
      <p className="mt-2 max-w-prose text-body text-muted">{t(`introuvable.texte_${genre}`)}</p>

      <form onSubmit={chercher} role="search" className="mt-5 flex max-w-xl items-center gap-2 rounded-pill border border-hairline bg-white px-4 py-2.5">
        <IconSearch size={18} className="shrink-0 text-muted" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('introuvable.chercher')}
          aria-label={t('introuvable.chercher')}
          className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-muted"
        />
      </form>

      <nav className="mt-4 flex flex-wrap gap-2" aria-label={t('introuvable.rubriques')}>
        {boutique?.slug && (
          <Link to={`/boutique/${boutique.slug}`} className="rounded-pill bg-terracotta px-4 py-2 text-caption font-semibold text-white">
            {t('introuvable.voirBoutique', { nom: boutique.name })}
          </Link>
        )}
        <Link to="/" className="rounded-pill border border-hairline bg-white px-4 py-2 text-caption font-semibold text-ink">{t('introuvable.accueil')}</Link>
        <Link to="/boutiques" className="rounded-pill border border-hairline bg-white px-4 py-2 text-caption font-semibold text-ink">{t('introuvable.boutiques')}</Link>
        <Link to="/services" className="rounded-pill border border-hairline bg-white px-4 py-2 text-caption font-semibold text-ink">{t('introuvable.services')}</Link>
      </nav>

      {articles.length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-title text-ink">{t('introuvable.duMoment')}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {articles.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
