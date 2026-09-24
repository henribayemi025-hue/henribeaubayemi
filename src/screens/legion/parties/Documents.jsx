import { useCallback, useEffect, useRef, useState } from 'react';
import { IconFileText, IconTrash, IconUpload, IconCopy, IconCheck, IconInbox } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { DeposerRessource } from './DeposerRessource';

// LES DOCUMENTS DE L'ENTREPRISE, ET LE TRI DES DEMANDES CLIENTS (0179, 23/09).
//
// La vidéo « service client automatisé » de Beau : les documents deviennent
// une base de connaissances ; un message reçu est trié ; pour une demande
// client, la réponse est préparée À PARTIR des documents. Ici on dépose ou
// on colle les documents (conditions de vente, FAQ, tarifs, procédures) ;
// les agents s'en servent dans les salons et citent leur source. Et on colle
// un message reçu : Legion le trie et prépare un BROUILLON — rien ne part
// sans toi (pas de boîte mail branchée : ⏸ projet Google).

const MIMES = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xls: 'application/vnd.ms-excel', csv: 'text/csv', txt: 'text/plain' };

export function Documents({ entreprise, t }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState(null);
  const [occupe, setOccupe] = useState('');
  const [erreur, setErreur] = useState('');
  const [titreTexte, setTitreTexte] = useState('');
  const [texte, setTexte] = useState('');
  const [demande, setDemande] = useState('');
  const [tri, setTri] = useState(null);
  const [copie, setCopie] = useState(false);
  const fichier = useRef(null);

  const charger = useCallback(async () => {
    const { data } = await supabase.from('legion_documents').select('id, titre, url, statut, morceaux, erreur, created_at').eq('entreprise_id', entreprise.id).order('created_at', { ascending: false });
    setDocs(data || []);
    return data || [];
  }, [entreprise.id]);
  // Les documents déposés pour l'équipe sans passer par cet écran (le
  // vestiaire d'entraînement de Beau, 24/09, rangé par Claude) attendent
  // « à lire » : ils sont lus ici, une fois, avec le compte de la personne.
  const dejaLances = useRef(new Set());
  useEffect(() => {
    let fini = false;
    (async () => {
      const liste = await charger();
      // Et ceux que le plafond de Google a fait échouer : on réessaie, pour
      // qu'ils se rangent d'eux-mêmes dès que le plafond est relevé.
      const reessayer = (d) => (d.statut === 'echec' && /429|spending cap|plafond/i.test(d.erreur || '')) || (d.statut === 'lu' && /sans vecteurs/.test(d.erreur || ''));
      const enAttente = liste.filter((d) => (d.statut === 'a_lire' || reessayer(d)) && d.url && !dejaLances.current.has(d.id));
      for (const d of enAttente) {
        if (fini) return;
        dejaLances.current.add(d.id);
        await supabase.functions.invoke('legion-documents', { body: { action: 'lire', document_id: d.id } });
      }
      if (enAttente.length && !fini) await charger();
    })();
    return () => { fini = true; };
  }, [charger]);

  // Déposer, enregistrer, puis faire lire (découpe et vecteurs côté serveur).
  async function ajouter(blob, nom, ext) {
    setErreur(''); setOccupe('ajout');
    try {
      const chemin = `${entreprise.id}/documents/${crypto.randomUUID()}.${ext}`;
      const { error: e1 } = await supabase.storage.from('legion').upload(chemin, blob, { contentType: MIMES[ext], upsert: false });
      if (e1) throw e1;
      const url = supabase.storage.from('legion').getPublicUrl(chemin).data.publicUrl;
      const { data: doc, error: e2 } = await supabase.from('legion_documents').insert({
        entreprise_id: entreprise.id, titre: nom.slice(0, 120), url, mime: MIMES[ext], ajoute_par: user.id,
      }).select().single();
      if (e2) throw e2;
      setDocs((d) => [doc, ...(d || [])]);
      const { data: r, error: e3 } = await supabase.functions.invoke('legion-documents', { body: { action: 'lire', document_id: doc.id } });
      if (e3 || r?.erreur) setErreur(r?.erreur || e3?.message || t('errors.generic'));
      await charger();
    } catch (e) { setErreur(e.message || t('errors.generic')); }
    finally { setOccupe(''); }
  }

  async function fichierChoisi(e) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!MIMES[ext]) { setErreur(t('legion.docs.formats')); return; }
    if (f.size > 10 * 1024 * 1024) { setErreur(t('legion.tropLourd', 'Trop lourd: 10 Mo au plus.')); return; }
    await ajouter(f, f.name.replace(/\.[^.]+$/, ''), ext);
  }

  async function collerTexte(e) {
    e.preventDefault();
    if (texte.trim().length < 20 || !titreTexte.trim()) return;
    await ajouter(new Blob([texte], { type: 'text/plain' }), titreTexte.trim(), 'txt');
    setTexte(''); setTitreTexte('');
  }

  async function retirer(doc) {
    if (!window.confirm(t('legion.docs.retirerConfirmer', { titre: doc.titre }))) return;
    const { error } = await supabase.from('legion_documents').delete().eq('id', doc.id);
    if (error) setErreur(error.message); else setDocs((d) => d.filter((x) => x.id !== doc.id));
  }

  // La fiche d'une ressource déposée (vestiaire, 24/09) arrive « à lire » :
  // elle apparaît tout de suite dans la liste, puis on la fait lire, comme
  // un document déposé à la main.
  async function ficheRangee(id) {
    await charger();
    if (!id || dejaLances.current.has(id)) return;
    dejaLances.current.add(id);
    await supabase.functions.invoke('legion-documents', { body: { action: 'lire', document_id: id } });
    await charger();
  }

  async function trier(e) {
    e.preventDefault();
    if (demande.trim().length < 3) return;
    setErreur(''); setTri(null); setOccupe('tri');
    const { data: r, error } = await supabase.functions.invoke('legion-documents', { body: { action: 'trier', entreprise_id: entreprise.id, demande } });
    setOccupe('');
    if (error || r?.erreur) { setErreur(r?.erreur || error?.message || t('errors.generic')); return; }
    setTri(r);
  }

  const lus = (docs || []).filter((d) => d.statut === 'lu').length;
  const champ = 'w-full rounded-input border border-legion-line bg-legion-bg px-3 py-2 text-[15px] text-legion-ink placeholder:text-legion-muted focus:border-legion-gold focus:outline-none';

  return (
    <section className="rounded-card border border-legion-line bg-legion-card p-4">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-legion-ink"><IconFileText size={18} className="text-legion-gold" /> {t('legion.docs.titre')}</h3>
      <p className="mt-1 text-[12.5px] leading-snug text-legion-muted">{t('legion.docs.aide')}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => fichier.current?.click()} disabled={!!occupe}
          className="inline-flex items-center gap-1.5 rounded-pill bg-legion-gold px-3 py-1.5 text-[13px] font-semibold text-legion-bg disabled:opacity-50">
          <IconUpload size={15} /> {occupe === 'ajout' ? t('legion.docs.lecture') : t('legion.docs.deposer')}
        </button>
        <input ref={fichier} type="file" accept=".pdf,.xlsx,.xls,.csv,.txt" className="hidden" onChange={fichierChoisi} />
      </div>
      <form onSubmit={collerTexte} className="mt-2 space-y-1.5">
        <input value={titreTexte} onChange={(e) => setTitreTexte(e.target.value)} maxLength={120} placeholder={t('legion.docs.titreTexte')} className={champ} />
        <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={3} maxLength={200000} placeholder={t('legion.docs.coller')} className={`${champ} resize-y`} />
        <button type="submit" disabled={!!occupe || texte.trim().length < 20 || !titreTexte.trim()}
          className="rounded-pill border border-legion-line px-3 py-1.5 text-[13px] font-semibold text-legion-ink disabled:opacity-40">{t('legion.docs.ajouterTexte')}</button>
      </form>

      {docs && docs.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 rounded-input bg-legion-bg px-2.5 py-2">
              <span className="min-w-0">
                <a href={d.url || undefined} target="_blank" rel="noreferrer" className="block truncate text-[13.5px] font-semibold text-legion-ink underline-offset-2 hover:underline">{d.titre}</a>
                <span className={`block text-[11.5px] ${d.statut === 'echec' ? 'text-legion-danger' : 'text-legion-muted'}`}>
                  {d.statut === 'lu' ? t('legion.docs.lu', { n: d.morceaux }) : d.statut === 'echec' ? `${t('legion.docs.echec')} ${d.erreur || ''}` : t('legion.docs.aLire')}
                </span>
              </span>
              <button type="button" onClick={() => retirer(d)} aria-label={t('legion.docs.retirer')} className="shrink-0 rounded-full p-1.5 text-legion-muted hover:text-legion-danger"><IconTrash size={16} /></button>
            </li>
          ))}
        </ul>
      )}

      {/* Une ressource pour entraîner les agents : Mentor en fait la fiche (24/09) */}
      <DeposerRessource entreprise={entreprise} onFiche={ficheRangee} t={t} />

      {/* Le tri d'une demande reçue (J2) */}
      <div className="mt-5 border-t border-legion-line pt-4">
        <h4 className="flex items-center gap-2 text-[14px] font-semibold text-legion-ink"><IconInbox size={17} className="text-legion-gold" /> {t('legion.docs.triTitre')}</h4>
        <p className="mt-1 text-[12.5px] leading-snug text-legion-muted">{lus ? t('legion.docs.triAide') : t('legion.docs.triSansDocs')}</p>
        <form onSubmit={trier} className="mt-2 space-y-1.5">
          <textarea value={demande} onChange={(e) => setDemande(e.target.value)} rows={3} maxLength={6000} placeholder={t('legion.docs.triExemple')} className={`${champ} resize-y`} />
          <button type="submit" disabled={!!occupe || demande.trim().length < 3}
            className="rounded-pill bg-legion-accent px-3.5 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40">{occupe === 'tri' ? t('legion.docs.triEnCours') : t('legion.docs.trier')}</button>
        </form>
        {tri && (
          <div className="mt-3 space-y-2 rounded-card border border-legion-line bg-legion-bg p-3 text-[13.5px]">
            <p className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded-pill px-2 py-0.5 text-[11.5px] font-semibold ${tri.categorie === 'demande_client' ? 'bg-legion-gold text-legion-bg' : 'bg-legion-card text-legion-muted'}`}>{t(`legion.docs.cat_${tri.categorie}`)}</span>
              {tri.categorie === 'demande_client' && <span className={`rounded-pill px-2 py-0.5 text-[11.5px] font-semibold ${tri.urgence === 'haute' ? 'bg-legion-danger/15 text-legion-danger' : 'bg-legion-card text-legion-muted'}`}>{t(`legion.docs.urgence_${tri.urgence}`)}</span>}
              <span className="text-legion-ink">{tri.sujet}</span>
            </p>
            {tri.brouillon && (
              <div>
                <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.docs.brouillon')}</p>
                <p className="whitespace-pre-wrap rounded-input bg-legion-card p-2.5 text-legion-ink">{tri.brouillon}</p>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(tri.brouillon).catch(() => {}); setCopie(true); setTimeout(() => setCopie(false), 1500); }}
                  className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-legion-gold">
                  {copie ? <IconCheck size={14} /> : <IconCopy size={14} />} {copie ? t('legion.copie', 'Copié') : t('legion.docs.copier')}
                </button>
              </div>
            )}
            {tri.manque && <p className="text-[12.5px] text-legion-muted"><b className="text-legion-ink">{t('legion.docs.manque')}</b> {tri.manque}</p>}
            {tri.sources?.length > 0 && (
              <p className="text-[12.5px] text-legion-muted">🔗 {t('legion.sources', 'Sources')} : {tri.sources.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer" className="underline">{s.titre}</a>).reduce((a, b) => [a, ', ', b])}</p>
            )}
          </div>
        )}
      </div>
      {erreur && <p className="mt-2 text-[12.5px] text-legion-danger">{erreur}</p>}
    </section>
  );
}
