import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { Price } from '../components/Price';
import { useSettings } from '../hooks/useSettings';
import { formatPrice, currencyForCountry } from '../lib/currency';
import { BOUTIQUES_DEMO, ecrituresDeLaVente, lienAccounting, PART_COUT } from '../lib/demoBoutiques';

// La démonstration complète: on achète, on vend, et on regarde la
// comptabilité s'écrire.
//
// Demandé par Beau le 18/09: « on puisse se comporter en vendeur, acheteur…
// qu'en démo on peut acheter et ensuite regarder le processus d'achat et
// passer en écriture et extraire les rapports », et « mélanger » — c'est-à-
// dire un seul parcours qui traverse la place de marché PUIS Accounting,
// plutôt que deux démonstrations côte à côte.
//
// Ce que ça règle: on n'arrive plus à convaincre quelqu'un en décrivant un
// produit. Une prestataire qui demande « comment ça marche » peut désormais
// le voir en deux minutes, sans compte et sans rien installer.
//
// AUCUN APPEL À LA BASE. Tout l'état vit ici. Une boutique inventée ne doit
// jamais apparaître dans une vraie recherche, et une commande de
// démonstration ne doit jamais atterrir chez une vraie vendeuse.

const ETAPES = ['choix', 'cliente', 'vendeuse', 'compta'];

