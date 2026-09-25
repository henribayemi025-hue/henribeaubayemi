import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Immeuble } from './Immeuble';
import { tours as calculerTours, joursRestants, QUOTIDIEN } from './ville';

// LA VILLE DE LÉO (proposition du 25/09 à Beau, d'après ses prototypes Google
// AI Studio) : chaque projet est une tour datée qui pousse avec les tâches
// rendues ; l'échafaudage montre ce qui reste ; la grue part quand c'est
// fini ; une fenêtre allumée = un agent qui a pris une tâche il y a moins de
// 10 minutes. On entre dans une tour : c'est l'immeuble, avec seulement les
// tâches de ce projet. Rien d'inventé : pas de chiffre décoratif.

const LARG = 900, SOL = 330, H = 420;

function Tour({ t, x, largeur, choisie, onChoisir, tr, pas }) {
  const hFaite = 26 + Math.min(34, t.rendues) * pas;
  const hReste = Math.min(26, t.restantes) * pas;
  const haut = SOL - hFaite, cime = haut - hReste;
  const quotidien = t.id === QUOTIDIEN;
  const cols = Math.max(2, Math.floor((largeur - 14) / 13)), rangs = Math.max(1, Math.floor((hFaite - 18) / 15));
  // Autant de fenêtres allumées que d'agents au travail, à des places fixes.
  const allumees = new Set();
  for (let k = 0, graine = t.id.length * 7 + 3; allumees.size < Math.min(t.agentsAuTravail, cols * rangs) && k < 500; k += 1) {
    graine = (graine * 9301 + 49297) % 233280;
    allumees.add(graine % (cols * rangs));
  }
  const nom = quotidien ? tr('legion.ville.quotidien') : t.projet.nom;
  const dates = quotidien ? tr('legion.ville.sansProjet') : `${t.projet.debut?.slice(5).split('-').reverse().join('/')} → ${t.projet.fin?.slice(5).split('-').reverse().join('/')}`;
  return (
    <g role="button" tabIndex={0} aria-label={`${nom} : ${t.rendues}/${t.total}`} className="cursor-pointer focus:outline-none"
      onClick={onChoisir} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChoisir(); } }}>
      <rect x={x} y={haut} width={largeur} height={hFaite} rx="2" fill={quotidien ? '#1C2436' : 'url(#ville-verre)'} stroke={choisie ? '#F2C98A' : '#34446E'} strokeWidth={choisie ? 2 : 1} />
      {Array.from({ length: cols * rangs }).map((_, i) => {
        const on = allumees.has(i);
        return <rect key={i} x={x + 7 + (i % cols) * 13} y={haut + 10 + Math.floor(i / cols) * 15} width="7" height="8" rx="1"
          fill={on ? '#F2C98A' : '#2B3960'} className={on ? 'ville-scintille' : undefined} />;
      })}
      {hReste > 0 && (
        <g stroke="#E3A857" strokeOpacity=".6">
          {Array.from({ length: Math.floor(hReste / 14) + 1 }).map((_, i) => <line key={i} x1={x} y1={haut - i * 14} x2={x + largeur} y2={haut - i * 14} />)}
          <rect x={x} y={cime} width={largeur} height={hReste} fill="none" strokeDasharray="3 3" />
          <line x1={x + largeur * 0.2} y1={cime} x2={x + largeur * 0.2} y2={haut} />
          <line x1={x + largeur * 0.8} y1={cime} x2={x + largeur * 0.8} y2={haut} />
        </g>
      )}
      {!quotidien && !t.termine && (
        <g stroke="#C25E38" strokeWidth="2.5">
          <line x1={x + largeur * 0.7} y1={cime} x2={x + largeur * 0.7} y2={cime - 40} />
          <g className="ville-grue"><line x1={x + largeur * 0.7} y1={cime - 38} x2={x + largeur * 0.7 + 50} y2={cime - 38} />
            <line x1={x + largeur * 0.7 + 42} y1={cime - 38} x2={x + largeur * 0.7 + 42} y2={cime - 20} strokeWidth="1" /></g>
        </g>
      )}
      {!quotidien && t.termine && <path d={`M${x + 4} ${haut} L${x + largeur / 2} ${haut - 20} L${x + largeur - 4} ${haut} Z`} fill="#E3A857" />}
      <text x={x + largeur / 2} y={SOL + 18} textAnchor="middle" fontSize="12" fontWeight="600" fill="#EDF1F8">{nom.length > 22 ? `${nom.slice(0, 21)}…` : nom}</text>
      <text x={x + largeur / 2} y={SOL + 33} textAnchor="middle" fontSize="10.5" fill="#93A1B8" fontFamily="ui-monospace, monospace">{dates} · {t.rendues}/{t.total}</text>
      {t.enRetard && <text x={x + largeur / 2} y={SOL + 48} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#FB7185">{tr('legion.ville.enRetard')}</text>}
    </g>
  );
}

