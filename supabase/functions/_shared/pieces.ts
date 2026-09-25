// CE QUE LES AGENTS « VOIENT » ET « ENTENDENT » (23/09).
//
// Constat du 23/09 en relisant la conversation de Beau avec Gemini (« s'ils
// ne comprennent pas, ils m'appellent, on parle ») : un message vocal envoyé
// dans Legion arrivait chez l'agent sous la forme « 🎤 » — il n'entendait
// rien. Même chose pour une photo : il ne la voyait pas.
//
// Ici, avant de répondre : un vocal est transcrit, une photo est décrite
// (texte visible, chiffres, objets). Le résultat est rangé dans la pièce
// elle-même (meta.pieces[i].transcription / .description) : on ne le refait
// jamais deux fois, et la conversation suivante le relit.

import { gemini } from './cout.ts';
import { classeurEnTexte } from './tableur.ts';
import { transcrire } from './relais.ts';

type Piece = { type?: string; url?: string; nom?: string; transcription?: string; description?: string; texte?: string; mime?: string; cree_par_agent?: boolean };

const MODELES = ['gemini-2.5-flash', 'gemini-3.5-flash'];

function enBase64(octets: Uint8Array): string {
  let s = '';
  for (let i = 0; i < octets.length; i += 0x8000) s += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(s);
}

function mimeDe(url: string, reponse: Response, type: string): string {
  const entete = (reponse.headers.get('content-type') || '').split(';')[0].trim();
  if (entete && entete !== 'application/octet-stream') return entete;
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
  const table: Record<string, string> = { wav: 'audio/wav', mp3: 'audio/mp3', m4a: 'audio/mp4', webm: 'audio/webm', ogg: 'audio/ogg', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf' };
  return table[ext] || (type === 'audio' ? 'audio/wav' : 'image/jpeg');
}

async function lireAvec(apiKey: string, consigne: string, mime: string, donnees: string, maxSortie = 2048): Promise<string | null> {
  for (const modele of MODELES) {
    try {
      const r = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: consigne }, { inline_data: { mime_type: mime, data: donnees } }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: maxSortie, thinkingConfig: { thinkingBudget: 0 } },
        }),
        signal: AbortSignal.timeout(40_000),
      });
      if (!r.ok) { console.error(`pieces ${modele}: HTTP ${r.status}`); continue; }
      const corps = await r.json();
      const t = (corps?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('').trim();
      if (t) return t;
    } catch (e) { console.error(`pieces ${modele}: ${(e as Error).message}`); }
  }
  return null;
}

// Transcrire une phrase dite à Léo (Jarvis V0, legion-jarvis) : vite
// d'abord (OpenAI), Gemini en relais. L'audio arrive en base64 et n'est
// gardé nulle part.
export async function transcrireVocal(apiKey: string, base64: string, mime: string): Promise<string | null> {
  const o = await transcrire({ mime, donnees: base64 }, { fn: null, delaiMs: 20_000 });
  if ('texte' in o && o.texte.trim()) return o.texte.trim().slice(0, 600);
  const t = apiKey ? await lireAvec(apiKey, "Transcris fidèlement cette phrase dite à voix haute, dans la langue parlée. Rends seulement le texte dit, sans commentaire. S'il n'y a rien d'audible, rends « (inaudible) ».", mime, base64, 400) : null;
  return t ? t.trim().slice(0, 600) : null;
}

// Le texte d'un fichier de travail (Excel, CSV, texte, PDF). `max` signes au
// plus: 14 000 pour une pièce jointe, bien plus pour un document de
// l'entreprise (0179).
export async function texteDeFichier(apiKey: string, octets: Uint8Array, nom: string, mime: string, max = 14_000): Promise<string | null> {
  const ext = String(nom || '').split('?')[0].split('.').pop()?.toLowerCase() || '';
  if (octets.length > 15 * 1024 * 1024) return null;
  if (['xlsx', 'xls', 'csv'].includes(ext) || /spreadsheet|excel|csv/.test(mime)) return classeurEnTexte(octets, max, max > 14_000 ? 5000 : 300);
  if (ext === 'txt' || ext === 'md' || mime.startsWith('text/')) return new TextDecoder().decode(octets).slice(0, max);
  if (ext === 'pdf' || mime === 'application/pdf') {
    const t = await lireAvec(apiKey, "Recopie fidèlement le contenu de ce document pour une équipe qui ne le voit pas : tout le texte, dans l'ordre, et chaque tableau en lignes CSV (séparateur virgule). Les chiffres exactement comme écrits. Pas de résumé, pas de commentaire.", 'application/pdf', enBase64(octets), max > 14_000 ? 32_768 : 8192);
    return t ? t.slice(0, max) : null;
  }
  return null;
}

