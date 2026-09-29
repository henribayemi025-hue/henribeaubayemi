import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

// LÉO — le crédit offert, « Passer à Premium », « Nous contacter », « Une
// suggestion » (Beau, 29/09 : « si quelqu'un n'a plus de crédit, qu'il passe
// au premium ; dès que quelqu'un clique je suis au courant » ; « il doit
// pouvoir nous contacter s'il veut un truc » ; « que les gens ajoutent des
// suggestions »). Chaque envoi part à l'équipe par e-mail (leo-contact) :
// « Répondre » dans la boîte mail répond à la personne.
//
// Le crédit offert (0221) : ce que Finjaro offre chaque mois à une
// entreprise qui n'est pas Premium ; épuisé, les agents s'arrêtent.

export function CreditEtContact({ entreprise, t }) {
  const [depense, setDepense] = useState(null);
  const [ouvert, setOuvert] = useState(null); // 'premium' | 'contact' | 'suggestion'
  const [texte, setTexte] = useState('');
  const [etat, setEtat] = useState(null); // null | 'envoi' | 'ok' | message d'erreur

  const charger = useCallback(async () => {
    const { data } = await supabase.rpc('legion_depense_mois', { p_entreprise: entreprise.id });
    setDepense(data ? Number(data.total_eur || 0) : null);
  }, [entreprise.id]);
  useEffect(() => { charger(); }, [charger]);

  const premium = !!entreprise.premium;
  const credit = Number(entreprise.credit_offert_eur ?? 2);
  const epuise = !premium && depense != null && depense >= credit;
  const part = !premium && depense != null ? Math.min(100, (depense / credit) * 100) : 0;
  const euros = (n) => `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

  async function envoyer(e) {
    e.preventDefault();
    if (ouvert !== 'premium' && texte.trim().length < 3) return;
    setEtat('envoi');
    const { data, error } = await supabase.functions.invoke('leo-contact', {
      body: { genre: ouvert, message: texte.trim(), entreprise_id: entreprise.id },
    });
    if (error || data?.erreur) { setEtat(data?.erreur || t('legion.contact.erreur', 'L’envoi n’a pas marché. Réessaie dans un instant.')); return; }
    setEtat('ok');
    setTexte('');
  }

  const bouton = (k, emoji, libelle) => (
    <button key={k} type="button" onClick={() => { setOuvert(ouvert === k ? null : k); setEtat(null); }}
      className={`flex shrink-0 items-center gap-2 rounded-card border px-3.5 py-2.5 text-caption font-semibold transition ${ouvert === k ? 'border-legion-gold bg-legion-gold/10 text-legion-ink' : 'border-legion-line bg-legion-panel text-legion-ink hover:border-legion-gold/50'}`}>
      <span className="text-[18px]">{emoji}</span> {libelle}
    </button>
  );

  return (
    <section className={`rounded-card border p-4 ${epuise ? 'border-legion-gold bg-legion-gold/10' : 'border-legion-line bg-legion-panel'}`}>
      {!premium && depense != null && (
        <div className="mb-3">
          <p className="text-caption font-semibold text-legion-ink">
            {epuise
              ? t('legion.contact.epuise', 'Le crédit offert ce mois-ci est épuisé : tes agents sont en pause jusqu’au mois prochain.')
              : t('legion.contact.credit', { defaultValue: 'Crédit offert par Finjaro ce mois-ci : {{d}} sur {{c}}', d: euros(depense), c: euros(credit) })}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-legion-line">
            <div className={`h-full rounded-full ${epuise ? 'bg-[#E0664F]' : 'bg-legion-gold'}`} style={{ width: `${part}%` }} />
          </div>
          {epuise && <p className="mt-2 text-[12px] text-legion-muted">{t('legion.contact.epuiseAide', 'Passe à Premium pour que ton équipe continue : l’équipe Finjaro te recontacte.')}</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!premium && bouton('premium', '⭐', t('legion.contact.premium', 'Passer à Premium'))}
        {bouton('contact', '✉️', t('legion.contact.contact', 'Nous contacter'))}
        {bouton('suggestion', '💡', t('legion.contact.suggestion', 'Une suggestion'))}
      </div>
      {ouvert && (
        <form onSubmit={envoyer} className="mt-3 space-y-2">
          <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={3} maxLength={4000}
            placeholder={ouvert === 'premium'
              ? t('legion.contact.premiumAide', 'Un mot pour l’équipe (facultatif) : ce dont ton entreprise a besoin.')
              : ouvert === 'suggestion'
                ? t('legion.contact.suggestionAide', 'Ton idée pour améliorer Léo.')
                : t('legion.contact.contactAide', 'Ta question ou ta demande : l’équipe Finjaro te répond par e-mail.')}
            className="w-full rounded-card border border-legion-line bg-legion-bg px-3 py-2 text-body text-legion-ink placeholder:text-legion-muted focus:border-legion-gold focus:outline-none" />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={etat === 'envoi'}
              className="rounded-pill bg-legion-gold px-4 py-1.5 text-caption font-bold text-legion-bg disabled:opacity-60">
              {etat === 'envoi' ? t('legion.contact.envoi', 'Envoi…') : ouvert === 'premium' ? t('legion.contact.demanderPremium', 'Demander Premium') : t('legion.contact.envoyer', 'Envoyer')}
            </button>
            {etat === 'ok' && <span className="text-[12px] font-semibold text-legion-success">{t('legion.contact.ok', 'Envoyé ✅ L’équipe Finjaro te répond par e-mail.')}</span>}
            {etat && etat !== 'ok' && etat !== 'envoi' && <span className="text-[12px] text-legion-danger">{etat}</span>}
          </div>
        </form>
      )}
    </section>
  );
}