export default function Demo() {
  const { t } = useTranslation();
  const { currency: devisePerso, language } = useSettings();

  const [boutique, setBoutique] = useState(null);
  const [panier, setPanier] = useState([]);
  const [etape, setEtape] = useState('choix');
  // Cycle de vie d'une commande, le vrai: reçue → acceptée → livrée.
  const [statut, setStatut] = useState('recue');

  // La devise de la boutique. C'est celle que la VENDEUSE lit — jamais celle
  // du téléphone de qui regarde. Voir le §2 de CLAUDE.md: une vendeuse à
  // Douala qui relit son catalogue en euros ne peut rien en faire.
  const deviseBoutique = boutique ? currencyForCountry(boutique.pays) : 'FCFA';

  const totalFcfa = useMemo(
    () => panier.reduce((n, l) => n + (l.surDemande ? 0 : l.prixFcfa * l.qte), 0),
    [panier]
  );
  const aDuSurDemande = panier.some((l) => l.surDemande);

  function ajouter(article) {
    setPanier((prev) => {
      const trouve = prev.find((l) => l.id === article.id);
      if (trouve) return prev.map((l) => (l.id === article.id ? { ...l, qte: l.qte + 1 } : l));
      return [...prev, { ...article, qte: 1 }];
    });
  }

  function retirer(id) {
    setPanier((prev) => prev.filter((l) => l.id !== id));
  }

  function recommencer() {
    setBoutique(null);
    setPanier([]);
    setStatut('recue');
    setEtape('choix');
  }

  return (
    <div className="min-h-screen bg-base pb-16">
      <AppHeader title={t('demo.titre')} back />

      <div className="mx-auto w-full max-w-4xl px-4">
        <Bandeau texte={t('demo.bandeau')} />

        <Fil etape={etape} t={t} />

        {etape === 'choix' && (
          <ChoixBoutique
            t={t}
            onChoisir={(b) => {
              setBoutique(b);
              setEtape('cliente');
            }}
          />
        )}

        {etape === 'cliente' && boutique && (
          <CoteCliente
            t={t}
            boutique={boutique}
            panier={panier}
            totalFcfa={totalFcfa}
            aDuSurDemande={aDuSurDemande}
            devisePerso={devisePerso}
            onAjouter={ajouter}
            onRetirer={retirer}
            onCommander={() => setEtape('vendeuse')}
            onRetour={recommencer}
          />
        )}

        {etape === 'vendeuse' && boutique && (
          <CoteVendeuse
            t={t}
            language={language}
            boutique={boutique}
            deviseBoutique={deviseBoutique}
            devisePerso={devisePerso}
            panier={panier}
            totalFcfa={totalFcfa}
            statut={statut}
            onStatut={setStatut}
            onSuite={() => setEtape('compta')}
          />
        )}

        {etape === 'compta' && boutique && (
          <CoteCompta
            t={t}
            language={language}
            boutique={boutique}
            deviseBoutique={deviseBoutique}
            totalFcfa={totalFcfa}
            onRecommencer={recommencer}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

// Le bandeau ne se referme pas et ne se réduit pas: quelqu'un qui arrive par
// un lien partagé doit comprendre en une seconde que les boutiques et les
// chiffres sont inventés. Un écran de démonstration qu'on peut confondre avec
// le vrai produit finit en capture d'écran trompeuse.
function Bandeau({ texte }) {
  return (
    <p className="mt-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-caption text-ink">
      {texte}
    </p>
  );
}

function Fil({ etape, t }) {
  const index = ETAPES.indexOf(etape);
  return (
    <ol className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
      {ETAPES.map((cle, i) => (
        <li key={cle} className="flex shrink-0 items-center gap-2">
          <span
            className={[
              'rounded-full px-3 py-1 text-caption transition',
              i === index
                ? 'bg-teal text-white'
                : i < index
                  ? 'bg-teal-light text-teal'
                  : 'bg-black/5 text-muted',
            ].join(' ')}
          >
            {t(`demo.etape.${cle}`)}
          </span>
          {i < ETAPES.length - 1 && <span className="text-muted">›</span>}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------ 1. choix ------------------------------ */

function ChoixBoutique({ t, onChoisir }) {
  return (
    <section className="mt-5">
      <h2 className="text-title text-ink">{t('demo.choix.titre')}</h2>
      <p className="mt-1 text-body text-muted">{t('demo.choix.intro')}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {BOUTIQUES_DEMO.map((b) => (
          <button
            key={b.id}
            onClick={() => onChoisir(b)}
            className="overflow-hidden rounded-2xl border border-black/10 bg-white text-left transition active:scale-[0.99] hover:border-teal/40"
          >
            <img
              src={b.banniere}
              alt=""
              loading="lazy"
              className="h-32 w-full object-cover"
            />
            <div className="p-3">
              <p className="text-section text-ink">{b.nom}</p>
              <p className="text-caption text-muted">
                {b.metier} · {b.ville}, {b.paysNom}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- 2. cliente ----------------------------- */

function CoteCliente({
  t, boutique, panier, totalFcfa, aDuSurDemande, devisePerso,
  onAjouter, onRetirer, onCommander, onRetour,
}) {
  return (
    <section className="mt-5">
      <EnTeteRole
        role={t('demo.cliente.role')}
        explication={t('demo.cliente.explication', { devise: devisePerso })}
      />

      <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white">
        <img src={boutique.banniere} alt="" className="h-36 w-full object-cover" />
        <div className="p-4">
          <h2 className="text-title text-ink">{boutique.nom}</h2>
          <p className="text-caption text-muted">
            {boutique.metier} · {boutique.ville}, {boutique.paysNom}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {boutique.articles.map((a) => (
          <div key={a.id} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
            <img src={a.photo} alt="" loading="lazy" className="aspect-square w-full object-cover" />
            <div className="p-3">
              <p className="text-body text-ink">{a.nom}</p>
              <p className="mt-0.5 text-caption text-teal">
                {a.surDemande ? t('demo.surDemande') : <Price fcfa={a.prixFcfa} />}
              </p>
              <button
                onClick={() => onAjouter(a)}
                className="mt-2 w-full rounded-full bg-teal px-3 py-1.5 text-caption text-white transition active:scale-95"
              >
                {t('demo.cliente.ajouter')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {panier.length > 0 && (
        <div className="mt-5 rounded-2xl border border-black/10 bg-white p-4">
          <h3 className="text-section text-ink">{t('demo.cliente.panier')}</h3>
          <ul className="mt-2 divide-y divide-black/5">
            {panier.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-body text-ink">
                  {l.nom} × {l.qte}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-body text-ink">
                    {l.surDemande ? t('demo.surDemande') : <Price fcfa={l.prixFcfa * l.qte} />}
                  </span>
                  <button onClick={() => onRetirer(l.id)} className="text-caption text-muted underline">
                    {t('demo.cliente.retirer')}
                  </button>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 flex items-center justify-between text-body text-ink">
            <span>{t('demo.cliente.total')}</span>
            <span className="text-section">
              <Price fcfa={totalFcfa} />
            </span>
          </p>

          {/* Le sous-total ne compte QUE ce dont on connaît le prix. C'est la
              règle du vrai panier (useCart.jsx): additionner des zéros
              donnerait un total qui a l'air juste et qui est faux. */}
          {aDuSurDemande && (
            <p className="mt-1 text-caption text-muted">{t('demo.cliente.devisAVenir')}</p>
          )}

          <button
            onClick={onCommander}
            className="mt-4 w-full rounded-full bg-teal px-4 py-3 text-body text-white transition active:scale-[0.98]"
          >
            {t('demo.cliente.commander')}
          </button>
          <p className="mt-2 text-center text-caption text-muted">{t('demo.cliente.cod')}</p>
        </div>
      )}

      <button onClick={onRetour} className="mt-4 text-caption text-muted underline">
        {t('demo.changerBoutique')}
      </button>
    </section>
  );
}

/* ---------------------------- 3. vendeuse ---------------------------- */

function CoteVendeuse({
  t, language, boutique, deviseBoutique, devisePerso, panier, totalFcfa,
  statut, onStatut, onSuite,
}) {
  const suivant = { recue: 'acceptee', acceptee: 'livree' }[statut];

  return (
    <section className="mt-5">
      <EnTeteRole
        role={t('demo.vendeuse.role', { boutique: boutique.nom })}
        explication={t('demo.vendeuse.explication', { devise: deviseBoutique })}
      />

      {/* Le point que Beau fait répéter depuis des semaines, montré plutôt
          qu'expliqué: la MÊME commande, deux montants, deux monnaies. */}
      {deviseBoutique !== devisePerso && (
        <p className="mt-3 rounded-2xl bg-teal-light px-4 py-3 text-caption text-ink">
          {t('demo.vendeuse.deuxDevises', {
            devisePerso,
            deviseBoutique,
          })}
        </p>
      )}

      <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-section text-ink">{t('demo.vendeuse.commande')}</h3>
          <span className="rounded-full bg-teal-light px-3 py-1 text-caption text-teal">
            {t(`demo.statut.${statut}`)}
          </span>
        </div>

        <ul className="mt-3 divide-y divide-black/5">
          {panier.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-2">
              <span className="text-body text-ink">
                {l.nom} × {l.qte}
              </span>
              <span className="text-body text-ink">
                {l.surDemande
                  ? t('demo.surDemande')
                  : formatPrice(l.prixFcfa * l.qte, deviseBoutique, language)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-3 flex items-center justify-between text-body text-ink">
          <span>{t('demo.vendeuse.aEncaisser')}</span>
          <span className="text-section">
            {formatPrice(totalFcfa, deviseBoutique, language)}
          </span>
        </p>

        {suivant ? (
          <button
            onClick={() => onStatut(suivant)}
            className="mt-4 w-full rounded-full bg-teal px-4 py-3 text-body text-white transition active:scale-[0.98]"
          >
            {t(`demo.vendeuse.action.${suivant}`)}
          </button>
        ) : (
          <button
            onClick={onSuite}
            className="mt-4 w-full rounded-full bg-ink px-4 py-3 text-body text-white transition active:scale-[0.98]"
          >
            {t('demo.vendeuse.voirCompta')}
          </button>
        )}
      </div>
    </section>
  );
}

/* ----------------------------- 4. compta ----------------------------- */

function CoteCompta({ t, language, boutique, deviseBoutique, totalFcfa, onRecommencer }) {
  const ecritures = ecrituresDeLaVente(totalFcfa);
  const marge = totalFcfa - Math.round(totalFcfa * PART_COUT);

  return (
    <section className="mt-5">
      <EnTeteRole
        role={t('demo.compta.role')}
        explication={t('demo.compta.explication')}
      />

      <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white">
        <table className="w-full text-left">
          <thead className="bg-black/[0.03]">
            <tr>
              <th className="px-4 py-2 text-caption font-normal text-muted">{t('demo.compta.compte')}</th>
              <th className="px-4 py-2 text-right text-caption font-normal text-muted">{t('demo.compta.debit')}</th>
              <th className="px-4 py-2 text-right text-caption font-normal text-muted">{t('demo.compta.credit')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {ecritures.map((e, i) => (
              <tr key={i}>
                <td className="px-4 py-2 text-body text-ink">{e.libelle}</td>
                <td className="px-4 py-2 text-right text-body text-ink">
                  {e.sens === 'debit' ? formatPrice(e.montantFcfa, deviseBoutique, language) : ''}
                </td>
                <td className="px-4 py-2 text-right text-body text-ink">
                  {e.sens === 'credit' ? formatPrice(e.montantFcfa, deviseBoutique, language) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-caption text-muted">{t('demo.compta.hypothese')}</p>

      <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
        <p className="flex items-center justify-between text-body text-ink">
          <span>{t('demo.compta.marge')}</span>
          <span className="text-section text-teal">
            {formatPrice(marge, deviseBoutique, language)}
          </span>
        </p>
        <p className="mt-2 text-caption text-muted">{t('demo.compta.stockAussi')}</p>
      </div>

      <a
        href={lienAccounting(boutique)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 block w-full rounded-full bg-teal px-4 py-3 text-center text-body text-white transition active:scale-[0.98]"
      >
        {t('demo.compta.ouvrirAccounting')}
      </a>
      <p className="mt-2 text-center text-caption text-muted">{t('demo.compta.rapports')}</p>

      <button onClick={onRecommencer} className="mt-5 text-caption text-muted underline">
        {t('demo.recommencer')}
      </button>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function EnTeteRole({ role, explication }) {
  return (
    <div>
      <h2 className="text-title text-ink">{role}</h2>
      <p className="mt-1 text-body text-muted">{explication}</p>
    </div>
  );
}
