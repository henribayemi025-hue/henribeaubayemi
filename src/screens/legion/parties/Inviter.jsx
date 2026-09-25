import { useState } from 'react';
import { IconUserPlus, IconCopy, IconBrandWhatsapp, IconCheck } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

// LEGION — inviter quelqu'un dans l'entreprise (plan complet, B7).
//
// Beau: « plusieurs humains peuvent travailler dessus, sur le même truc. »
// Le propriétaire crée un lien (7 jours, une personne); il l'envoie par
// WhatsApp ou le copie. Celui qui l'ouvre se connecte, voit qui l'invite,
// et rejoint (écran Rejoindre, fonction legion_rejoindre).

export function Inviter({ entreprise, t }) {
  const [lien, setLien] = useState('');
  const [busy, setBusy] = useState(false);
  const [copie, setCopie] = useState(false);
  const [erreur, setErreur] = useState('');

  async function creer() {
    setBusy(true); setErreur('');
    const { data, error } = await supabase.rpc('legion_inviter', { p_entreprise: entreprise.id });
    setBusy(false);
    if (error) { setErreur(error.message); return; }
    setLien(`${window.location.origin}/legion/rejoindre/${data}`);
  }
  async function copier() {
    try { await navigator.clipboard.writeText(lien); setCopie(true); setTimeout(() => setCopie(false), 1500); } catch { /* le lien reste affiché, sélectionnable */ }
  }
  const texte = t('legion.inviterMessage', { nom: entreprise.nom, defaultValue: 'Rejoins « {{nom}} » sur Léo, l’équipe d’agents de Finjaro :' });

  return (
    <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5">
      <div className="border-b border-legion-line pb-3">
        <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink">
          <IconUserPlus size={15} className="text-legion-gold" /> {t('legion.inviterTitre', 'Inviter quelqu’un')}
        </h3>
      </div>
      <p className="text-[12px] leading-snug text-legion-muted">{t('legion.inviterAide', 'Un collègue, un associé : il lit les salons, parle aux agents et suit les tâches. Le lien sert une fois et dure 7 jours.')}</p>
      {!lien ? (
        <button type="button" onClick={creer} disabled={busy}
          className="w-full rounded-pill bg-legion-gold px-3 py-2 text-[12px] font-semibold text-legion-bg disabled:opacity-60">
          {busy ? '…' : t('legion.inviterBouton', 'Créer un lien d’invitation')}
        </button>
      ) : (
        <div className="space-y-2">
          <input readOnly value={lien} onFocus={(e) => e.target.select()} className="input w-full text-[12px]" />
          <div className="flex gap-2">
            <button type="button" onClick={copier} className="flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-legion-line px-3 py-2 text-[12px] font-semibold text-legion-ink">
              {copie ? <IconCheck size={14} /> : <IconCopy size={14} />} {copie ? t('legion.copie', 'Copié') : t('legion.copier', 'Copier')}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${texte} ${lien}`)}`} target="_blank" rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-legion-success/20 px-3 py-2 text-[12px] font-semibold text-legion-success">
              <IconBrandWhatsapp size={14} /> WhatsApp
            </a>
          </div>
          <button type="button" onClick={() => setLien('')} className="w-full text-[11px] text-legion-muted">{t('legion.autreInvitation', 'Un autre lien pour une autre personne')}</button>
        </div>
      )}
      {erreur && <p className="text-[11px] text-legion-danger">{erreur}</p>}
    </section>
  );
}
