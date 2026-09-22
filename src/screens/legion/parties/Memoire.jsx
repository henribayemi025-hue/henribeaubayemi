import { useCallback, useEffect, useState } from 'react';
import { IconBrain, IconPlus, IconX } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

// LEGION — ce que les agents ont retenu.
//
// Beau, 22/09: « tout ce que je lui dis, tout doit s'entraîner ». Chaque
// consigne durable qu'il donne dans un salon devient une règle (table
// legion_memoire) que TOUS les agents relisent avant de répondre. Ici, il
// voit la liste, en ajoute une à la main, et éteint celle qui ne vaut plus.
// Une règle éteinte n'est pas effacée: on sait d'où venait un comportement.

const SOURCE = { fondateur: '💬', claude: '🛠️', main: '✍️' };

export function Memoire({ entrepriseId, t }) {
  const [regles, setRegles] = useState(null);
  const [nouvelle, setNouvelle] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [tout, setTout] = useState(false);

  const charger = useCallback(async () => {
    const { data } = await supabase.from('legion_memoire').select('id, regle, source, created_at')
      .eq('entreprise_id', entrepriseId).eq('actif', true).order('created_at', { ascending: false });
    setRegles(data || []);
  }, [entrepriseId]);

  useEffect(() => {
    charger();
    const canal = supabase.channel(`legion-memoire-${entrepriseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'legion_memoire', filter: `entreprise_id=eq.${entrepriseId}` }, charger)
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [entrepriseId, charger]);

  async function ajouter(e) {
    e.preventDefault();
    const regle = nouvelle.trim();
    if (regle.length < 3 || envoi) return;
    setEnvoi(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('legion_memoire').insert({ entreprise_id: entrepriseId, regle, source: 'main', cree_par: user?.id });
    setEnvoi(false);
    if (!error) { setNouvelle(''); charger(); }
  }
  async function eteindre(id) {
    setRegles((r) => r.filter((x) => x.id !== id));
    await supabase.from('legion_memoire').update({ actif: false }).eq('id', id);
  }

  const visibles = tout ? regles : regles?.slice(0, 6);

  return (
    <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5">
      <div className="flex items-center justify-between border-b border-legion-line pb-3">
        <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink">
          <IconBrain size={15} className="text-legion-gold" /> {t('legion.memoireTitre', 'Ce qu’ils ont retenu')}
          {regles && <span className="rounded-pill bg-legion-card px-2 text-[11px] font-semibold text-legion-muted">{regles.length}</span>}
        </h3>
      </div>
      <p className="text-[12px] text-legion-muted">{t('legion.memoireExplication', 'Quand tu donnes une consigne qui doit durer, l’agent la retient ici. Tous la relisent avant de répondre.')}</p>
      {regles === null ? null : regles.length === 0 ? (
        <p className="py-3 text-center text-[12px] text-legion-muted">{t('legion.memoireVide', 'Rien de retenu pour l’instant.')}</p>
      ) : (
        <ul className="space-y-1.5">
          {visibles.map((r) => (
            <li key={r.id} className="group flex items-start gap-2 rounded-card border border-legion-line bg-legion-card px-3 py-2">
              <span className="mt-0.5 text-[13px]" title={r.source}>{SOURCE[r.source] || '•'}</span>
              <span className="min-w-0 flex-1 text-[13px] leading-snug text-legion-ink">{r.regle}</span>
              <button type="button" onClick={() => eteindre(r.id)} title={t('legion.memoireOublier', 'Oublier cette règle')} className="shrink-0 rounded-full p-1 text-legion-muted hover:bg-legion-bg hover:text-legion-danger">
                <IconX size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {regles && regles.length > 6 && (
        <button type="button" onClick={() => setTout((v) => !v)} className="w-full rounded-card border border-legion-line py-1.5 text-[12px] font-medium text-legion-gold hover:bg-legion-card">
          {tout ? t('legion.memoireMoins', 'Moins') : t('legion.memoireTout', { n: regles.length, defaultValue: 'Tout voir ({{n}})' })}
        </button>
      )}
      <form onSubmit={ajouter} className="flex items-center gap-2">
        <input value={nouvelle} onChange={(e) => setNouvelle(e.target.value)} maxLength={400}
          placeholder={t('legion.memoireAjouter', 'Une règle à retenir…')}
          className="min-w-0 flex-1 rounded-input border border-legion-line bg-legion-bg px-3 py-2 text-[16px] text-legion-ink outline-none placeholder:text-legion-muted focus:border-legion-gold/60 sm:text-[14px]" />
        <button type="submit" disabled={envoi || nouvelle.trim().length < 3} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-legion-gold text-legion-bg disabled:opacity-40" aria-label="+">
          <IconPlus size={18} />
        </button>
      </form>
    </section>
  );
}
