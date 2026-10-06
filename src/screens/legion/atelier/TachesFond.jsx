import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

// « Tâches en arrière-plan » (C8) et tâches de code des agents visibles dans
// l'atelier (C10) — relevé du 25/09. Quand un agent code après « Confirmer »
// (legion-code), son travail se déroulait hors de l'atelier : on ne voyait
// que le message final dans un salon. Ici, l'atelier montre chaque tâche de
// code de l'entreprise, en cours ou finie, avec la branche et la demande de
// fusion. Relu toutes les 20 secondes tant que le panneau est ouvert.
const COULEUR = { en_cours: 'text-legion-gold', faite: 'text-legion-success', echec: 'text-legion-danger', a_confirmer: 'text-legion-muted', annulee: 'text-legion-muted' };

export function lignesTaches(messages, noms) {
  return (messages || [])
    .filter((m) => m?.meta?.action?.type === 'modifier_code')
    .map((m) => {
      const a = m.meta.action;
      return {
        id: m.id,
        agent: noms[m.auteur_id] || '—',
        quoi: String(a.valeur || m.texte || '').replace(/\s+/g, ' ').slice(0, 160),
        statut: a.statut || 'a_confirmer',
        resultat: a.resultat ? String(a.resultat).slice(0, 200) : '',
        fusion: typeof a.fusion === 'string' && /^https:\/\/github\.com\//.test(a.fusion) ? a.fusion : null,
        branche: a.branche || null,
        quand: a.le || m.created_at,
      };
    });
}

export default function TachesFond({ entrepriseId, t }) {
  const [lignes, setLignes] = useState(null);
  useEffect(() => {
    if (!entrepriseId) { setLignes([]); return undefined; }
    let vivant = true;
    const charger = async () => {
      const { data } = await supabase.from('legion_messages').select('id, auteur_id, texte, created_at, meta')
        .eq('entreprise_id', entrepriseId).eq('meta->action->>type', 'modifier_code')
        .order('created_at', { ascending: false }).limit(15);
      const ids = [...new Set((data || []).map((m) => m.auteur_id).filter(Boolean))];
      const { data: agents } = ids.length ? await supabase.from('legion_agents').select('id, nom').in('id', ids) : { data: [] };
      if (vivant) setLignes(lignesTaches(data, Object.fromEntries((agents || []).map((a) => [a.id, a.nom]))));
    };
    charger();
    const minuteur = setInterval(charger, 20_000);
    return () => { vivant = false; clearInterval(minuteur); };
  }, [entrepriseId]);

  if (!lignes) return <p className="text-legion-muted">…</p>;
  if (!lignes.length) return <p className="text-legion-muted">{t('legion.atelier.tachesVide')}</p>;
  return (
    <ul className="space-y-1">
      {lignes.map((l) => (
        <li key={l.id} className="min-w-0">
          <span className={COULEUR[l.statut] || 'text-legion-muted'}>● {t(`legion.atelier.tacheStatut_${l.statut}`, l.statut)}</span>{' '}
          <span className="text-legion-gold">{l.agent}</span>{' '}
          <span className="text-legion-ink">{l.quoi}</span>
          {l.resultat && <span className="block truncate pl-3 text-legion-muted">{l.resultat}</span>}
          {(l.fusion || l.branche) && (
            <span className="block truncate pl-3">
              {l.branche && <span className="text-legion-muted">{l.branche} </span>}
              {l.fusion && <a href={l.fusion} target="_blank" rel="noopener noreferrer" className="text-legion-gold underline">{t('legion.atelier.voirFusion')}</a>}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