export function Ville({ entreprise, agents, departements, messages, taches, onFiche, onMajMessage, peutAgir, t }) {
  const [projets, setProjets] = useState([]);
  const [charge, setCharge] = useState(false);
  const [choix, setChoix] = useState(null);
  const [maintenant, setMaintenant] = useState(Date.now());
  const [nouveau, setNouveau] = useState(null); // { nom, debut, fin, but }
  const [erreur, setErreur] = useState(null);
  useEffect(() => { const i = setInterval(() => setMaintenant(Date.now()), 30_000); return () => clearInterval(i); }, []);

  useEffect(() => {
    let vivant = true;
    const lire = async () => {
      const { data } = await supabase.from('legion_projets').select('*').eq('entreprise_id', entreprise.id).order('debut');
      if (vivant) { setProjets(data || []); setCharge(true); }
    };
    lire();
    const canal = supabase.channel(`projets-${entreprise.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'legion_projets', filter: `entreprise_id=eq.${entreprise.id}` }, lire)
      .subscribe();
    return () => { vivant = false; supabase.removeChannel(canal); };
  }, [entreprise.id]);

  const eteints = useMemo(() => new Set((agents || []).filter((a) => !a.actif).map((a) => a.id)), [agents]);
  const liste = useMemo(() => calculerTours(projets, taches, maintenant, eteints), [projets, taches, maintenant, eteints]);
  const tour = liste.find((x) => x.id === choix) || null;
  const auTravail = liste.reduce((s, x) => s + x.agentsAuTravail, 0);

  async function creer(e) {
    e.preventDefault();
    setErreur(null);
    const { nom, debut, fin, but } = nouveau;
    if (String(nom).trim().length < 2) { setErreur(t('legion.ville.nomCourt')); return; }
    if (fin < debut) { setErreur(t('legion.ville.datesInverses')); return; }
    const { error } = await supabase.from('legion_projets').insert({ entreprise_id: entreprise.id, nom: nom.trim().slice(0, 80), debut, fin, but: but?.trim() || null });
    if (error) { setErreur(error.message); return; }
    setNouveau(null);
  }
  async function statut(s) {
    await supabase.from('legion_projets').update({ statut: s }).eq('id', tour.projet.id);
  }

  // L'échelle de la ville : les tours se partagent la largeur.
  const n = Math.max(1, liste.length);
  const largeur = Math.max(52, Math.min(120, (LARG - 120) / n - 30));
  const pasX = n > 1 ? (LARG - 120 - largeur) / (n - 1) : 0;
  const xDe = (i) => (n === 1 ? (LARG - largeur) / 2 : 60 + i * pasX);
  // La plus haute tour tient sous la lune : l'échelle s'adapte.
  const plusHaute = Math.max(1, ...liste.map((x) => Math.min(34, x.rendues) + Math.min(26, x.restantes)));
  const pas = Math.min(7, (SOL - 120) / plusHaute);
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const dansUnMois = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  // Dans une tour : l'immeuble, avec seulement les tâches du projet et les
  // agents qui y travaillent (tout le monde si personne n'y a encore de tâche).
  if (tour) {
    const idsAgents = new Set(tour.taches.map((x) => x.assigne_a).filter(Boolean));
    const siens = agents.filter((a) => idsAgents.has(a.id));
    const sansProjet = tour.id === QUOTIDIEN ? [] : liste.find((x) => x.id === QUOTIDIEN)?.taches.filter((x) => !x.termine_le && !['fait', 'revue'].includes(x.meta?.statut)).slice(0, 30) || [];
    const jr = tour.projet ? joursRestants(tour.projet, maintenant) : null;
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2 border-b border-legion-line px-4 py-3">
          <button type="button" onClick={() => setChoix(null)} className="rounded-pill border border-legion-line px-3 py-1 text-[13px] text-legion-ink hover:border-legion-gold">← {t('legion.ville.titre')}</button>
          <h3 className="min-w-0 flex-1 truncate text-[16px] font-semibold text-legion-ink">{tour.projet ? tour.projet.nom : t('legion.ville.quotidien')}</h3>
          {tour.projet && <span className="font-mono text-[12px] text-legion-muted">{tour.projet.debut} → {tour.projet.fin}{jr != null && !tour.termine ? ` · ${jr >= 0 ? t('legion.ville.joursRestants', { n: jr }) : t('legion.ville.enRetard')}` : ''}</span>}
        </div>
        <div className="flex flex-col gap-2 px-4 py-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-legion-line"><i className="block h-full bg-gradient-to-r from-legion-accent to-legion-gold" style={{ width: `${Math.round(tour.avancement * 100)}%` }} /></div>
          <p className="text-[13px] text-legion-muted">{t('legion.ville.resumeTour', { rendues: tour.rendues, total: tour.total, actifs: tour.agentsAuTravail })}</p>
          {tour.projet?.but && <p className="text-[13.5px] text-legion-ink">{tour.projet.but}</p>}
          {tour.projet && peutAgir && (
            <div className="flex flex-wrap gap-2">
              {tour.projet.statut !== 'fini' && <button type="button" onClick={() => statut('fini')} className="rounded-pill bg-legion-gold px-3 py-1 text-[12.5px] font-semibold text-legion-bg">{t('legion.ville.marquerFini')}</button>}
              {tour.projet.statut === 'en_cours' && <button type="button" onClick={() => statut('en_pause')} className="rounded-pill border border-legion-line px-3 py-1 text-[12.5px] text-legion-muted">{t('legion.ville.pause')}</button>}
              {tour.projet.statut !== 'en_cours' && <button type="button" onClick={() => statut('en_cours')} className="rounded-pill border border-legion-line px-3 py-1 text-[12.5px] text-legion-muted">{t('legion.ville.reprendre')}</button>}
            </div>
          )}
        </div>
        <div className="-mb-4"><Immeuble agents={siens.length ? siens : agents} departements={departements} messages={messages} taches={tour.taches} onFiche={onFiche} t={t} /></div>
        {peutAgir && sansProjet.length > 0 && (
          <details className="mx-4 mb-4 mt-6 rounded-card border border-legion-line bg-legion-card p-3">
            <summary className="cursor-pointer text-[13.5px] font-semibold text-legion-ink">{t('legion.ville.ranger', { n: sansProjet.length })}</summary>
            <ul className="mt-2 flex flex-col gap-1.5">
              {sansProjet.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-2 rounded-input bg-legion-bg px-2.5 py-1.5 text-[13px]">
                  <span className="min-w-0 truncate text-legion-ink">{x.texte}</span>
                  <button type="button" onClick={() => onMajMessage?.(x.id, { meta: { ...(x.meta || {}), projet_id: tour.projet.id } })}
                    className="shrink-0 rounded-pill border border-legion-gold px-2.5 py-0.5 text-[12px] text-legion-gold">{t('legion.ville.ajouterIci')}</button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  }

  return (
    <div>
      <style>{`@media (prefers-reduced-motion:no-preference){.ville-scintille{animation:villeScint 3.4s ease-in-out infinite}.ville-grue{transform-box:fill-box;transform-origin:0% 50%;animation:villeGrue 9s ease-in-out infinite}}
        @keyframes villeScint{0%,100%{opacity:1}50%{opacity:.7}}@keyframes villeGrue{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(4deg)}}`}</style>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[13px] text-legion-muted">{t('legion.ville.resume', { tours: projets.length, actifs: auTravail })}</p>
        {peutAgir && !nouveau && <button type="button" onClick={() => setNouveau({ nom: '', debut: aujourdhui, fin: dansUnMois, but: '' })} className="rounded-pill bg-legion-gold px-3 py-1 text-[13px] font-semibold text-legion-bg">+ {t('legion.ville.nouveauProjet')}</button>}
      </div>
      {nouveau && (
        <form onSubmit={creer} className="mx-4 mt-3 grid gap-2 rounded-card border border-legion-line bg-legion-card p-3 sm:grid-cols-[1fr_auto_auto]">
          <input id="ville-nom" value={nouveau.nom} onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })} placeholder={t('legion.ville.nomProjet')} maxLength={80}
            className="rounded-input border border-legion-line bg-legion-bg px-3 py-2 text-[14px] text-legion-ink" />
          <label className="flex items-center gap-2 text-[12px] text-legion-muted">{t('legion.ville.du')}<input id="ville-debut" type="date" value={nouveau.debut} onChange={(e) => setNouveau({ ...nouveau, debut: e.target.value })} className="rounded-input border border-legion-line bg-legion-bg px-2 py-1.5 text-[13px] text-legion-ink" /></label>
          <label className="flex items-center gap-2 text-[12px] text-legion-muted">{t('legion.ville.au')}<input id="ville-fin" type="date" value={nouveau.fin} onChange={(e) => setNouveau({ ...nouveau, fin: e.target.value })} className="rounded-input border border-legion-line bg-legion-bg px-2 py-1.5 text-[13px] text-legion-ink" /></label>
          <textarea id="ville-but" value={nouveau.but} onChange={(e) => setNouveau({ ...nouveau, but: e.target.value })} placeholder={t('legion.ville.butProjet')} rows={2} maxLength={600}
            className="rounded-input border border-legion-line bg-legion-bg px-3 py-2 text-[13.5px] text-legion-ink sm:col-span-3" />
          {erreur && <p className="text-[12.5px] text-legion-danger sm:col-span-3">{erreur}</p>}
          <div className="flex gap-2 sm:col-span-3">
            <button type="submit" className="rounded-pill bg-legion-gold px-4 py-1.5 text-[13px] font-semibold text-legion-bg">{t('legion.ville.creer')}</button>
            <button type="button" onClick={() => { setNouveau(null); setErreur(null); }} className="rounded-pill border border-legion-line px-4 py-1.5 text-[13px] text-legion-muted">{t('common.cancel', 'Annuler')}</button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${LARG} ${H}`} className="block min-w-[640px] w-full" role="img" aria-label={t('legion.ville.titre')}>
          <defs>
            <linearGradient id="ville-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#080E1F" /><stop offset=".7" stopColor="#101A34" /><stop offset="1" stopColor="#1A2340" /></linearGradient>
            <linearGradient id="ville-verre" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1D2944" /><stop offset=".5" stopColor="#26345A" /><stop offset="1" stopColor="#1A2440" /></linearGradient>
          </defs>
          <rect width={LARG} height={H} fill="url(#ville-ciel)" />
          {Array.from({ length: 60 }).map((_, i) => <circle key={i} cx={(i * 151) % LARG} cy={(i * 67) % 150} r={(i % 3) * 0.4 + 0.4} fill="#EDF1F8" opacity={0.25 + (i % 4) * 0.12} />)}
          <circle cx={LARG - 80} cy="62" r="24" fill="#F2C98A" opacity=".9" /><circle cx={LARG - 71} cy="56" r="22" fill="#0C1530" />
          {Array.from({ length: 22 }).map((_, i) => <rect key={i} x={i * 42 - 10} y={SOL - (40 + (i * 53) % 80)} width={28 + (i * 37) % 36} height={40 + (i * 53) % 80} fill="#141D36" opacity=".8" />)}
          <rect x="0" y={SOL} width={LARG} height={H - SOL} fill="#0A0F1E" />
          <rect x="40" y={SOL} width={LARG - 80} height="4" fill="#E3A857" opacity=".45" />
          {liste.map((x, i) => (
            <Tour key={x.id} t={x} x={xDe(i)} largeur={largeur} choisie={choix === x.id} onChoisir={() => setChoix(x.id)} tr={t} pas={pas} />
          ))}
          {charge && !liste.length && <text x={LARG / 2} y={SOL - 80} textAnchor="middle" fontSize="15" fill="#93A1B8">{t('legion.ville.vide')}</text>}
        </svg>
      </div>
      <p className="px-4 pb-3 pt-1 text-[12px] text-legion-muted">{t('legion.ville.legende')}</p>
    </div>
  );
}
