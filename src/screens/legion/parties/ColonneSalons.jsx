import { useMemo, useState } from 'react';
import { IconSearch, IconHash, IconAdjustmentsHorizontal, IconRobot, IconUsers } from '@tabler/icons-react';
import { Visage } from './Visage';
import { Interrupteur } from './Interrupteur';
import { dernierMessage, quand, sansAccent, iconeDept } from './outils';

// La deuxième colonne: les salons du département choisi, puis ses agents
// avec leur interrupteur — comme la liste de WhatsApp Web, avec le dernier
// message et l'heure sous chaque nom.
//
// Beau: « je peux décider d'écrire à quelqu'un dans une équipe de 45 000 ».
// Donc une recherche, et pas seulement sur le nom: le poste et le
// département comptent aussi.
export function ColonneSalons({
  dept, departements, salons, prives, courant, onChoisirSalon, agents, moi, messages, langue,
  onAllumer, onFiche, onEcrireA, agentPrive, t, className = '', ongletInitial = 'mixte',
}) {
  const [q, setQ] = useState('');
  const [onglet, setOnglet] = useState(ongletInitial); // 'mixte' | 'agents'
  const [actifsSeuls, setActifsSeuls] = useState(false);

  const machines = useMemo(() => agents.filter((a) => !a.user_id), [agents]);
  const duDept = useMemo(
    () => (dept ? machines.filter((a) => a.departement === dept.nom) : machines),
    [dept, machines],
  );
  const filtres = useMemo(() => {
    const k = sansAccent(q.trim());
    return duDept.filter((a) => {
      if (actifsSeuls && !a.actif) return false;
      if (!k) return true;
      return sansAccent(a.nom).includes(k) || sansAccent(a.poste).includes(k) || sansAccent(a.departement).includes(k);
    });
  }, [duDept, q, actifsSeuls]);

  const salonsVisibles = dept ? salons.filter((s) => s.id === dept.id) : salons;
  const privesVisibles = prives.filter((p) => !q || sansAccent(p.nom).includes(sansAccent(q)));
  const allumes = machines.filter((a) => a.actif).length;

  return (
    <div className={`flex w-full shrink-0 flex-col border-r border-legion-line bg-legion-panel lg:w-[300px] ${className}`}>
      <div className="border-b border-legion-line p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="truncate text-body font-semibold text-legion-ink">{dept ? dept.nom : t('legion.quartierGeneral', 'Tous les salons')}</h2>
          {dept && (
            <span className="rounded-input border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ borderColor: dept.couleur, color: dept.couleur, backgroundColor: dept.couleur + '14' }}>
              {dept.cle.slice(0, 4)}
            </span>
          )}
        </div>
        <div className="relative">
          <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-legion-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('legion.chercherQuelquun', 'Chercher un agent, un poste, un salon…')}
            className="w-full rounded-input border border-legion-line bg-legion-card py-2 pl-8 pr-3 text-caption text-legion-ink outline-none transition placeholder:text-legion-muted focus:border-legion-gold"
          />
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-legion-line pt-2">
          <div className="flex gap-1">
            {[['mixte', t('legion.vueMixte', 'Salons')], ['agents', `${t('legion.agents', 'Agents')} (${duDept.length})`]].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setOnglet(k)}
                className={`rounded-input px-2 py-1 text-caption font-semibold transition ${onglet === k ? 'bg-legion-gold/15 text-legion-ink' : 'text-legion-muted hover:text-legion-ink'}`}>
                {l}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setActifsSeuls((v) => !v)}
            className={`flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[11px] transition ${actifsSeuls ? 'border-legion-success/40 bg-legion-success/15 text-legion-success' : 'border-legion-line text-legion-muted'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${actifsSeuls ? 'bg-legion-success' : 'bg-muted'}`} />
            {t('legion.actifs', 'Allumés')}
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-2">
        {onglet === 'mixte' && (
          <div>
            <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.salonsCollectifs', 'Salons')}</p>
            <ul className="mt-1 space-y-0.5">
              {salonsVisibles.map((s) => {
                const Icone = iconeDept(s.cle);
                const dernier = dernierMessage(messages, s.id);
                const choisi = courant === s.id && !agentPrive;
                const n = machines.filter((a) => a.departement === s.nom).length;
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => onChoisirSalon(s.id)}
                      className={`flex w-full items-center gap-2.5 rounded-card px-2.5 py-2 text-left transition ${choisi ? 'bg-legion-card shadow-sm ring-1 ring-legion-line' : 'hover:bg-legion-card/70'}`}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input text-white" style={{ backgroundColor: s.couleur }}>
                        <Icone size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-caption font-semibold text-legion-ink">{s.nom}</span>
                          {dernier && <span className="shrink-0 text-[10px] text-legion-muted">{quand(dernier.created_at, langue)}</span>}
                        </span>
                        <span className="block truncate text-[11px] text-legion-muted">
                          {dernier ? dernier.texte : s.a_quoi_ca_sert}
                        </span>
                      </span>
                      {n > 0 && <span className="shrink-0 font-mono text-[10px] text-legion-muted">{n}</span>}
                    </button>
                  </li>
                );
              })}
              {privesVisibles.map((s) => {
                const dernier = dernierMessage(messages, s.id);
                const autre = machines.find((a) => s.prive_entre?.includes(a.cle));
                const choisi = courant === s.id;
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => onChoisirSalon(s.id)}
                      className={`flex w-full items-center gap-2.5 rounded-card px-2.5 py-2 text-left transition ${choisi ? 'bg-legion-card shadow-sm ring-1 ring-legion-line' : 'hover:bg-legion-card/70'}`}>
                      <Visage a={autre} taille={36} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-caption font-semibold text-legion-ink">{s.nom}</span>
                          {dernier && <span className="shrink-0 text-[10px] text-legion-muted">{quand(dernier.created_at, langue)}</span>}
                        </span>
                        <span className="block truncate text-[11px] text-legion-muted">{dernier ? dernier.texte : autre?.poste}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-legion-muted">
            <span className="flex items-center gap-1"><IconRobot size={12} className="text-legion-gold" /> {t('legion.agents', 'Agents')} ({filtres.length})</span>
            <span className="font-mono text-[10px] normal-case tracking-normal">{t('legion.interrupteur', 'Interrupteur')}</span>
          </div>
          <ul className="mt-1 space-y-1.5">
            {filtres.length === 0 && (
              <li className="rounded-card bg-legion-bg p-4 text-center text-caption text-legion-muted">{t('legion.personneNeCorrespond', 'Personne ne correspond.')}</li>
            )}
            {filtres.slice(0, 200).map((a) => {
              const choisi = agentPrive === a.id;
              return (
                <li key={a.id} className={`rounded-card border p-2.5 transition ${choisi ? 'border-legion-gold/50 bg-legion-card shadow-md' : 'border-legion-line/70 bg-legion-card/60 hover:bg-legion-card'}`}>
                  <div className="flex items-start gap-2">
                    <button type="button" onClick={() => onEcrireA(a)} className="flex min-w-0 flex-1 items-start gap-2.5 text-left">
                      <Visage a={a} taille={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-caption font-semibold text-legion-ink">{a.nom}</span>
                        <span className="block truncate text-[11px] text-legion-muted">{a.poste}</span>
                        <span className={`mt-1 inline-block rounded-pill px-1.5 py-0.5 text-[9px] font-semibold ${a.actif ? 'bg-legion-success/15 text-legion-success' : 'bg-legion-bg text-legion-muted'}`}>
                          {a.actif ? t(`legion.autonomie.${a.autonomie || 'supervise'}`) : t('legion.enVeille', 'En veille')}
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Interrupteur petit on={!!a.actif} onChange={(v) => onAllumer(a, v)} label={a.actif ? t('legion.eteindre', 'Éteindre') : t('legion.allumer', 'Allumer')} />
                      <button type="button" onClick={() => onFiche(a)} title={t('legion.ficheAgent', 'Fiche')} aria-label={t('legion.ficheAgent', 'Fiche')}
                        className="rounded p-0.5 text-legion-muted transition hover:bg-legion-bg hover:text-legion-ink">
                        <IconAdjustmentsHorizontal size={13} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
            {filtres.length > 200 && <li className="px-2 text-[11px] text-legion-muted">{t('legion.etPlusPersonnes', { count: filtres.length - 200 })}</li>}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-legion-line bg-legion-bg/60 px-3 py-2 text-[11px] text-legion-muted">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-legion-success" /> {t('legion.agentsOperationnels', { n: allumes })}</span>
        <span className="flex items-center gap-1 font-mono"><IconUsers size={11} /> {machines.length}</span>
      </div>
    </div>
  );
}
