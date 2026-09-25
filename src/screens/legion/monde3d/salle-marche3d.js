// La salle des marchés (Beau, 25/09 : « un style salle de marché pour les
// entreprises de ce métier », photo à l'appui). Elle remplace l'atelier des
// entreprises de finance. Règle de vérité : aucun cours inventé à l'écran.
// Ce qu'on montre est réel : les taux de change du jour (table taux_du_jour,
// la même que les prix de Finjaro), l'activité réelle de l'entreprise (tâches
// rendues par jour), l'heure des grandes places.
import * as THREE from 'three';

// Une entreprise de ce métier : son modèle, ou ce qu'elle dit faire.
const MOTS = /(bourse|action|trading|trader|crypto|forex|portefeuille|invest|salle de march|finance|banque|stock|equity|hedge|fund|patrimoine)/i;
export function estSalleDeMarche(entreprise) {
  if (!entreprise) return false;
  if (entreprise.modele === 'marche') return true;
  return MOTS.test(`${entreprise.nom || ''} ${entreprise.projet || ''}`);
}

// Les paires affichées, calculées depuis les taux « par euro ».
const PAIRES = [['EUR', 'USD'], ['GBP', 'USD'], ['USD', 'JPY'], ['USD', 'CHF'], ['USD', 'CAD'], ['USD', 'CNY'], ['EUR', 'XAF'], ['USD', 'NGN'], ['USD', 'ZAR'], ['USD', 'INR'], ['USD', 'BRL'], ['EUR', 'GBP']];
export function pairesDuJour(parEuro = {}) {
  const v = (c) => (c === 'EUR' ? 1 : Number(parEuro[c]));
  return PAIRES.map(([a, b]) => {
    const x = v(b) / v(a);
    return Number.isFinite(x) && x > 0 ? { paire: `${a}/${b}`, valeur: x >= 100 ? x.toFixed(2) : x.toFixed(4) } : null;
  }).filter(Boolean);
}

// Tâches rendues par jour, sur les 14 derniers jours (vraies données).
export function activite14j(taches = [], maintenant = Date.now()) {
  const jours = Array(14).fill(0);
  const debut = new Date(maintenant); debut.setHours(0, 0, 0, 0);
  for (const t of taches) {
    const d = Date.parse(t.meta?.livre_le || '');
    if (!Number.isFinite(d)) continue;
    const i = 13 - Math.floor((debut.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
    if (i >= 0 && i < 14) jours[i] += 1;
  }
  return jours;
}

const PLACES = [['New York', 'America/New_York'], ['Londres', 'Europe/London'], ['Paris', 'Europe/Paris'], ['Tokyo', 'Asia/Tokyo'], ['Hong Kong', 'Asia/Hong_Kong']];

// Un écran dessiné (canvas plus petit que ceux de l'atelier : il y en a beaucoup).
function panneau(l, h, largeur, dessiner) {
  const c = document.createElement('canvas'); c.width = largeur; c.height = Math.round(largeur * h / l);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
  const redessiner = (d = {}) => { dessiner(c.getContext('2d'), c.width, c.height, d); t.needsUpdate = true; };
  redessiner({});
  return { mat, texture: t, redessiner, fabriquer: () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(l, h), mat); m.userData.redessiner = redessiner; return m; } };
}

