import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import { useOutletContext } from 'react-router-dom';
import { formatPrice, currencyForCountry } from '../lib/currency';

// Renders an FCFA-stored amount in the user's selected currency, app-wide.
// `currency` force la devise — utilisé par l'espace vendeur, voir plus bas.
export function Price({ fcfa, className = '', currency: forced }) {
  const { currency, language } = useSettings();
  return <span className={className}>{formatPrice(fcfa, forced || currency, language)}</span>;
}

// Le prix tel que LA VENDEUSE le voit: dans la devise de SA boutique.
//
// Signalé par Beau, capture à l'appui: une vendeuse à Douala voyait son
// catalogue en euros. Sa boutique est pourtant bien enregistrée au Cameroun —
// la donnée était juste, c'est l'affichage qui mentait.
//
// La cause: `Price` affiche dans la devise de CELUI QUI REGARDE. C'est le bon
// choix pour une acheteuse — elle veut le prix dans sa monnaie. Mais dans
// l'espace vendeur, la personne ne « regarde » pas un prix: elle gère le sien.
// Le formulaire d'article le savait déjà et saisissait en devise de boutique
// (`toFcfa(..., shopCurrency)`); les écrans qui RELISENT ces montants, eux,
// repassaient par la devise du téléphone. On tapait donc en FCFA pour relire
// des euros.
//
// Et la devise du téléphone se trompe facilement: faute de fuseau exploitable,
// la détection retombe sur la langue du système. Un téléphone camerounais
// réglé en « fr-FR » — c'est courant — annonce la France.
//
// Un vendeur doit voir ses chiffres dans la monnaie où il les a pensés.
//
// La boutique vient du contexte déjà fourni par `VendorLayout` — pas d'une
// requête à elle. Un composant qui interrogerait la base lui-même déclencherait
// un appel PAR PRIX affiché: une liste de vingt articles en ferait vingt.
export function VendorPrice({ fcfa, className = '' }) {
  const { shop } = useOutletContext() || {};
  // Tant que la boutique n'est pas chargée, on ne force rien: `Price` garde la
  // devise habituelle. Forcer le repli ici ferait clignoter des dollars sur
  // l'écran d'une vendeuse camerounaise avant de se corriger.
  const currency = shop?.country ? currencyForCountry(shop.country) : undefined;
  return <Price fcfa={fcfa} className={className} currency={currency} />;
}

// Remise réelle en %, ou null s'il n'y en a pas.
//
// `compare_at_price_fcfa` est le prix AVANT promo (le prix barré). On refuse
// tout ce qui n'est pas une vraie baisse: un "avant" absent, nul, inférieur
// ou égal au prix courant ne donne PAS de badge. Sans ce garde-fou, une
// saisie vendeur à l'envers afficherait "-0 %" ou une remise négative, et un
// prix barré plus BAS que le prix demandé — le contraire d'une promo.
// Arrondi à l'entier inférieur: on préfère annoncer -29 % pour 29,8 % que de
// promettre -30 % que le calcul ne tient pas.
export function discountPercent(priceFcfa, compareAtFcfa) {
  const price = Number(priceFcfa);
  const before = Number(compareAtFcfa);
  if (!Number.isFinite(price) || !Number.isFinite(before)) return null;
  if (before <= price || before <= 0) return null;
  const pct = Math.floor(((before - price) / before) * 100);
  return pct >= 1 ? pct : null;
}

// Pastille "-30 %". Volontairement en rouge plein: c'est le seul élément de
// l'app qui doit accrocher l'œil avant la photo.
export function PromoBadge({ percent, className = '' }) {
  return (
    <span
      className={`rounded-pill bg-danger px-2 py-0.5 text-caption font-semibold text-white ${className}`}
    >
      −{percent} %
    </span>
  );
}

// Prix courant + ancien prix barré à côté, quand il y a une vraie promo.
// Un seul endroit décide de la mise en forme d'un prix remisé, pour que la
// carte produit, la fiche article et tout ce qui viendra après restent
// cohérents.
export function PriceBlock({ fcfa, compareAtFcfa, className = '', compareClassName = '' }) {
  const { t } = useTranslation();
  const pct = discountPercent(fcfa, compareAtFcfa);
  if (!pct) return <Price fcfa={fcfa} className={className} />;
  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <Price fcfa={fcfa} className={className} />
      <Price
        fcfa={compareAtFcfa}
        className={`text-caption text-muted line-through ${compareClassName}`}
      />
      {/* Lu à voix haute par les lecteurs d'écran, qui ne rendent pas le
          barré: sans ça, deux prix se suivent sans qu'on sache lequel payer. */}
      <span className="sr-only">{t('product.wasPrice')}</span>
    </span>
  );
}
