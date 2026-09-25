// Le tableau de bord quand on conduit (Beau, 25/09 : « les vrais designs, comme ces jeux de
// course ») : compteur rond à aiguille, jauge de nitro, mini-carte qui tourne avec la voiture,
// volant tactile et vraies pédales au téléphone. Dessiné pour Léo (SVG), rien de copié.
import { useRef, useState } from 'react';
import { RUES } from './conduite';

const OR = '#e3a857';

// Compteur : arc de 240°, graduations tous les 20 km/h, aiguille, chiffre au centre.
export function Compteur({ kmh = 0, max = 140, jauge = null, nitro = false, alt = null, taille = 132 }) {
  const a0 = -210, a1 = 30; // degrés (0 = à droite)
  const angle = (v) => a0 + (Math.min(v, max) / max) * (a1 - a0);
  const pt = (deg, r) => [60 + Math.cos((deg * Math.PI) / 180) * r, 60 + Math.sin((deg * Math.PI) / 180) * r];
  const arc = (d0, d1, r) => { const [x0, y0] = pt(d0, r), [x1, y1] = pt(d1, r); return `M${x0} ${y0} A${r} ${r} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
  const graduations = [];
  for (let v = 0; v <= max; v += 10) {
    const [x0, y0] = pt(angle(v), v % 20 ? 45 : 42), [x1, y1] = pt(angle(v), 49);
    graduations.push(<line key={v} x1={x0} y1={y0} x2={x1} y2={y1} stroke={v >= max - 20 ? '#ff5a4a' : '#c9d1dc'} strokeWidth={v % 20 ? 1 : 2} />);
    if (v % 40 === 0) { const [tx, ty] = pt(angle(v), 33); graduations.push(<text key={`t${v}`} x={tx} y={ty + 3} textAnchor="middle" fontSize="8" fill="#93a1b8" fontFamily="system-ui">{v}</text>); }
  }
  const [nx, ny] = pt(angle(kmh), 44);
  return (
    <svg viewBox="0 0 120 120" width={taille} height={taille} className="drop-shadow-[0_4px_12px_rgba(0,0,0,.5)]" aria-label={`${kmh} km/h`}>
      <defs><radialGradient id="fondCompteur" cx="50%" cy="45%" r="60%"><stop offset="0%" stopColor="#1d2638" /><stop offset="100%" stopColor="#080c16" /></radialGradient></defs>
      <circle cx="60" cy="60" r="57" fill="url(#fondCompteur)" stroke="#2b3448" strokeWidth="2" />
      <path d={arc(a0, a1, 52)} fill="none" stroke="#243047" strokeWidth="4" strokeLinecap="round" />
      <path d={arc(a0, Math.max(a0 + 0.5, angle(kmh)), 52)} fill="none" stroke={nitro ? '#4cc9f0' : OR} strokeWidth="4" strokeLinecap="round" />
      {graduations}
      <line x1="60" y1="60" x2={nx} y2={ny} stroke="#ff5a4a" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="60" cy="60" r="5" fill="#ff5a4a" stroke="#080c16" strokeWidth="2" />
      <text x="60" y="84" textAnchor="middle" fontSize="19" fontWeight="700" fill="#edf1f8" fontFamily="ui-monospace, monospace">{kmh}</text>
      <text x="60" y="95" textAnchor="middle" fontSize="7" fill="#93a1b8" fontFamily="system-ui">km/h</text>
      {alt != null && <text x="60" y="107" textAnchor="middle" fontSize="9" fontWeight="700" fill={OR} fontFamily="ui-monospace, monospace">{alt} m</text>}
      {jauge != null && (
        <g>
          <path d={arc(40, 140, 55)} fill="none" stroke="#1b2437" strokeWidth="3" />
          <path d={arc(140 - (Math.max(1, jauge) / 100) * 100, 140, 55)} fill="none" stroke="#4cc9f0" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

// Mini-carte : la voiture au centre, qui regarde toujours vers le haut ; rues, prochaine porte, héliport.
export function MiniCarte({ x = 0, z = 0, cap = 0, porte = null, heliport = [52, 4], taille = 110 }) {
  const echelle = 0.62; // px par mètre (≈ 90 m de rayon)
  const f = [Math.sin(cap), Math.cos(cap)], d = [-Math.cos(cap), Math.sin(cap)];
  const ecran = (wx, wz) => { const rx = wx - x, rz = wz - z; return [60 + (rx * d[0] + rz * d[1]) * echelle, 60 - (rx * f[0] + rz * f[1]) * echelle]; };
  const rues = [];
  for (const rx of RUES.x) { const [a, b] = [ecran(rx, -200), ecran(rx, 200)]; rues.push(<line key={`x${rx}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#5a6478" strokeWidth={RUES.largeur * echelle} strokeLinecap="butt" />); }
  for (const rz of RUES.z) { const [a, b] = [ecran(-200, rz), ecran(200, rz)]; rues.push(<line key={`z${rz}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#5a6478" strokeWidth={RUES.largeur * echelle} strokeLinecap="butt" />); }
  const [imx, imz] = ecran(0, 0);
  const [hx, hz] = ecran(...heliport);
  let cible = null;
  if (porte) {
    const [px, pz] = ecran(...porte);
    const dx = px - 60, dy = pz - 60, dist = Math.hypot(dx, dy);
    const [cx, cy] = dist > 48 ? [60 + (dx / dist) * 48, 60 + (dy / dist) * 48] : [px, pz]; // collée au bord si trop loin
    cible = <circle cx={cx} cy={cy} r="5" fill={OR} stroke="#080c16" strokeWidth="1.5" />;
  }
  return (
    <svg viewBox="0 0 120 120" width={taille} height={taille} className="drop-shadow-[0_4px_12px_rgba(0,0,0,.5)]">
      <defs><clipPath id="rondCarte"><circle cx="60" cy="60" r="55" /></clipPath></defs>
      <circle cx="60" cy="60" r="57" fill="#2c3a2e" stroke="#2b3448" strokeWidth="2" />
      <g clipPath="url(#rondCarte)">
        <rect x="0" y="0" width="120" height="120" fill="#34453a" />
        {rues}
        <rect x={imx - 7} y={imz - 5} width="14" height="10" fill="#1b2233" stroke={OR} strokeWidth="1" transform={`rotate(${(cap * 180) / Math.PI} ${imx} ${imz})`} />
        <text x={hx} y={hz + 3} textAnchor="middle" fontSize="9" fontWeight="800" fill="#f2c230" fontFamily="system-ui">H</text>
        {cible}
      </g>
      <path d="M60 52 L66 66 L60 62 L54 66 Z" fill="#ffffff" stroke="#080c16" strokeWidth="1" />
    </svg>
  );
}

// Volant tactile : on le tourne du doigt ; il revient au centre quand on le lâche.
export function Volant({ surTourner, taille = 132 }) {
  const [angle, setAngle] = useState(0);
  const ref = useRef(null);
  const prise = useRef(null);
  const centre = () => { const r = ref.current.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const lire = (e) => { const [cx, cy] = centre(); return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI; };
  const bouger = (e) => {
    if (!prise.current) return;
    let d = lire(e) - prise.current.depart;
    while (d > 180) d -= 360; while (d < -180) d += 360;
    const a = Math.max(-120, Math.min(120, prise.current.angle + d));
    setAngle(a); surTourner(a / 120);
  };
  const lacher = () => { prise.current = null; setAngle(0); surTourner(0); };
  return (
    <div ref={ref} className="touch-none select-none" style={{ width: taille, height: taille }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); prise.current = { depart: lire(e), angle }; }}
      onPointerMove={bouger} onPointerUp={lacher} onPointerCancel={lacher}>
      <svg viewBox="0 0 120 120" width={taille} height={taille} style={{ transform: `rotate(${angle}deg)`, transition: prise.current ? 'none' : 'transform .25s ease-out' }} className="drop-shadow-[0_6px_14px_rgba(0,0,0,.55)]">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#161a22" strokeWidth="13" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="#2c323d" strokeWidth="9" />
        <circle cx="60" cy="60" r="56.5" fill="none" stroke="#3b4250" strokeWidth="1.5" />
        <path d="M13 64 Q60 76 107 64 L100 74 Q60 86 20 74 Z" fill="#232833" />
        <rect x="53" y="66" width="14" height="42" rx="5" fill="#232833" />
        <circle cx="60" cy="62" r="15" fill="#1a1e27" stroke="#3b4250" strokeWidth="1.5" />
        <circle cx="60" cy="62" r="6" fill={OR} />
        <rect x="56" y="5" width="8" height="10" rx="2" fill={OR} />
      </svg>
    </div>
  );
}

// Pédales : frein (large) et accélérateur (haut), avec leurs stries ; bouton de nitro au-dessus.
export function Pedales({ surAppui, jauge = 100, etiquettes }) {
  const appui = (k, v) => (e) => { if (v) e.currentTarget.setPointerCapture(e.pointerId); surAppui({ [k]: v }); };
  const pedale = (k, w, h, label) => (
    <button key={k} type="button" aria-label={label} onPointerDown={appui(k, true)} onPointerUp={appui(k, false)} onPointerCancel={appui(k, false)}
      className="touch-none select-none active:scale-95 active:brightness-125" style={{ width: w, height: h }}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="drop-shadow-[0_6px_12px_rgba(0,0,0,.55)]">
        <rect x="2" y="2" width={w - 4} height={h - 4} rx="10" fill="#20252f" stroke="#454d5c" strokeWidth="2" />
        {Array.from({ length: Math.floor((h - 20) / 9) }, (_, i) => <rect key={i} x="9" y={12 + i * 9} width={w - 18} height="3.5" rx="1.5" fill="#39404d" />)}
      </svg>
    </button>
  );
  return (
    <div className="flex items-end gap-2.5">
      {pedale('frein', 62, 60, etiquettes.frein)}
      <div className="flex flex-col items-center gap-2">
        <button type="button" aria-label={etiquettes.nitro} onPointerDown={appui('nitro', true)} onPointerUp={appui('nitro', false)} onPointerCancel={appui('nitro', false)}
          className="relative grid h-12 w-12 touch-none select-none place-items-center rounded-full border-2 border-[#4cc9f0] bg-[#0b1120]/85 text-[20px] active:scale-95"
          style={{ background: `conic-gradient(#4cc9f0 ${jauge * 3.6}deg, rgba(11,17,32,.85) 0)` }}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0b1120]">🔥</span>
        </button>
        {pedale('gaz', 50, 96, etiquettes.gaz)}
      </div>
    </div>
  );
}
