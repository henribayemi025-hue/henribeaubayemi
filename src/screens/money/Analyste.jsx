import { IconChartBar, IconAlertTriangle } from '@tabler/icons-react';
import { EmptyState } from '../../components/states';

// Analyste — l'onglet qui lit le budget au lieu de le saisir.
//
// Il ne montre QUE ce qui est en base. Aucun chiffre d'exemple, aucune
// projection: s'il n'y a pas de ligne, il n'y a rien à dire, et on le dit.
//
// ⚠️ AUCUNE CONVERSION DE MONNAIE ICI — même règle que dans MyMoney.jsx.
// Ces montants ont été TAPÉS par la personne elle-même, dans la monnaie de
// son choix. On les réaffiche tels qu'ils ont été saisis, sans symbole
// ajouté: mélanger des euros et des FCFA dans un même total serait déjà
// faux, les convertir le serait deux fois.

// Les centimes comptent — un compte à 0,16 s'affichait « 0 ».
import { montant } from './montant';

function moisCourant() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function moisVoisin(p, pas) {
  const [a, m] = p.split('-').map(Number);
  const d = new Date(a, m - 1 + pas, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nomMois(p, lang, opts) {
  return new Date(`${p}-01T00:00:00`).toLocaleDateString(lang, opts);
}

// Une ligne appartient au mois de son `period`, jamais à celui de son
// `created_at`: on saisit en octobre le loyer de novembre, et une ligne
// reprise du mois dernier est créée aujourd'hui pour un mois à venir.
// Les toutes premières lignes n'avaient pas de `period`; on les rattache au
// mois courant, comme le fait déjà l'onglet Budget.
const periodeDe = (l) => l.period || moisCourant();

const estEntree = (l) => l.kind === 'income';

const somme = (liste, champ) => liste.reduce((s, l) => s + (Number(l[champ]) || 0), 0);

export default function Analyste({ devise = '', lignes, comptes, epargne, lang, t }) {
  const toutes = Array.isArray(lignes) ? lignes : [];
  const lesComptes = Array.isArray(comptes) ? comptes : [];
  const lEpargne = Array.isArray(epargne) ? epargne : [];

  if (toutes.length === 0) return <EmptyState icon={IconChartBar} title={t('money.anNothing')} />;

  const mois = moisCourant();
  const avant = moisVoisin(mois, -1);
  const du = (p) => toutes.filter((l) => periodeDe(l) === p);

  const bilan = (p) => {
    const l = du(p);
    const entre = somme(l.filter(estEntree), 'actual');
    const sorti = somme(l.filter((x) => !estEntree(x)), 'actual');
    return { lignes: l, entre, sorti, reste: entre - sorti };
  };

  const ce = bilan(mois);
  const precedent = bilan(avant);
  const compare = precedent.lignes.length > 0;

  /* ---------------------- où part l'argent (ce mois) --------------------- */

  const parCategorie = new Map();
  ce.lignes.filter((l) => !estEntree(l)).forEach((l) => {
    const cle = (l.category || '').trim() || t('money.category');
    const p = parCategorie.get(cle) || { categorie: cle, reel: 0, prevu: 0 };
    p.reel += Number(l.actual) || 0;
    p.prevu += Number(l.planned) || 0;
    parCategorie.set(cle, p);
  });
  const categories = [...parCategorie.values()]
    .filter((c) => c.reel > 0)
    .sort((a, b) => b.reel - a.reel);
  const totalSorti = categories.reduce((s, c) => s + c.reel, 0);

  /* -------------------------- prévu contre réel -------------------------- */

  const prevuSorti = somme(ce.lignes.filter((l) => !estEntree(l)), 'planned');
  const prevuEntre = somme(ce.lignes.filter(estEntree), 'planned');
  const aDuPrevu = prevuSorti > 0 || prevuEntre > 0;
  // Un dépassement n'a de sens que face à un prévu réellement saisi: une
  // catégorie laissée à 0 n'est pas « dépassée », elle n'a pas été prévue.
  const depassements = [...parCategorie.values()]
    .filter((c) => c.prevu > 0 && c.reel > c.prevu)
    .sort((a, b) => (b.reel - b.prevu) - (a.reel - a.prevu));

  /* ------------------------ les six derniers mois ------------------------ */

  const serie = [];
  for (let i = 5; i >= 0; i -= 1) {
    const p = moisVoisin(mois, -i);
    const b = bilan(p);
    serie.push({ periode: p, entre: b.entre, sorti: b.sorti });
  }
  const plafond = Math.max(...serie.map((s) => Math.max(s.entre, s.sorti)), 0);
  // Une barre non nulle reste visible même minuscule; une barre nulle reste nulle.
  const hauteur = (v) => (plafond > 0 && v > 0 ? Math.max(2, Math.round((v / plafond) * 100)) : 0);

  /* ---------------------------- vue d'ensemble --------------------------- */

  const surComptes = lesComptes.reduce((s, c) => s + (Number(c.solde) || 0), 0);
  const misDeCote = lEpargne.reduce((s, o) => s + (Number(o.saved) || 0), 0);
  const montrerEnsemble = lesComptes.length > 0 || lEpargne.length > 0;

  return (
    <div className="space-y-4">
      {montrerEnsemble && (
        <div className="grid grid-cols-2 gap-3">
          {lesComptes.length > 0 && (
            <div className="rounded-card border border-money-line p-3">
              <p className="text-caption text-money-muted">{t('money.anOnAccounts')}</p>
              <p className={`text-section ${surComptes < 0 ? 'text-money-danger' : 'text-money-ink'}`}>
                {montant(surComptes, lang, devise)}
              </p>
            </div>
          )}
          {lEpargne.length > 0 && (
            <div className="rounded-card border border-money-line p-3">
              <p className="text-caption text-money-muted">{t('money.anSetAside')}</p>
              <p className="text-section text-money-ink">{montant(misDeCote, lang, devise)}</p>
            </div>
          )}
        </div>
      )}

      {/* 1 — le mois en cours, et ce qui a changé depuis le mois dernier */}
      <section className="rounded-card border border-money-line p-3">
        <p className="text-caption text-money-muted">
          {nomMois(mois, lang, { month: 'long', year: 'numeric' })}
        </p>
        <p className={`text-title ${ce.reste < 0 ? 'text-money-danger' : 'text-money-accent'}`}>
          {montant(ce.reste, lang, devise)}
        </p>
        <p className="text-caption text-money-muted">{t('money.remaining')}</p>
        {compare && (
          <p className="mt-1 text-caption text-money-muted">
            {t('money.prevMonth')} {montant(precedent.reste, lang, devise)}{' '}
            <Ecart devise={devise} valeur={ce.reste - precedent.reste} bonSiPositif lang={lang} />
          </p>
        )}

        <div className="mt-3 space-y-2 border-t border-money-line pt-3">
          <Ligne devise={devise}
            libelle={t('money.income')}
            valeur={ce.entre}
            avant={compare ? precedent.entre : null}
            bonSiPositif
            lang={lang}
            t={t}
          />
          <Ligne devise={devise}
            libelle={t('money.spent')}
            valeur={ce.sorti}
            avant={compare ? precedent.sorti : null}
            bonSiPositif={false}
            lang={lang}
            t={t}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 2 — où part l'argent */}
        <section className="rounded-card border border-money-line p-3">
          <h3 className="text-section text-money-ink">{t('money.anWhereItGoes')}</h3>
          {categories.length === 0 ? (
            <p className="mt-2 text-caption text-money-muted">{t('money.anNoExpense')}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {categories.map((c) => {
                const pct = totalSorti > 0 ? Math.round((c.reel / totalSorti) * 100) : 0;
                return (
                  <li key={c.categorie}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate text-body text-money-ink">{c.categorie}</p>
                      <span className="shrink-0 text-body text-money-ink">{montant(c.reel, lang, devise)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-pill bg-money-accent/10">
                        <div className="h-full rounded-pill bg-money-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="shrink-0 text-caption text-money-muted">{pct} %</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 3 — prévu contre réel */}
        <section className="rounded-card border border-money-line p-3">
          <h3 className="text-section text-money-ink">{t('money.anPlannedVsActual')}</h3>
          {!aDuPrevu ? (
            <p className="mt-2 text-caption text-money-muted">{t('money.anNoPlanned')}</p>
          ) : (
            <>
              <div className="mt-3 space-y-2">
                <Confrontation devise={devise}
                  libelle={t('money.spent')}
                  prevu={prevuSorti}
                  reel={ce.sorti}
                  bonSiSousLePrevu
                  lang={lang}
                  t={t}
                />
                <Confrontation devise={devise}
                  libelle={t('money.income')}
                  prevu={prevuEntre}
                  reel={ce.entre}
                  bonSiSousLePrevu={false}
                  lang={lang}
                  t={t}
                />
              </div>

              <div className="mt-3 border-t border-money-line pt-3">
                <p className="text-caption text-money-muted">{t('money.anOverBudget')}</p>
                {depassements.length === 0 ? (
                  <p className="mt-1 text-caption text-money-muted">{t('money.anNoOverBudget')}</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {depassements.map((c) => (
                      <li key={c.categorie} className="flex items-baseline justify-between gap-3">
                        <p className="flex min-w-0 items-baseline gap-1 text-body text-money-ink">
                          <IconAlertTriangle size={15} className="shrink-0 self-center text-money-danger" />
                          <span className="truncate">{c.categorie}</span>
                        </p>
                        <span className="shrink-0 text-caption text-money-muted">
                          {montant(c.reel, lang, devise)} / {montant(c.prevu, lang, devise)}{' '}
                          <span className="text-money-danger">+{montant(c.reel - c.prevu, lang, devise)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* 4 — les six derniers mois */}
      <section className="rounded-card border border-money-line p-3">
        <h3 className="text-section text-money-ink">{t('money.anSixMonths')}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-money-muted">
          <span className="flex items-center gap-1">
            <span className="h-2 w-4 rounded-pill bg-money-accent" aria-hidden="true" /> {t('money.income')}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-4 rounded-pill bg-money-accent/30" aria-hidden="true" /> {t('money.spent')}
          </span>
        </div>

        <div className="mt-3 flex items-end gap-1">
          {serie.map((s) => (
            <div
              key={s.periode}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
              title={`${nomMois(s.periode, lang, { month: 'long', year: 'numeric' })} — ${t('money.income')} ${montant(s.entre, lang, devise)} · ${t('money.spent')} ${montant(s.sorti, lang, devise)}`}
            >
              <div className="flex h-24 w-full items-end justify-center gap-1" aria-hidden="true">
                <div
                  className="w-1/3 max-w-[18px] rounded-pill bg-money-accent"
                  style={{ height: `${hauteur(s.entre)}%` }}
                />
                <div
                  className="w-1/3 max-w-[18px] rounded-pill bg-money-accent/30"
                  style={{ height: `${hauteur(s.sorti)}%` }}
                />
              </div>
              <span className="w-full truncate border-t border-money-line pt-1 text-center text-caption text-money-muted">
                {nomMois(s.periode, lang, { month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------------- */

// Une ligne « ce mois-ci vs le mois dernier ».
function Ligne({ devise, libelle, valeur, avant, bonSiPositif, lang, t }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="min-w-0 truncate text-body text-money-ink">{libelle}</p>
      <div className="shrink-0 text-right">
        <span className="text-body text-money-ink">{montant(valeur, lang, devise)}</span>
        {avant !== null && (
          <p className="text-caption text-money-muted">
            {t('money.prevMonth')} {montant(avant, lang, devise)}{' '}
            <Ecart devise={devise} valeur={valeur - avant} bonSiPositif={bonSiPositif} lang={lang} />
          </p>
        )}
      </div>
    </div>
  );
}

// L'écart, signé et coloré selon le sens: dépenser plus n'est pas la même
// nouvelle que gagner plus.
function Ecart({ devise, valeur, bonSiPositif, lang }) {
  if (valeur === 0) return <span className="text-money-muted">=</span>;
  const bon = valeur > 0 ? bonSiPositif : !bonSiPositif;
  return (
    <span className={bon ? 'text-money-accent' : 'text-money-danger'}>
      {valeur > 0 ? '+' : '−'}
      {montant(Math.abs(valeur), lang, devise)}
    </span>
  );
}

// Prévu face à réel, pour un type de ligne.
function Confrontation({ devise, libelle, prevu, reel, bonSiSousLePrevu, lang, t }) {
  const ecart = reel - prevu;
  const bon = ecart === 0 ? true : ecart < 0 ? bonSiSousLePrevu : !bonSiSousLePrevu;
  const pct = prevu > 0 ? Math.min(100, Math.round((reel / prevu) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-body text-money-ink">{libelle}</p>
        <span className="shrink-0 text-caption text-money-muted">
          {t('money.plannedShort')} {montant(prevu, lang, devise)} · {montant(reel, lang, devise)}{' '}
          <span className={ecart === 0 ? 'text-money-muted' : bon ? 'text-money-accent' : 'text-money-danger'}>
            {ecart === 0 ? '=' : `${ecart > 0 ? '+' : '−'}${montant(Math.abs(ecart), lang, devise)}`}
          </span>
        </span>
      </div>
      {prevu > 0 && (
        <div className="mt-1 h-2 w-full overflow-hidden rounded-pill bg-money-accent/10">
          <div className="h-full rounded-pill bg-money-accent" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