// Rend les pièces complétées (ou null si rien n'a changé) et un texte à
// joindre au message pour les agents.
// vite (appel vocal, 24/09 : Beau attendait près d'une minute) : OpenAI
// transcrit d'abord (quelques secondes), Google seulement s'il échoue.
export async function comprendrePieces(apiKey: string, meta: Record<string, unknown> | null, opts: { vite?: boolean } = {}): Promise<{ pieces: Piece[] | null; texte: string }> {
  const pieces = Array.isArray((meta as { pieces?: unknown } | null)?.pieces) ? ((meta as { pieces: Piece[] }).pieces).map((p) => ({ ...p })) : [];
  if (!pieces.length) return { pieces: null, texte: '' };
  let change = false;
  const morceaux: string[] = [];
  for (const p of pieces) {
    if (p.type === 'audio' && !p.transcription && p.url) {
      try {
        const r = await fetch(p.url, { signal: AbortSignal.timeout(20_000) });
        if (r.ok) {
          const octets = new Uint8Array(await r.arrayBuffer());
          if (octets.length <= 15 * 1024 * 1024) {
            const mime = mimeDe(p.url, r, 'audio');
            let t: string | null = null;
            if (opts.vite) {
              const o = await transcrire({ mime, donnees: octets }, { fn: null });
              if ('texte' in o) t = o.texte;
            }
            if (!t) t = await lireAvec(apiKey, "Transcris fidèlement ce message vocal, dans la langue parlée. Rends seulement le texte dit, sans commentaire. S'il n'y a rien d'audible, rends « (inaudible) ».", mime, enBase64(octets));
            // Google en échec (plafond de dépenses du 24/09…) : OpenAI
            // transcrit à sa place (Beau : « si Gemini ne donne pas les
            // messages vocaux, OpenAI peut »). Le coût va au compteur de la
            // requête (compter() de cout.ts), comme celui de Gemini.
            if (!t && !opts.vite) {
              const o = await transcrire({ mime, donnees: octets }, { fn: null });
              if ('texte' in o) t = o.texte;
              else console.error('audio (relais):', o.erreur);
            }
            if (t) { p.transcription = t.slice(0, 4000); change = true; }
          }
        }
      } catch (e) { console.error('audio:', (e as Error).message); }
    }
    if (p.type === 'image' && !p.description && p.url) {
      try {
        const r = await fetch(p.url, { signal: AbortSignal.timeout(20_000) });
        if (r.ok) {
          const octets = new Uint8Array(await r.arrayBuffer());
          if (octets.length <= 15 * 1024 * 1024) {
            const t = await lireAvec(apiKey, "Décris cette image pour une équipe de travail qui ne la voit pas : ce qu'elle montre, tout le texte et tous les chiffres visibles (recopiés exactement), les tableaux ligne par ligne. Pas d'interprétation, pas de supposition sur les personnes.", mimeDe(p.url, r, 'image'), enBase64(octets));
            if (t) { p.description = t.slice(0, 4000); change = true; }
          }
        }
      } catch (e) { console.error('image:', (e as Error).message); }
    }
    // Un fichier de travail (23/09, « connecter mes agents avec Excel ») :
    // Excel et CSV lus feuille par feuille, texte tel quel, PDF recopié par le
    // modèle (texte et tableaux). Rangé dans la pièce : jamais relu deux fois.
    if (p.type === 'fichier' && !p.texte && p.url) {
      try {
        const r = await fetch(p.url, { signal: AbortSignal.timeout(20_000) });
        if (r.ok) {
          const octets = new Uint8Array(await r.arrayBuffer());
          const t = await texteDeFichier(apiKey, octets, String(p.nom || p.url), p.mime || mimeDe(p.url, r, 'fichier'));
          if (t) { p.texte = t.slice(0, 14_000); change = true; }
        }
      } catch (e) { console.error('fichier:', (e as Error).message); }
    }
    if (p.type === 'audio' && p.transcription) morceaux.push(`[Message vocal, transcrit] ${p.transcription}`);
    if (p.type === 'image' && p.description) morceaux.push(`[Photo jointe${p.nom ? ` « ${p.nom} »` : ''}] ${p.description}`);
    if (p.type === 'fichier' && p.texte) morceaux.push(`[Fichier joint « ${p.nom || 'sans nom'} »]\n${p.texte}`);
  }
  return { pieces: change ? pieces : null, texte: morceaux.join('\n\n') };
}

// Pour le fil de la conversation: le texte d'un message + ce que ses pièces
// contiennent déjà (sans rappeler le modèle).
export function texteAvecPieces(texte: string, meta: Record<string, unknown> | null, max = 1200): string {
  const pieces = Array.isArray((meta as { pieces?: unknown } | null)?.pieces) ? (meta as { pieces: Piece[] }).pieces : [];
  const extra = pieces.map((p) => p.transcription ? `[vocal] ${p.transcription}` : p.description ? `[photo] ${p.description}` : p.texte ? `[fichier ${p.nom || ''}] ${p.texte}` : '').filter(Boolean).join(' ');
  const base = (texte === '🎤' || texte === '📷' || texte === '📎') && extra ? '' : texte;
  return `${base}${base && extra ? ' ' : ''}${extra}`.slice(0, max);
}
