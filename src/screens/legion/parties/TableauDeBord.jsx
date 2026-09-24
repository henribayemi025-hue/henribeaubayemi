import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconChartBar, IconHeartbeat, IconTrophy, IconFlame, IconInfoCircle } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { Visage } from './Visage';

// LEGION — le tableau de bord (idées 2, 8, 21, 42, 54, 60, 66, 71, 73 et 115
// des 200, Beau le 23/09 : « fais tout »).
//
// Tout ce qui s'affiche ici est COMPTÉ par la base (legion_tableau_de_bord,
// 0184) : aucun score inventé, aucune « productivité » calculée par un
// modèle. La santé d'un agent suit une règle écrite ci-dessous et affichée
// telle quelle à l'écran ; un badge se gagne à un seuil mesuré ; un trophée
// est une étape de la feuille de route que le fondateur a cochée. Le coût
// par agent se note sur chaque message depuis le 24/09 (meta.cout_eur) :
// avant, seul le total de l'entreprise était connu.

const JOUR = 86_400_000;

// La règle de santé, dans l'ordre. Chaque raison est un fait mesuré.
function santeDe(x, t) {
  if (!x.actif) return { cle: 'veille', raisons: [] };
  const raisons = [];
  const silence = !x.derniere || Date.now() - Date.parse(x.derniere) > 3 * JOUR;
  const budget = x.plafond_mois_eur != null ? Number(x.cout_mois_eur) / Number(x.plafond_mois_eur) : 0;
  if (x.ouvertes > 0 && silence) raisons.push(t('legion.tdb.r.silence'));
  if (x.bloquees >= 2) raisons.push(t('legion.tdb.r.bloquees', { n: x.bloquees }));
  if (budget >= 1) raisons.push(t('legion.tdb.r.budgetAtteint'));
  if (raisons.length) return { cle: 'difficulte', raisons };
  if (x.bloquees === 1) raisons.push(t('legion.tdb.r.bloquee'));
  if (x.revue_longue > 0) raisons.push(t('legion.tdb.r.revueLongue', { n: x.revue_longue }));
  if (x.immobiles > 0) raisons.push(t('legion.tdb.r.immobiles', { n: x.immobiles }));
  if (x.renvoyees > 0 && x.renvoyees > x.validees) raisons.push(t('legion.tdb.r.renvois'));
  if (x.relues >= 3 && x.corrigees / x.relues >= 0.5) raisons.push(t('legion.tdb.r.corrections', { c: x.corrigees, r: x.relues }));
  if (budget >= 0.8) raisons.push(t('legion.tdb.r.budgetProche', { p: Math.round(budget * 100) }));
  return { cle: raisons.length ? 'surveiller' : 'forme', raisons };
}

const COULEUR_SANTE = { forme: 'text-legion-success', surveiller: 'text-legion-gold', difficulte: 'text-legion-danger', veille: 'text-legion-muted' };
const FOND_SANTE = { forme: 'bg-legion-success', surveiller: 'bg-legion-gold', difficulte: 'bg-legion-danger', veille: 'bg-legion-line' };

// Les badges : un seuil mesuré chacun, écrit dans son infobulle.
const BADGES = [
  { cle: 'premierLivrable', emoji: '📦', gagne: (x) => x.livrables_total >= 1 },
  { cle: 'dixLivrables', emoji: '🏗️', gagne: (x) => x.livrables_total >= 10 },
  { cle: 'cinqValides', emoji: '✅', gagne: (x) => x.validees_total >= 5 },
  { cle: 'sansFaute', emoji: '🎯', gagne: (x) => x.relues >= 10 && x.corrigees === 0 },
  { cle: 'debloqueur', emoji: '🔓', gagne: (x) => x.debloques >= 1 },
  { cle: 'relais', emoji: '🤝', gagne: (x) => x.relais_total >= 1 },
  { cle: 'assidu', emoji: '📅', gagne: (x) => x.jours_actifs >= 5 },
];

