import { useEffect, useMemo, useState } from 'react';
import { modelePlan, CADRES, ICONES_PLAN, angleFleche, dansCadre } from './plan';

// La carte de la ville (touche M ; Beau, 08/10 : « exactement ce qu'il fait », la carte des
// villes de The Arcade). Vue d'avion : les rues, les immeubles, nos lieux, et toi (la flèche).
// Toucher un lieu t'y emmène. Peu de texte : une icône par lieu, son nom au survol ou au toucher.

const COULEURS = { sol: '#121a2b', rue: '#2c3852', trait: '#46546f', immeuble: '#1f2a40', lieu: '#e3a857', eau: '#173247', champ: '#1d3326', piste: '#3a3f47' };

export default function CarteVille({ monde, t, onFermer, mobile }) {
  const [donnees, setDonnees] = useState(() => monde?.donneesCarte?.() || null);
  const [cadre, setCadre] = useState('ville');
  const [choisi, setChoisi] = useState(null);

  // La flèche suit la personne (et sa voiture) tant que la carte est ouverte.
  useEffect(() => {
    const i = setInterval(() => setDonnees(monde?.donneesCarte?.() || null), 250);
    return () => clearInterval(i);
  }, [monde]);
  useEffect(() => {
    const f = (e) => { if (e.code === 'Escape' || e.code === 'KeyM') { e.preventDefault(); onFermer(); } };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onFermer]);

  const plan = useMemo(() => (donnees ? modelePlan(donnees) : null), [donnees?.routes, donnees?.emprises, donnees?.reserves, donnees?.chantiers]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!plan) return null;
  const c = CADRES[cadre];
  const j = donnees.dehors ? donnees.joueur : { x: 0, z: 0, cap: 0 };
  const nom = (cle) => t(`legion.monde.carte.lieux.${cle}`);

  async function aller(lieu) {
    setChoisi(lieu.cle);
    if (donnees.enVehicule) return; // on ne se téléporte pas au volant : la carte guide seulement
    const ok = await monde.allerSurCarte(lieu.aller);
    if (ok) onFermer();
  }

  return (
    <div className="absolute inset-0 z-[9] flex flex-col bg-[#070b14]/[0.97]" role="dialog" aria-label={t('legion.monde.carte.titre')}>
      <div className="flex items-center gap-2 px-3 pt-2" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <p className="text-[13px] font-bold text-legion-gold">🗺️ {t('legion.monde.carte.titre')}</p>
        <div className="ml-auto flex rounded-pill bg-white/5 p-0.5">
          {['ville', 'tout'].map((k) => (
            <button key={k} type="button" onClick={() => setCadre(k)} className={`rounded-pill px-3 py-1 text-[12px] font-semibold ${cadre === k ? 'bg-legion-gold text-legion-bg' : 'text-legion-ink'}`}>{t(`legion.monde.carte.${k}`)}</button>
          ))}
        </div>
        <button type="button" onClick={onFermer} aria-label={t('common.close')} className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-[14px] text-legion-ink">✕</button>
      </div>

      <div className="relative min-h-0 flex-1 p-2">
        <svg viewBox={`${c.x0} ${c.z0} ${c.l} ${c.h}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full" role="img" aria-label={t('legion.monde.carte.titre')}>
          <rect x={-600} y={-240} width={1200} height={480} fill={COULEURS.sol} />
          {/* La campagne et l'aéroport (grande carte) */}
          {plan.quartiers.map((q) => <rect key={q.id} x={q.x0} y={q.z0} width={q.x1 - q.x0} height={q.z1 - q.z0} fill={q.id === 'campagne' ? COULEURS.champ : '#161d2c'} />)}
          <rect x={plan.piste.x - 9} y={plan.piste.z0} width={18} height={plan.piste.z1 - plan.piste.z0} fill={COULEURS.piste} rx={2} />
          {/* La ville : le bloc, les rues */}
          <rect x={-200} y={-200} width={400} height={400} fill="#172034" />
          {plan.routes.x.map((x) => <rect key={`x${x}`} x={x - plan.routes.largeur / 2} y={-200} width={plan.routes.largeur} height={400} fill={COULEURS.rue} />)}
          {plan.routes.z.map((z) => <rect key={`z${z}`} x={-200} y={z - plan.routes.largeur / 2} width={400} height={plan.routes.largeur} fill={COULEURS.rue} />)}
          {/* Les îlots qui ont un rôle : légèrement teintés */}
          {plan.lieux.filter((l) => l.ilot).map((l) => <rect key={`i${l.cle}`} x={l.ilot.x0} y={l.ilot.z0} width={l.ilot.x1 - l.ilot.x0} height={l.ilot.z1 - l.ilot.z0} fill={COULEURS.lieu} opacity={choisi === l.cle ? 0.22 : 0.08} />)}
          {/* Les immeubles, plus clairs quand ils sont hauts */}
          {plan.immeubles.map((b, i) => <rect key={i} x={b.x0} y={b.z0} width={b.w} height={b.d} fill={COULEURS.immeuble} stroke={COULEURS.trait} strokeWidth={0.6} opacity={0.65 + Math.min(0.35, b.h / 300)} />)}
          {/* Notre immeuble */}
          <rect x={-12.8} y={-9.8} width={25.6} height={19.6} fill={COULEURS.lieu} opacity={0.85} rx={1.5} />
          {/* Les chantiers (projets de l'entreprise) */}
          {plan.chantiers.map((ch) => <circle key={ch.id} cx={ch.x} cy={ch.z} r={2.2} fill="#ffb020" />)}
          {/* Les lieux : une icône, touchable */}
          {plan.lieux.map((l) => (
            <g key={l.cle} onClick={() => aller(l)} style={{ cursor: 'pointer' }}>
              <title>{nom(l.cle)}</title>
              <circle cx={l.x} cy={l.z} r={cadre === 'tout' ? 16 : 9} fill="#0b1120" stroke={COULEURS.lieu} strokeWidth={choisi === l.cle ? 2.4 : 1.2} />
              <text x={l.x} y={l.z} textAnchor="middle" dominantBaseline="central" fontSize={cadre === 'tout' ? 16 : 9}>{ICONES_PLAN[l.cle]}</text>
            </g>
          ))}
          {/* Toi : une flèche laiton dans un halo */}
          {j && (dansCadre(c, j.x, j.z) || cadre === 'tout') && (
            <g transform={`translate(${j.x} ${j.z}) rotate(${angleFleche(j.cap)})`}>
              <circle r={cadre === 'tout' ? 14 : 8} fill={COULEURS.lieu} opacity={0.18}>
                <animate attributeName="r" values={cadre === 'tout' ? '10;18;10' : '6;11;6'} dur="1.8s" repeatCount="indefinite" />
              </circle>
              <path d={cadre === 'tout' ? 'M0 12 L7 -8 L0 -3 L-7 -8 Z' : 'M0 7 L4.5 -5 L0 -2 L-4.5 -5 Z'} fill="#fff" stroke="#0b1120" strokeWidth={0.8} />
            </g>
          )}
        </svg>
      </div>

      {/* Les lieux en liste : touchables au pouce, une icône et un mot */}
      <div className={`flex gap-1.5 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${mobile ? '' : 'justify-center'}`} style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        {plan.lieux.map((l) => (
          <button key={l.cle} type="button" onClick={() => aller(l)}
            className={`flex shrink-0 items-center gap-1 rounded-pill border px-3 py-1.5 text-[12px] font-semibold ${choisi === l.cle ? 'border-legion-gold bg-legion-gold/15 text-legion-gold' : 'border-white/10 bg-white/5 text-legion-ink'}`}>
            <span aria-hidden="true">{ICONES_PLAN[l.cle]}</span>{nom(l.cle)}
          </button>
        ))}
      </div>
      {donnees.enVehicule && <p className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 rounded-pill bg-black/70 px-3 py-1 text-[11.5px] text-white">{t('legion.monde.carte.auVolant')}</p>}
    </div>
  );
}