export async function construireSalleMarche(monde) {
  const fr = monde.langue !== 'en';
  const g = new THREE.Group();
  const murs = [];
  const moquette = new THREE.MeshStandardMaterial({ color: '#2b3038', roughness: 0.95 });
  const mur = new THREE.MeshStandardMaterial({ color: '#1d2129', roughness: 0.8 });
  monde.sol(g, 22, 14, moquette);
  monde.plafond(g, 22, 14, 3.6, '#20242b');
  monde.mur(g, murs, 0, 7, 22, 0.3, 3.6, mur);
  monde.mur(g, murs, 11, 0, 0.3, 14, 3.6, mur);
  monde.vitre(g, 0, -7, 22, 3.6); murs.push({ x0: -11, x1: 11, z0: -7.2, z1: -6.9 });
  monde.vitre(g, -11, 0, 14, 3.6, Math.PI / 2); murs.push({ x0: -11.2, x1: -10.9, z0: -7, z1: 7 });
  const plateauM = new THREE.MeshStandardMaterial({ color: '#e9e6df', roughness: 0.4 });
  const noir = new THREE.MeshStandardMaterial({ color: '#0f1115', metalness: 0.5, roughness: 0.3 });

  // Les écrans partagés (une seule image pour tous les postes, redessinée avec les vraies données)
  const taux = panneau(0.56, 0.33, 512, (x, w, h, d) => {
    x.fillStyle = '#05080d'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#e3a857'; x.font = `bold ${h * 0.1}px ui-monospace, monospace`; x.fillText(fr ? 'TAUX DU JOUR' : 'TODAY\'S RATES', w * 0.04, h * 0.13);
    (d.paires || []).slice(0, 8).forEach((p, i) => { x.fillStyle = '#9fb3c8'; x.font = `${h * 0.085}px ui-monospace, monospace`; x.fillText(p.paire, w * 0.04, h * (0.26 + i * 0.1)); x.fillStyle = '#7ee787'; x.fillText(p.valeur, w * 0.5, h * (0.26 + i * 0.1)); });
    if (!(d.paires || []).length) { x.fillStyle = '#6b7785'; x.font = `${h * 0.08}px ui-monospace, monospace`; x.fillText(fr ? 'chargement…' : 'loading…', w * 0.04, h * 0.3); }
  });
  const activite = panneau(0.56, 0.33, 512, (x, w, h, d) => {
    x.fillStyle = '#05080d'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#e3a857'; x.font = `bold ${h * 0.1}px ui-monospace, monospace`; x.fillText(fr ? 'TÂCHES RENDUES · 14 J' : 'TASKS DELIVERED · 14 D', w * 0.04, h * 0.13);
    const j = d.jours || []; const max = Math.max(1, ...j);
    j.forEach((n, i) => { const bh = (n / max) * h * 0.62; x.fillStyle = i === j.length - 1 ? '#e3a857' : '#3fa7ff'; x.fillRect(w * 0.05 + i * w * 0.064, h * 0.9 - bh, w * 0.045, bh); });
    x.fillStyle = '#9fb3c8'; x.font = `${h * 0.07}px ui-monospace, monospace`; x.fillText(`${fr ? 'total' : 'total'} ${j.reduce((a, b) => a + b, 0)}`, w * 0.7, h * 0.13);
  });
  const horloges = panneau(0.56, 0.33, 512, (x, w, h, d) => {
    x.fillStyle = '#05080d'; x.fillRect(0, 0, w, h);
    const t = d.maintenant || Date.now();
    PLACES.forEach(([nom, tz], i) => {
      const hh = new Date(t).toLocaleTimeString(fr ? 'fr-FR' : 'en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
      x.fillStyle = '#9fb3c8'; x.font = `${h * 0.09}px ui-monospace, monospace`; x.fillText(nom, w * 0.05, h * (0.2 + i * 0.17));
      x.fillStyle = '#edf1f8'; x.font = `bold ${h * 0.12}px ui-monospace, monospace`; x.fillText(hh, w * 0.62, h * (0.2 + i * 0.17));
    });
  });

  // Trois rangées de pupitres, quatre postes chacune : 4 écrans (2 × 2) par poste.
  const postes = [];
  for (let rang = 0; rang < (monde.mobile ? 2 : 3); rang += 1) { // téléphone : deux rangées (mémoire)
    const z = -4 + rang * 3.4;
    const pupitre = new THREE.Mesh(new THREE.BoxGeometry(18, 0.05, 1.0), plateauM); pupitre.position.set(-1, 0.74, z); pupitre.castShadow = pupitre.receiveShadow = true; g.add(pupitre);
    const face = new THREE.Mesh(new THREE.BoxGeometry(18, 0.7, 0.05), noir); face.position.set(-1, 0.37, z - 0.45); g.add(face);
    murs.push({ x0: -10, x1: 8, z0: z - 0.55, z1: z + 0.55 });
    for (let i = 0; i < 4; i += 1) {
      const x = -8 + i * 4.3;
      // Écran principal : le vrai travail de l'agent assis là
      const principal = panneau(0.56, 0.33, 512, (c, w, h, d) => {
        c.fillStyle = d.actif ? '#0a0f16' : '#05070a'; c.fillRect(0, 0, w, h);
        if (!d.actif) return;
        c.fillStyle = '#e3a857'; c.font = `bold ${h * 0.11}px ui-monospace, monospace`; c.fillText(d.nom || '', w * 0.05, h * 0.15);
        c.font = `${h * 0.08}px ui-monospace, monospace`;
        const txt = String(d.texte || '').replace(/\s+/g, ' ');
        for (let l = 0; l < 7; l += 1) { c.fillStyle = ['#7ee787', '#79c0ff', '#edf1f8'][l % 3]; c.fillText(txt.slice(l * 30, l * 30 + 30), w * 0.05, h * (0.3 + l * 0.1)); }
      });
      const ecran = principal.fabriquer();
      const places = [[-0.3, 1.02, principal], [0.3, 1.02, taux], [-0.3, 1.38, activite], [0.3, 1.38, horloges]];
      for (const [dx, y, p] of places) {
        const cadre = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.36, 0.03), noir); cadre.position.set(x + dx, y, z - 0.3); g.add(cadre);
        const m = p === principal ? ecran : p.fabriquer();
        m.position.set(x + dx, y, z - 0.284); g.add(m);
      }
      const bras = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.05), noir); bras.position.set(x, 1.0, z - 0.33); g.add(bras);
      const clavier = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.14), noir); clavier.position.set(x, 0.775, z + 0.1); g.add(clavier);
      const tel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.18), noir); tel.position.set(x + 0.45, 0.79, z + 0.05); g.add(tel);
      const f = monde.fauteuil(); f.position.set(x, 0, z + 0.85); g.add(f);
      postes.push({ x, z: z + 0.8, rot: Math.PI, ecran });
      murs.push({ x0: x - 0.3, x1: x + 0.3, z0: z + 0.6, z1: z + 1.1 });
    }
  }

  // Le mur d'images, au fond : taux, activité, horloges, et ce qui est en cours.
  const grand = (p, x) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.95), p.mat); m.position.set(x, 2.25, 6.83); m.rotation.y = Math.PI; g.add(m); const c = new THREE.Mesh(new THREE.BoxGeometry(3.45, 2.1, 0.06), noir); c.position.set(x, 2.25, 6.86); g.add(c); };
  grand(taux, 3.6); grand(activite, 0); grand(horloges, -3.6);
  const enCours = monde.ecran(10.5, 0.7, (x, w, h, d) => {
    x.fillStyle = '#06090e'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#e3a857'; x.font = `bold ${h * 0.36}px ui-monospace, monospace`; x.fillText(fr ? 'EN COURS' : 'IN PROGRESS', w * 0.015, h * 0.62);
    x.fillStyle = '#edf1f8'; x.font = `${h * 0.32}px ui-monospace, monospace`;
    x.fillText((d.lignes || []).slice(0, 3).join('   ·   ').slice(0, 150) || (fr ? 'rien en cours pour l\'instant' : 'nothing in progress right now'), w * 0.13, h * 0.62);
  });
  enCours.position.set(0, 0.95, 6.83); enCours.rotation.y = Math.PI; g.add(enCours);

  // Le bandeau lumineux qui défile en haut des murs : les taux du jour.
  const bandeC = document.createElement('canvas'); bandeC.width = 2048; bandeC.height = 64;
  const bandeT = new THREE.CanvasTexture(bandeC); bandeT.colorSpace = THREE.SRGBColorSpace; bandeT.wrapS = THREE.RepeatWrapping;
  const dessinerBande = (paires) => {
    const x = bandeC.getContext('2d'); x.fillStyle = '#030507'; x.fillRect(0, 0, 2048, 64);
    x.font = 'bold 34px ui-monospace, monospace'; let px = 20;
    for (const p of paires.length ? paires : [{ paire: fr ? 'TAUX DU JOUR' : 'TODAY\'S RATES', valeur: '…' }]) { x.fillStyle = '#9fb3c8'; x.fillText(p.paire, px, 44); px += x.measureText(p.paire).width + 14; x.fillStyle = '#7ee787'; x.fillText(p.valeur, px, 44); px += x.measureText(p.valeur).width + 60; }
    bandeT.needsUpdate = true;
  };
  dessinerBande([]);
  const bandeM = new THREE.MeshBasicMaterial({ map: bandeT, toneMapped: false });
  for (const [l, x, z, rot] of [[22, 0, 6.83, Math.PI], [14, 10.83, 0, -Math.PI / 2]]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(l, 0.32), bandeM); b.position.set(x, 3.3, z); b.rotation.y = rot; bandeT.repeat.set(l / 22, 1); g.add(b); }

  monde.lampes(g, [[-6, -4, 3.58], [0, -4, 3.58], [6, -4, 3.58], [-6, 2.8, 3.58], [0, 2.8, 3.58], [6, 2.8, 3.58]]);
  // Bandeaux de lumière bleutée au plafond, au-dessus des rangées
  const led = new THREE.MeshBasicMaterial({ color: '#cfe6ff' });
  for (const z of [-4, -0.6, 2.8]) { const b = new THREE.Mesh(new THREE.BoxGeometry(18, 0.03, 0.08), led); b.position.set(-1, 3.57, z - 0.2); g.add(b); }
  monde.ascenseur(g, murs, 8, 6.83, Math.PI);

  return {
    groupe: g, murs, postes,
    tableau: enCours,
    // Données réelles → écrans
    majMarche: ({ paires, jours, maintenant }) => {
      if (paires) { taux.redessiner({ paires }); dessinerBande(paires); }
      if (jours) activite.redessiner({ jours });
      horloges.redessiner({ maintenant });
    },
    avancer: (dt) => { bandeT.offset.x = (bandeT.offset.x + dt * 0.03) % 1; },
    depart: { x: 9.5, z: 4.6, yaw: 0.5 },
    poi: [{ type: 'ascenseur', x: 8, z: 5.9, rayon: 1.6 }],
    limites: { x0: -10.7, x1: 10.7, z0: -6.7, z1: 6.7 },
    sortieAscenseur: { x: 9.5, z: 4.6, yaw: 0.5 },
  };
}