function euros(n, langue) {
  const v = Number(n || 0);
  if (v > 0 && v < 0.005) return langue === 'en' ? 'under €0.01' : 'moins de 0,01 €';
  return `${v.toLocaleString(langue === 'en' ? 'en-GB' : 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function TableauDeBord({ entreprise, agents, onFiche, t, langue = 'fr' }) {
  const [jours, setJours] = useState(30);
  const [d, setD] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [aide, setAide] = useState(false);

  const charger = useCallback(async () => {
    const { data, error } = await supabase.rpc('legion_tableau_de_bord', { p_entreprise: entreprise.id, p_jours: jours });
    if (error) { setErreur(true); return; }
    setErreur(false);
    setD(data || null);
  }, [entreprise.id, jours]);
  useEffect(() => { charger(); }, [charger]);

  const lignes = useMemo(() => (d?.agents || []).map((x) => ({ ...x, sante: santeDe(x, t), agent: agents.find((a) => a.id === x.id) })), [d, agents, t]);

  // La carte d'activité : départements × jours (14 au plus, pour tenir sur
  // un téléphone). Une case = les messages des agents ce jour-là.
  const carte = useMemo(() => {
    if (!d) return null;
    const n = Math.min(14, d.jours || 14);
    const jourss = Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * JOUR).toISOString().slice(0, 10));
    const depts = [...new Set([...(d.agents || []).map((x) => x.departement || '?')])];
    const val = {};
    let max = 0;
    for (const c of d.activite || []) { const k = `${c.departement}|${c.jour}`; val[k] = c.n; if (jourss.includes(c.jour)) max = Math.max(max, c.n); }
    return { jours: jourss, depts, val, max };
  }, [d]);

  if (erreur) return null;
  if (!d) return null;

  const actifs = lignes.filter((x) => x.actif);
  const compte = { forme: 0, surveiller: 0, difficulte: 0 };
  for (const x of actifs) compte[x.sante.cle] += 1;
  const ouvertesTotal = lignes.reduce((s, x) => s + x.ouvertes, 0);
  const chargeMax = Math.max(1, ...lignes.map((x) => x.ouvertes));
  const reputation = (x) => (x.validees + x.renvoyees > 0 ? Math.round((x.validees / (x.validees + x.renvoyees)) * 100) : null);
  const dateCourte = (iso) => new Date(iso).toLocaleDateString(langue === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short' });

  async function fixerBudget(x, texte) {
    const v = String(texte).trim() === '' ? null : Math.max(0, Number(String(texte).replace(',', '.')));
    if (v !== null && Number.isNaN(v)) return;
    if ((x.plafond_mois_eur ?? null) === v) return;
    const { error } = await supabase.from('legion_agents').update({ plafond_mois_eur: v }).eq('id', x.id);
    if (!error) charger();
  }

  return (
    <section className="space-y-5 rounded-2xl border border-legion-line bg-legion-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-legion-line pb-3">
        <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink">
          <IconChartBar size={15} className="text-legion-gold" /> {t('legion.tdb.titre')}
        </h3>
        <div className="flex items-center gap-1.5">
          {[7, 30].map((n) => (
            <button key={n} type="button" onClick={() => setJours(n)}
              className={`rounded-pill px-2.5 py-1 text-[12px] font-semibold ${jours === n ? 'bg-legion-gold text-legion-bg' : 'border border-legion-line text-legion-muted hover:text-legion-ink'}`}>
              {t('legion.tdb.jours', { n })}
            </button>
          ))}
          <button type="button" onClick={() => setAide((v) => !v)} aria-label={t('legion.tdb.commentCalcule')} title={t('legion.tdb.commentCalcule')}
            className={`rounded-full p-1.5 ${aide ? 'text-legion-gold' : 'text-legion-muted hover:text-legion-ink'}`}>
            <IconInfoCircle size={16} />
          </button>
        </div>
      </div>

      {aide && (
        <div className="space-y-1 rounded-card border border-legion-line bg-legion-card p-3 text-[12px] leading-relaxed text-legion-muted">
          <p>{t('legion.tdb.aideCompte')}</p>
          <p><b className="text-legion-danger">{t('legion.tdb.sante.difficulte')}</b> — {t('legion.tdb.aideDifficulte')}</p>
          <p><b className="text-legion-gold">{t('legion.tdb.sante.surveiller')}</b> — {t('legion.tdb.aideSurveiller')}</p>
          <p><b className="text-legion-success">{t('legion.tdb.sante.forme')}</b> — {t('legion.tdb.aideForme')}</p>
          <p>{t('legion.tdb.aideReputation')}</p>
          <p>{t('legion.tdb.aideCout')}</p>
        </div>
      )}

      {/* La santé de l'équipe (66) et la charge (73) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-card border border-legion-line bg-legion-card p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-legion-muted"><IconHeartbeat size={13} /> {t('legion.tdb.santeEquipe')}</p>
          {actifs.length === 0 ? (
            <p className="text-[12px] text-legion-muted">{t('legion.tdb.personneAllume')}</p>
          ) : (
            <>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-legion-bg">
                {['forme', 'surveiller', 'difficulte'].map((k) => compte[k] > 0 && (
                  <div key={k} className={FOND_SANTE[k]} style={{ width: `${(compte[k] / actifs.length) * 100}%` }} />
                ))}
              </div>
              <p className="mt-2 text-[12px] text-legion-ink">
                {['forme', 'surveiller', 'difficulte'].filter((k) => compte[k] > 0).map((k) => (
                  <span key={k} className={`mr-3 ${COULEUR_SANTE[k]}`}>{compte[k]} {t(`legion.tdb.sante.${k}`).toLowerCase()}</span>
                ))}
              </p>
            </>
          )}
        </div>
        <div className="rounded-card border border-legion-line bg-legion-card p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-legion-muted"><IconFlame size={13} /> {t('legion.tdb.charge')}</p>
          <p className="text-2xl font-bold text-legion-ink">{ouvertesTotal} <span className="text-caption font-normal text-legion-muted">{t('legion.tdb.tachesOuvertes')}</span></p>
          <p className="text-[12px] text-legion-muted">
            {actifs.length ? t('legion.tdb.parAgent', { n: (ouvertesTotal / actifs.length).toLocaleString(langue === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 }) }) : ''}
            {d.plafond_eur != null ? ` · ${t('legion.tdb.plafondMois', { depense: euros(d.mois_eur, langue), plafond: euros(d.plafond_eur, langue) })}` : ` · ${t('legion.tdb.depenseMois', { depense: euros(d.mois_eur, langue) })}`}
          </p>
        </div>
      </div>

      {/* La carte d'activité par département (60) */}
      {carte && carte.depts.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.tdb.carte', { n: carte.jours.length })}</p>
          <div className="overflow-x-auto">
            <table className="border-separate" style={{ borderSpacing: 3 }}>
              <tbody>
                {carte.depts.map((dep) => (
                  <tr key={dep}>
                    <td className="max-w-[92px] truncate pr-2 text-[11px] text-legion-muted">{dep}</td>
                    {carte.jours.map((j) => {
                      const n = carte.val[`${dep}|${j}`] || 0;
                      const a = n && carte.max ? 0.2 + 0.8 * (n / carte.max) : 0;
                      return (
                        <td key={j} title={`${dep} — ${dateCourte(j)} : ${t('legion.tdb.messages', { count: n })}`}
                          className="h-5 w-5 rounded-[4px] border border-legion-line"
                          style={{ backgroundColor: n ? `rgba(227,168,87,${a.toFixed(2)})` : 'transparent' }} />
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td />
                  {carte.jours.map((j, i) => (
                    <td key={j} className="text-center text-[9px] text-legion-muted">{i % 3 === 0 || i === carte.jours.length - 1 ? new Date(j).getDate() : ''}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chaque agent (21, 42, 115, 2, 8) — toucher une carte ouvre sa fiche (54) */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.tdb.parAgentTitre', { n: d.jours })}</p>
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {lignes.map((x) => {
            const rep = reputation(x);
            const badges = BADGES.filter((b) => b.gagne(x));
            return (
              <li key={x.id} className="space-y-2 rounded-card border border-legion-line bg-legion-card p-3">
                <div className="flex items-start gap-2.5">
                  <button type="button" onClick={() => x.agent && onFiche?.(x.agent)} className="shrink-0">
                    {x.agent ? <Visage a={x.agent} taille={34} point={false} /> : <span className="block h-[34px] w-[34px] rounded-full bg-legion-line" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => x.agent && onFiche?.(x.agent)} className="block max-w-full truncate text-left text-[14px] font-semibold text-legion-ink hover:underline">{x.nom}</button>
                    <p className="truncate text-[11px] text-legion-muted">{x.departement || '—'}{x.fin_mission ? ` · ${t('legion.tdb.jusquAu', { date: dateCourte(x.fin_mission) })}` : ''}</p>
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold ${COULEUR_SANTE[x.sante.cle]}`}>● {t(`legion.tdb.sante.${x.sante.cle}`)}</span>
                </div>
                {x.sante.raisons.length > 0 && (
                  <ul className="space-y-0.5 text-[11px] text-legion-muted">
                    {x.sante.raisons.map((r) => <li key={r}>– {r}</li>)}
                  </ul>
                )}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <Chiffre n={x.reponses + x.reunions} libelle={t('legion.tdb.prisesDeParole')} />
                  <Chiffre n={x.livrables} libelle={t('legion.tdb.livrables')} />
                  <Chiffre n={x.taches_faites} libelle={t('legion.tdb.faites')} />
                </div>
                {/* Sa charge : ses tâches ouvertes, rapportées à la plus chargée */}
                <div>
                  <div className="flex justify-between text-[11px] text-legion-muted">
                    <span>{t('legion.tdb.ouvertes', { n: x.ouvertes })}{x.bloquees ? ` · ${t('legion.tdb.dontBloquees', { n: x.bloquees })}` : ''}{x.en_revue ? ` · ${t('legion.tdb.aValider', { n: x.en_revue })}` : ''}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-legion-bg">
                    <div className={`h-full rounded-full ${x.bloquees ? 'bg-legion-danger' : 'bg-legion-teal'}`} style={{ width: `${(x.ouvertes / chargeMax) * 100}%` }} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-legion-muted">
                  <span>{t('legion.tdb.relecture', { relues: x.relues, corrigees: x.corrigees })}</span>
                  <span>{rep == null ? t('legion.tdb.reputationVide') : t('legion.tdb.reputation', { p: rep, v: x.validees, r: x.renvoyees })}</span>
                </div>
                {/* Ce qu'il coûte, et son budget du mois (115) */}
                <div className="flex flex-wrap items-center gap-2 border-t border-legion-line pt-2 text-[11px]">
                  <span className="text-legion-muted">{t('legion.tdb.cout')}</span>
                  <span className="font-semibold text-legion-ink" title={t('legion.tdb.aideCout')}>{Number(x.cout_mois_eur) > 0 ? euros(x.cout_mois_eur, langue) : '—'}</span>
                  <span className="text-legion-muted">{t('legion.tdb.ceMois')}</span>
                  <label className="ml-auto flex items-center gap-1 text-legion-muted">
                    {t('legion.tdb.budget')}
                    <input key={`${x.id}-${x.plafond_mois_eur ?? ''}`} inputMode="decimal" defaultValue={x.plafond_mois_eur ?? ''} placeholder={t('legion.sansPlafond', 'aucun')}
                      onBlur={(e) => fixerBudget(x, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      className="w-20 rounded-input border border-legion-line bg-legion-bg px-1.5 py-1 text-right text-[16px] text-legion-ink outline-none focus:border-legion-gold/60 sm:w-16 sm:text-[12px]" />
                    €
                  </label>
                </div>
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {badges.map((b) => (
                      <span key={b.cle} title={t(`legion.tdb.badge.${b.cle}.regle`)} className="rounded-pill border border-legion-gold/30 bg-legion-gold/10 px-2 py-0.5 text-[11px] text-legion-gold-soft">
                        {b.emoji} {t(`legion.tdb.badge.${b.cle}.nom`)}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Les trophées : les étapes de la feuille de route franchies (71) */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-legion-muted"><IconTrophy size={13} /> {t('legion.tdb.trophees')}</p>
        {(d.etapes || []).length === 0 ? (
          <p className="text-[12px] text-legion-muted">{d.etapes_total ? t('legion.tdb.aucuneEtape', { n: d.etapes_total }) : t('legion.tdb.pasDeFeuille')}</p>
        ) : (
          <ul className="space-y-1">
            {d.etapes.slice(0, 8).map((e, i) => (
              <li key={i} className="flex items-center gap-2 text-[12px] text-legion-ink">
                <span>🏆</span><span className="min-w-0 flex-1 truncate">{e.titre}</span>
                {e.fait_le && <span className="shrink-0 text-[11px] text-legion-muted">{dateCourte(e.fait_le)}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Chiffre({ n, libelle }) {
  return (
    <div className="rounded-input bg-legion-bg px-1 py-1.5">
      <div className="text-[16px] font-bold leading-tight text-legion-ink">{n}</div>
      <div className="truncate text-[10px] text-legion-muted">{libelle}</div>
    </div>
  );
}
