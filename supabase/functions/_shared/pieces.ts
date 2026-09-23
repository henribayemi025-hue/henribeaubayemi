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

// Rend les pièces complétées (ou null si rien n'a changé) et un texte à
// joindre au message pour les agents.
export async function comprendrePieces(apiKey: string, meta: Record<string, unknown> | null): Promise<{ pieces: Piece[] | null; texte: string }> {
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
            const t = await lireAvec(apiKey, "Transcris fidèlement ce message vocal, dans la langue parlée. Rends seulement le texte dit, sans commentaire. S'il n'y a rien d'audible, rends « (inaudible) ».", mimeDe(p.url, r, 'audio'), enBase64(octets));
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
          const ext = String(p.nom || p.url).split('?')[0].split('.').pop()?.toLowerCase() || '';
          const mime = p.mime || mimeDe(p.url, r, 'fichier');
          let t: string | null = null;
          if (octets.length > 15 * 1024 * 1024) t = null;
          else if (['xlsx', 'xls', 'csv'].includes(ext) || /spreadsheet|excel|csv/.test(mime)) t = classeurEnTexte(octets);
          else if (ext === 'txt' || mime.startsWith('text/')) t = new TextDecoder().decode(octets);
          else if (ext === 'pdf' || mime === 'application/pdf') {
            t = await lireAvec(apiKey, "Recopie fidèlement le contenu de ce document pour une équipe qui ne le voit pas : tout le texte, dans l'ordre, et chaque tableau en lignes CSV (séparateur virgule). Les chiffres exactement comme écrits. Pas de résumé, pas de commentaire.", 'application/pdf', enBase64(octets), 8192);
          }
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
