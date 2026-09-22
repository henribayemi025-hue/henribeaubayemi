import { useCallback, useEffect, useState } from 'react';
import { IconPlugConnected, IconBuildingStore, IconChartBar } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

// LEGION — les connecteurs: ce que les agents ont le droit de lire.
//
// Chantier 4, « Se connecter avec Finjaro » (Beau, 22/09): une entreprise
// qui a une boutique sur la place de marché la relie ici; ses agents
// lisent SES ventes, SON stock, SES avis, SES messages en attente — jamais
// ceux des autres, jamais un numéro ni une adresse de cliente. Le
// connecteur « Mesures Finjaro » (les chiffres de toute la plateforme)
// reste réservé à l'équipe Finjaro.

export function Connecteurs({ entreprise, t }) {
  const [connecteurs, setConnecteurs] = useState(null);
  const [boutiques, setBoutiques] = useState([]);
  const [choix, setChoix] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    const [{ data: c }, { data: { user } }] = await Promise.all([
      supabase.from('legion_connecteurs').select('type, actif, config').eq('entreprise_id', entreprise.id),
      supabase.auth.getUser(),
    ]);
    setConnecteurs(c || []);
    if (user) {
      const { data: s } = await supabase.from('shops').select('id, name').eq('owner_id', user.id).order('created_at');
      setBoutiques(s || []);
      if (!choix && s?.length) setChoix(s[0].id);
    }
  }, [entreprise.id, choix]);
  useEffect(() => { charger(); }, [charger]);

  if (!connecteurs) return null;
  const mesures = connecteurs.find((c) => c.type === 'finjaro-mesures' && c.actif);
  const boutique = connecteurs.find((c) => c.type === 'finjaro-boutique' && c.actif);

  async function brancher(actif, shopId) {
    setBusy(true); setErreur('');
    const { error } = await supabase.rpc('legion_brancher_boutique', { p_entreprise: entreprise.id, p_shop: shopId, p_actif: actif });
    setBusy(false);
    if (error) setErreur(error.message); else charger();
  }

  return (
    <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5">
      <div className="border-b border-legion-line pb-3">
        <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink">
          <IconPlugConnected size={15} className="text-legion-gold" /> {t('legion.connecteursTitre', 'Ce que les agents peuvent lire')}
        </h3>
      </div>
      <ul className="space-y-2 text-[12px]">
        <li className="flex items-start gap-2">
          <IconBuildingStore size={16} className="mt-0.5 shrink-0 text-legion-gold" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-legion-ink">{t('legion.connecteurBoutique', 'Ma boutique sur Finjaro')}</p>
            {boutique ? (
              <p className="text-legion-muted">
                {t('legion.connecteurBoutiqueBranchee', { nom: boutique.config?.nom, defaultValue: '« {{nom}} » est branchée : ventes, stock, avis, messages en attente.' })}
                {' '}<button type="button" disabled={busy} onClick={() => brancher(false, boutique.config?.shop_id)} className="font-semibold text-legion-danger">{t('legion.debrancher', 'Débrancher')}</button>
              </p>
            ) : boutiques.length === 0 ? (
              <p className="text-legion-muted">{t('legion.connecteurSansBoutique', 'Tu n’as pas encore de boutique sur Finjaro. Crée-la depuis la place de marché, elle apparaîtra ici.')}</p>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <select value={choix} onChange={(e) => setChoix(e.target.value)} className="input min-w-0 flex-1 text-[13px]">
                  {boutiques.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button type="button" disabled={busy || !choix} onClick={() => brancher(true, choix)}
                  className="rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg disabled:opacity-50">
                  {t('legion.brancher', 'Brancher')}
                </button>
              </div>
            )}
            <p className="mt-1 text-[11px] leading-snug text-legion-muted">{t('legion.connecteurBoutiqueAide', 'Les agents lisent ses ventes, son stock, ses avis et ses messages en attente — jamais le numéro ni l’adresse d’une cliente, jamais les autres boutiques.')}</p>
            {erreur && <p className="text-[11px] text-legion-danger">{erreur}</p>}
          </div>
        </li>
        <li className="flex items-start gap-2">
          <IconChartBar size={16} className="mt-0.5 shrink-0 text-legion-gold" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-legion-ink">{t('legion.connecteurMesures', 'Mesures Finjaro')}</p>
            <p className="text-legion-muted">{mesures ? t('legion.connecteurMesuresOn', 'Branché : les chiffres de toute la place de marché (réservé à l’équipe Finjaro).') : t('legion.connecteurMesuresOff', 'Les chiffres de toute la place de marché. Réservé à l’équipe Finjaro.')}</p>
          </div>
        </li>
      </ul>
    </section>
  );
}
