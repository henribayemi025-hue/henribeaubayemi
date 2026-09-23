import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconRoute, IconChevronLeft, IconChevronRight, IconMessage2, IconPlus, IconCheck } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { Visage } from './Visage';

// LEGION — la feuille de route: le trimestre, le mois, la semaine, le jour.
//
// Beau, 23/09: « un plan clair pour chaque jour, chaque semaine — avant
// samedi pour la semaine suivante »; « en forme de clic: quand une chose
// est faite je clique fait, puis je commente ». Chaque ligne se coche et se
// commente. Les lignes du jour viennent des règles qui se répètent
// (« publier chaque jour… »): chaque vendredi, la semaine suivante se
// prépare toute seule (legion_preparer_semaine, 0168).

const ONGLETS = [
  ['jour', 'Aujourd’hui'],
  ['semaine', 'Semaine'],
  ['mois', 'Mois'],
  ['trimestre', 'Trimestre'],
];
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const lundiDe = (d) => { const x = new Date(d); const j = (x.getDay() + 6) % 7; x.setDate(x.getDate() - j); return x; };
const plusJours = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export function FeuilleDeRoute({ entreprise, agents, langue, t }) {
  const [lignes, setLignes] = useState([]);
  const [onglet, setOnglet] = useState('jour');
  const [jour, setJour] = useState(() => new Date());
  const [commente, setCommente] = useState(null); // { id, texte }
  const [ajout, setAjout] = useState(null); // { titre, responsable }

  const charger = useCallback(async () => {
    const { data } = await supabase.from('legion_feuille').select('*')
      .eq('entreprise_id', entreprise.id).neq('horizon', 'recurrent').order('debut').order('ordre');
    setLignes(data || []);
  }, [entreprise.id]);
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => {
    const abo = supabase.channel(`feuille:${entreprise.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'legion_feuille', filter: `entreprise_id=eq.${entreprise.id}` }, () => charger())
      .subscribe();
    return () => { supabase.removeChannel(abo); };
  }, [entreprise.id, charger]);

  const agent = (id) => agents.find((a) => a.id === id) || null;
  const fmt = (d, o) => new Date(`${d}T12:00:00`).toLocaleDateString(langue, o);

  // Ce que montre chaque onglet.
  const vue = useMemo(() => {
    const aujourdhui = iso(jour);
    const lundi = iso(lundiDe(jour));
    const dimanche = iso(plusJours(lundiDe(jour), 6));
    const mois = aujourdhui.slice(0, 7);
    if (onglet === 'jour') return [{ titre: null, items: lignes.filter((l) => l.horizon === 'jour' && l.debut === aujourdhui) }];
    if (onglet === 'semaine') {
      const groupes = [{ titre: t('legion.feuilleCetteSemaine', 'Cette semaine'), items: lignes.filter((l) => l.horizon === 'semaine' && l.debut === lundi) }];
      for (let k = 0; k < 7; k += 1) {
        const j = iso(plusJours(lundiDe(jour), k));
        const items = lignes.filter((l) => l.horizon === 'jour' && l.debut === j);
        if (items.length) groupes.push({ titre: fmt(j, { weekday: 'long', day: 'numeric', month: 'long' }), items });
      }
      return groupes.filter((g) => g.items.length || g.titre === groupes[0].titre).map((g) => ({ ...g, periode: `${lundi} → ${dimanche}` }));
    }
    if (onglet === 'mois') {
      const suivant = iso(new Date(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)), 1)).slice(0, 7);
      return [mois, suivant].map((m) => ({ titre: fmt(`${m}-01`, { month: 'long', year: 'numeric' }), items: lignes.filter((l) => l.horizon === 'mois' && l.debut.slice(0, 7) === m) }));
    }
    return [{ titre: null, items: lignes.filter((l) => l.horizon === 'trimestre' || l.horizon === 'annee') }];
  }, [lignes, onglet, jour, t]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cocher(l) {
    const fait = !l.fait;
    setLignes((ls) => ls.map((x) => (x.id === l.id ? { ...x, fait } : x)));
    await supabase.from('legion_feuille').update({ fait, fait_le: fait ? new Date().toISOString() : null }).eq('id', l.id);
  }
  async function enregistrerCommentaire(e) {
    e.preventDefault();
    const { id, texte } = commente;
    setLignes((ls) => ls.map((x) => (x.id === id ? { ...x, commentaire: texte.trim() || null } : x)));
    setCommente(null);
    await supabase.from('legion_feuille').update({ commentaire: texte.trim() || null }).eq('id', id);
  }
  async function ajouter(e) {
    e.preventDefault();
    if (!ajout?.titre?.trim()) return;
    const debut = onglet === 'jour' ? iso(jour) : onglet === 'semaine' ? iso(lundiDe(jour)) : onglet === 'mois' ? `${iso(jour).slice(0, 7)}-01` : iso(jour);
    const horizon = onglet === 'trimestre' ? 'trimestre' : onglet;
    const { data } = await supabase.from('legion_feuille').insert({
      entreprise_id: entreprise.id, horizon, debut, titre: ajout.titre.trim(), responsable: ajout.responsable || null, ordre: 900,
    }).select().single();
    if (data) setLignes((ls) => [...ls, data]);
    setAjout(null);
  }

  const toutes = vue.flatMap((g) => g.items);
  const faites = toutes.filter((l) => l.fait).length;
  const personnes = agents;

  return (
    <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-legion-line pb-3">
        <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink">
          <IconRoute size={15} className="text-legion-gold" /> {t('legion.feuilleTitre', 'Feuille de route')}
          {toutes.length > 0 && <span className="font-mono text-[11px] font-normal text-legion-muted">{faites}/{toutes.length}</span>}
        </h3>
        <div className="flex gap-1">
          {ONGLETS.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setOnglet(k)}
              className={`rounded-pill px-2.5 py-1 text-[11px] font-semibold transition ${onglet === k ? 'bg-legion-gold text-legion-bg' : 'text-legion-muted hover:text-legion-ink'}`}>
              {t(`legion.feuille.${k}`, l)}
            </button>
          ))}
        </div>
      </div>

      {(onglet === 'jour' || onglet === 'semaine') && (
        <div className="flex items-center justify-between text-[12px] text-legion-muted">
          <button type="button" onClick={() => setJour((d) => plusJours(d, onglet === 'jour' ? -1 : -7))} aria-label="‹" className="rounded-full p-1 hover:text-legion-ink"><IconChevronLeft size={16} /></button>
          <span className="font-semibold capitalize text-legion-ink">
            {onglet === 'jour' ? fmt(iso(jour), { weekday: 'long', day: 'numeric', month: 'long' }) : `${fmt(iso(lundiDe(jour)), { day: 'numeric', month: 'short' })} → ${fmt(iso(plusJours(lundiDe(jour), 6)), { day: 'numeric', month: 'short' })}`}
          </span>
          <button type="button" onClick={() => setJour((d) => plusJours(d, onglet === 'jour' ? 1 : 7))} aria-label="›" className="rounded-full p-1 hover:text-legion-ink"><IconChevronRight size={16} /></button>
        </div>
      )}

      {vue.map((g, gi) => (
        <div key={gi} className="space-y-1.5">
          {g.titre && <p className="pt-1 text-[11px] font-semibold uppercase tracking-wider text-legion-gold first-letter:uppercase">{g.titre}</p>}
          {g.items.length === 0 && (
            <p className="text-[12px] text-legion-muted">{t('legion.feuilleVide', 'Rien de prévu ici.')}</p>
          )}
          {g.items.map((l) => {
            const a = agent(l.responsable);
            return (
              <div key={l.id} className={`rounded-card border px-3 py-2 transition ${l.fait ? 'border-legion-success/30 bg-legion-success/5' : 'border-legion-line bg-legion-card'}`}>
                <div className="flex items-start gap-2.5">
                  <button type="button" onClick={() => cocher(l)} aria-pressed={l.fait} title={l.fait ? t('legion.feuilleDefaire', 'Pas encore fait') : t('legion.feuilleFait', 'Fait')}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${l.fait ? 'border-legion-success bg-legion-success text-white' : 'border-legion-line hover:border-legion-gold'}`}>
                    {l.fait && <IconCheck size={13} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] leading-snug ${l.fait ? 'text-legion-muted line-through' : 'text-legion-ink'}`}>{l.titre}</p>
                    {l.detail && <p className="text-[11px] text-legion-muted">{l.detail}</p>}
                    {l.commentaire && commente?.id !== l.id && <p className="mt-1 rounded-input bg-legion-bg px-2 py-1 text-[11px] italic text-legion-ink">💬 {l.commentaire}</p>}
                    {commente?.id === l.id && (
                      <form onSubmit={enregistrerCommentaire} className="mt-1.5 flex gap-1.5">
                        <input autoFocus value={commente.texte} onChange={(e) => setCommente({ ...commente, texte: e.target.value })} maxLength={500}
                          placeholder={t('legion.feuilleCommentaire', 'Ton commentaire…')} className="min-w-0 flex-1 rounded-input border border-legion-line bg-legion-bg px-2 py-1 text-[12px] text-legion-ink outline-none focus:border-legion-gold" />
                        <button type="submit" className="rounded-input bg-legion-gold px-2 text-[11px] font-semibold text-legion-bg">OK</button>
                      </form>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {a && <span title={a.nom} className="flex items-center gap-1 text-[11px] text-legion-muted"><Visage a={a} taille={20} point={false} /><span className="hidden sm:inline">{a.nom}</span></span>}
                    <button type="button" onClick={() => setCommente({ id: l.id, texte: l.commentaire || '' })} title={t('legion.feuilleCommenter', 'Commenter')}
                      className="rounded-full p-1 text-legion-muted hover:text-legion-gold"><IconMessage2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {ajout ? (
        <form onSubmit={ajouter} className="flex flex-wrap gap-1.5">
          <input autoFocus value={ajout.titre} onChange={(e) => setAjout({ ...ajout, titre: e.target.value })} maxLength={200}
            placeholder={t('legion.feuilleNouveau', 'Ce qu’il faut faire…')} className="min-w-0 flex-1 rounded-input border border-legion-line bg-legion-bg px-2.5 py-1.5 text-[12px] text-legion-ink outline-none focus:border-legion-gold" />
          <select value={ajout.responsable || ''} onChange={(e) => setAjout({ ...ajout, responsable: e.target.value })}
            className="rounded-input border border-legion-line bg-legion-bg px-2 py-1.5 text-[12px] text-legion-ink">
            <option value="">{t('legion.feuilleQui', 'Qui ?')}</option>
            {personnes.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
          <button type="submit" className="rounded-input bg-legion-gold px-3 text-[12px] font-semibold text-legion-bg">{t('common.add', 'Ajouter')}</button>
        </form>
      ) : (
        <button type="button" onClick={() => setAjout({ titre: '', responsable: '' })} className="flex items-center gap-1 text-[12px] font-semibold text-legion-gold hover:brightness-110">
          <IconPlus size={14} /> {t('legion.feuilleAjouter', 'Ajouter une ligne')}
        </button>
      )}
    </section>
  );
}
