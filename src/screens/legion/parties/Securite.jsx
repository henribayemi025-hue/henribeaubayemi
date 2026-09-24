import { useCallback, useEffect, useState } from 'react';
import { IconShieldCheck, IconUsers } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

// LEGION — la sécurité à l'écran (0189, idées 48, 104 et 109 des 200, 24/09).

// Les membres et leur rôle. Le propriétaire fait d'un membre un « lecteur »
// (il lit tout, n'écrit rien) ou l'inverse ; la base s'y tient d'elle-même.
export function Membres({ entreprise, moi, t }) {
  const [liste, setListe] = useState(null);
  const [erreur, setErreur] = useState('');
  const proprietaire = entreprise.owner_id === moi?.user_id;
  const charger = useCallback(async () => {
    const { data } = await supabase.rpc('legion_membres_liste', { p_entreprise: entreprise.id });
    setListe(data || []);
  }, [entreprise.id]);
  useEffect(() => { charger(); }, [charger]);
  async function changer(u, role) {
    setErreur('');
    const { error } = await supabase.rpc('legion_changer_role', { p_entreprise: entreprise.id, p_user: u, p_role: role });
    if (error) setErreur(error.message); else charger();
  }
  if (!liste) return null;
  return (
    <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5">
      <h3 className="flex items-center gap-2 border-b border-legion-line pb-3 text-caption font-bold text-legion-ink">
        <IconUsers size={15} className="text-legion-gold" /> {t('legion.securite.membres', { n: liste.length })}
      </h3>
      <ul className="space-y-1.5 text-caption">
        {liste.map((m) => (
          <li key={m.user_id} className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-legion-ink">{m.nom}{m.user_id === moi?.user_id ? ` (${t('legion.securite.toi')})` : ''}</span>
            {proprietaire && m.role !== 'proprietaire' ? (
              <select value={m.role} onChange={(e) => changer(m.user_id, e.target.value)}
                className="rounded-input border border-legion-line bg-legion-bg px-1.5 py-0.5 text-[16px] text-legion-ink sm:text-[12px]">
                <option value="membre">{t('legion.securite.role.membre')}</option>
                <option value="lecteur">{t('legion.securite.role.lecteur')}</option>
              </select>
            ) : <span className="shrink-0 text-[12px] text-legion-muted">{t(`legion.securite.role.${m.role}`)}</span>}
          </li>
        ))}
      </ul>
      <p className="text-[11px] leading-snug text-legion-muted">{t('legion.securite.rolesAide')}</p>
      {erreur && <p className="text-[11px] text-legion-danger">{erreur}</p>}
    </section>
  );
}

// Le journal inaltérable et signé des décisions, et « Vérifier ».
const NOM_GENRE = { decision: '⚖️', compte_rendu: '📋', livrable: '📦', action: '✅' };
export function Journal({ entreprise, agents, t }) {
  const [lignes, setLignes] = useState(null);
  const [textes, setTextes] = useState({});
  const [verif, setVerif] = useState(null);
  const [occupe, setOccupe] = useState(false);
  useEffect(() => {
    let vivant = true;
    (async () => {
      const { data } = await supabase.from('legion_journal').select('id, message_id, auteur_id, genre, empreinte, created_at').eq('entreprise_id', entreprise.id).order('id', { ascending: false }).limit(8);
      if (!vivant) return;
      setLignes(data || []);
      const ids = (data || []).map((x) => x.message_id);
      if (ids.length) {
        const { data: m } = await supabase.from('legion_messages').select('id, texte').in('id', ids);
        if (vivant) setTextes(Object.fromEntries((m || []).map((x) => [x.id, x.texte])));
      }
    })();
    return () => { vivant = false; };
  }, [entreprise.id]);
  async function verifier() {
    setOccupe(true);
    const { data } = await supabase.rpc('legion_verifier_journal', { p_entreprise: entreprise.id });
    setOccupe(false);
    setVerif(data || null);
  }
  if (!lignes) return null;
  const nomDe = (id) => agents.find((a) => a.id === id)?.nom || '—';
  const intact = verif && verif.chaine_intacte && verif.signatures_ok && !verif.modifies?.length && !verif.disparus?.length;
  return (
    <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5">
      <div className="flex items-center justify-between gap-2 border-b border-legion-line pb-3">
        <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink"><IconShieldCheck size={15} className="text-legion-gold" /> {t('legion.securite.journal')}</h3>
        <button type="button" onClick={verifier} disabled={occupe} className="rounded-pill bg-legion-gold px-3 py-1 text-[12px] font-semibold text-legion-bg disabled:opacity-50">{occupe ? '…' : t('legion.securite.verifier')}</button>
      </div>
      <p className="text-[11px] leading-snug text-legion-muted">{t('legion.securite.journalAide')}</p>
      {verif && (
        <div className={`rounded-card border p-2.5 text-[12px] ${intact ? 'border-legion-success/40 bg-legion-success/10 text-legion-success' : 'border-legion-danger/40 bg-legion-danger/10 text-legion-danger'}`}>
          {intact ? t('legion.securite.intact', { n: verif.entrees }) : (
            <ul className="space-y-0.5">
              {!verif.chaine_intacte && <li>{t('legion.securite.rupture')}</li>}
              {!verif.signatures_ok && <li>{t('legion.securite.signature')}</li>}
              {verif.modifies?.length > 0 && <li>{t('legion.securite.modifies', { count: verif.modifies.length })}</li>}
              {verif.disparus?.length > 0 && <li>{t('legion.securite.disparus', { count: verif.disparus.length })}</li>}
            </ul>
          )}
        </div>
      )}
      {lignes.length === 0 ? <p className="text-caption text-legion-muted">{t('legion.securite.vide')}</p> : (
        <ul className="space-y-1.5">
          {lignes.map((l) => (
            <li key={l.id} className="rounded-card border border-legion-line bg-legion-card px-2.5 py-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px] text-legion-muted">
                <span>{NOM_GENRE[l.genre]} {t(`legion.securite.genre.${l.genre}`)} · {nomDe(l.auteur_id)}</span>
                <span className="font-mono" title={l.empreinte}>#{l.empreinte.slice(0, 10)}</span>
              </div>
              <p className="line-clamp-1 text-caption text-legion-ink">{String(textes[l.message_id] || '').replace(/[#*_]/g, '').slice(0, 160)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
