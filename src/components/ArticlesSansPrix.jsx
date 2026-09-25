import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconTag, IconChevronDown } from '@tabler/icons-react';
import { supabase, storageThumbUrl } from '../lib/supabase';
import { currencyForCountry, toFcfa } from '../lib/currency';
import { isQuoteOnly } from '../lib/categories';

// LA CARTE « ARTICLES SANS PRIX » (25/09). Sur les fiches les plus vues de la
// place de marché, la plupart n'affichent aucun prix : l'acheteuse ne peut pas
// décider. Beau : AUCUNE notification de plus — la demande se fait ici, là où
// la vendeuse gère déjà ses articles. Textes de Plume et Lien, critères
// d'Atelier, cas de vérification de Rigo :
// - seulement ses articles EN LIGNE en « sur demande », hors catégories sur
//   devis, hors articles retirés par la modération, hors ceux qu'elle a déjà
//   décidé de garder « sur demande » (sur_demande_voulu_le) ;
// - le prix se tape dans la devise de SA boutique ; sans pays de boutique, on
//   ne suppose aucune devise : on lui demande d'abord le pays ;
// - « Garder sur demande » est un droit, dit sans reproche.

export function aPrixManquant(p) {
  return !!p.is_active && !!p.price_on_request && !isQuoteOnly(p.category) && !p.moderation_hidden_at && !p.sur_demande_voulu_le;
}

export function lirePrix(brut) {
  const v = Number(String(brut ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(v) && v > 0 && v < 1e10 ? v : null;
}

export function ArticlesSansPrix({ shop, rows, onChange }) {
  const { t } = useTranslation();
  const [saisies, setSaisies] = useState({});
  const [erreurs, setErreurs] = useState({});
  const [enCours, setEnCours] = useState(null);
  const [tout, setTout] = useState(false);
  const [pourquoi, setPourquoi] = useState(false);
  const [finiIci, setFiniIci] = useState(false);
  const liste = rows.filter(aPrixManquant);
  const devise = shop?.country ? currencyForCountry(shop.country) : null;

  if (!liste.length) {
    return finiIci ? (
      <div className="mx-4 mt-3 rounded-card border border-teal/30 bg-teal/10 p-3">
        <p className="text-body font-semibold text-ink">{t('vendor.sansPrix.fini')}</p>
        <p className="mt-0.5 text-caption text-muted">{t('vendor.sansPrix.finiSuite')}</p>
      </div>
    ) : null;
  }

  async function enregistrer(p) {
    const v = lirePrix(saisies[p.id]);
    if (v == null) { setErreurs((e) => ({ ...e, [p.id]: t('vendor.sansPrix.erreur') })); return; }
    setEnCours(p.id);
    const patch = { price_on_request: false, price_fcfa: toFcfa(v, devise), prix_saisi: v, devise_saisie: devise };
    const { error } = await supabase.from('products').update(patch).eq('id', p.id);
    setEnCours(null);
    if (error) { setErreurs((e) => ({ ...e, [p.id]: t('vendor.sansPrix.erreur') })); return; }
    if (liste.length === 1) setFiniIci(true);
    onChange(p.id, patch);
  }
  async function garder(p) {
    setEnCours(p.id);
    const patch = { sur_demande_voulu_le: new Date().toISOString() };
    const { error } = await supabase.from('products').update(patch).eq('id', p.id);
    setEnCours(null);
    if (error) { setErreurs((e) => ({ ...e, [p.id]: error.message })); return; }
    if (liste.length === 1) setFiniIci(true);
    onChange(p.id, patch);
  }

  const visibles = tout ? liste : liste.slice(0, 4);
  return (
    <section className="mx-4 mt-3 rounded-card border border-brass/40 bg-brass/10 p-3" aria-labelledby="sans-prix-titre">
      <div className="flex items-start gap-2">
        <IconTag size={20} className="mt-0.5 shrink-0 text-brass" />
        <div className="min-w-0 flex-1">
          <h2 id="sans-prix-titre" className="text-body font-semibold text-ink">{t('vendor.sansPrix.titre', { count: liste.length })}</h2>
          <p className="mt-0.5 text-caption text-muted">{t('vendor.sansPrix.phrase')}</p>
        </div>
      </div>

      {!devise ? (
        <p className="mt-2 text-caption text-ink">
          {t('vendor.sansPrix.sansPays')} <Link to="/vendor/shop" className="font-semibold text-teal underline">{t('vendor.sansPrix.choisirPays')}</Link>
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {visibles.map((p) => {
            const img = Array.isArray(p.images) && p.images[0] ? storageThumbUrl(p.images[0]) : null;
            return (
              <li key={p.id} className="rounded-card bg-white p-2.5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  {img ? <img src={img} alt="" className="h-11 w-11 shrink-0 rounded-md object-cover" /> : <span className="h-11 w-11 shrink-0 rounded-md bg-hairline" />}
                  <p className="min-w-0 flex-1 truncate text-caption font-semibold text-ink">{p.name}</p>
                </div>
                <form className="mt-2 flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); enregistrer(p); }}>
                  <label className="sr-only" htmlFor={`prix-${p.id}`}>{t('vendor.sansPrix.champ')}</label>
                  <div className="flex w-full min-w-0 items-center rounded-input border border-hairline bg-white focus-within:border-teal sm:w-auto sm:flex-1">
                    <input id={`prix-${p.id}`} inputMode="decimal" autoComplete="off" placeholder={t('vendor.sansPrix.champCourt')}
                      value={saisies[p.id] ?? ''} onChange={(e) => { setSaisies((s) => ({ ...s, [p.id]: e.target.value })); setErreurs((x) => ({ ...x, [p.id]: null })); }}
                      className="min-w-0 flex-1 bg-transparent px-3 py-2 text-body text-ink outline-none" />
                    <span className="shrink-0 pr-3 text-caption font-semibold text-muted">{devise}</span>
                  </div>
                  <button type="submit" disabled={enCours === p.id} className="rounded-pill bg-teal px-3 py-2 text-caption font-semibold text-white disabled:opacity-50">{t('vendor.sansPrix.enregistrer')}</button>
                  <button type="button" disabled={enCours === p.id} onClick={() => garder(p)} className="text-caption font-semibold text-muted underline disabled:opacity-50">{t('vendor.sansPrix.garder')}</button>
                </form>
                {erreurs[p.id] && <p className="mt-1 text-caption text-danger">{erreurs[p.id]}</p>}
              </li>
            );
          })}
        </ul>
      )}
      {liste.length > 4 && devise && (
        <button type="button" onClick={() => setTout(!tout)} className="mt-2 text-caption font-semibold text-teal">
          {tout ? t('vendor.sansPrix.moins') : t('vendor.sansPrix.tous', { count: liste.length })}
        </button>
      )}
      <button type="button" onClick={() => setPourquoi(!pourquoi)} aria-expanded={pourquoi} className="mt-2 flex items-center gap-1 text-caption font-semibold text-brass">
        {t('vendor.sansPrix.pourquoi')} <IconChevronDown size={14} className={pourquoi ? 'rotate-180' : ''} />
      </button>
      {pourquoi && (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-caption text-muted">
          <li>{t('vendor.sansPrix.raison1')}</li>
          <li>{t('vendor.sansPrix.raison2')}</li>
          <li>{t('vendor.sansPrix.raison3')}</li>
          <li>{t('vendor.sansPrix.legitime')}</li>
        </ul>
      )}
    </section>
  );
}
