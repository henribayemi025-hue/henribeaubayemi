import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconBrandInstagram, IconCheck, IconCopy, IconMovie, IconPhoto, IconSlideshow, IconTextCaption, IconX, IconChevronDown } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

// LEO — l'équipe réseaux sociaux (Beau, 08/10 : « oui, rajoute ; ce n'est pas
// pour nous, c'est pour toute personne »). Les publications que les agents
// proposent avec la mission « Semaine de publications » (legion_publications,
// 0240). Rien n'est publié par Léo : on valide, on copie la légende, on publie
// soi-même, puis on la marque « publiée ».
//
// Une vidéo porte un brief. Les agents ne savent pas encore fabriquer de vidéo
// (aucune API) : chez Finjaro le brief part à Claude (« Claude prépare la
// vidéo »), ailleurs c'est un brief à filmer.

const ICONES = { video_courte: IconMovie, carrousel: IconSlideshow, image: IconPhoto, statut: IconBrandInstagram, texte: IconTextCaption };

function dateDuJour(semaine, jour, L) {
  const d = new Date(`${semaine}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + (jour - 1));
  return d.toLocaleDateString(L === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function Carte({ p, auteur, L, t, onStatut, occupe }) {
  const [ouvert, setOuvert] = useState(false);
  const [copie, setCopie] = useState(false);
  const Icone = ICONES[p.format] || IconTextCaption;
  const texte = [p.accroche, p.legende, p.appel_action].filter(Boolean).join('\n\n');

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      setOuvert(true); // le texte entier s'affiche : on peut le sélectionner à la main
    }
  }

  const v = p.video;
  const etatVideo = {
    a_produire: t('legion.publications.video.aProduire'),
    brief: t('legion.publications.video.brief'),
    proposee: t('legion.publications.video.proposee'),
    faite: t('legion.publications.video.faite'),
  }[p.video_statut];

  return (
    <li className={`flex min-w-0 flex-col gap-2 rounded-card border p-3 ${p.statut === 'refusee' ? 'border-legion-line bg-legion-bg opacity-60' : p.statut === 'proposee' ? 'border-legion-gold/40 bg-legion-card' : 'border-legion-line bg-legion-card'}`}>
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-legion-muted">
        <span className="font-semibold capitalize text-legion-ink">{dateDuJour(p.semaine, p.jour, L)}</span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1"><Icone size={13} className="text-legion-gold" /> {t(`legion.publications.format.${p.format}`)}</span>
        <span aria-hidden="true">·</span>
        <span>{p.plateforme}</span>
        {auteur && <span className="ml-auto truncate">{t('legion.publications.par', { nom: auteur })}</span>}
      </div>
      <p className="break-words text-[14px] font-semibold leading-snug text-legion-ink">{p.accroche}</p>
      <p className={`whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-legion-ink/90 ${ouvert ? '' : 'line-clamp-4'}`}>{p.legende}</p>
      {(ouvert || p.legende.length < 220) && p.appel_action && <p className="break-words text-[12px] font-semibold text-legion-gold">{p.appel_action}</p>}
      {ouvert && p.visuel && <p className="break-words text-[12px] text-legion-muted"><span className="font-semibold">{t('legion.publications.visuel')} </span>{p.visuel}</p>}
      {ouvert && p.pourquoi && <p className="break-words text-[12px] italic text-legion-muted"><span className="font-semibold not-italic">{t('legion.publications.pourquoi')} </span>{p.pourquoi}</p>}

      {v && (
        <div className="rounded-input border border-legion-line bg-legion-bg p-2 text-[12px]">
          <p className="flex items-center gap-1.5 font-semibold text-legion-ink"><IconMovie size={14} className="text-legion-gold" /> {t('legion.publications.video.titre')}{v.duree_s ? ` · ${v.duree_s} s` : ''}</p>
          {etatVideo && <p className="mt-0.5 text-[11px] text-legion-gold">{etatVideo}</p>}
          {p.video_url && <a href={p.video_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[12px] font-semibold text-legion-gold underline">{t('legion.publications.video.voir')}</a>}
          {ouvert && (
            <>
              <ol className="mt-1.5 space-y-1">
                {(v.plans || []).map((pl, i) => (
                  <li key={i} className="break-words text-legion-ink/90"><span className="font-mono text-[11px] text-legion-muted">{pl.secondes}</span> {pl.image}{pl.texte_ecran ? <span className="text-legion-gold"> — « {pl.texte_ecran} »</span> : null}</li>
                ))}
              </ol>
              {v.voix_off && <p className="mt-1.5 break-words text-legion-muted"><span className="font-semibold">{t('legion.publications.video.voix')} </span>{v.voix_off}</p>}
            </>
          )}
        </div>
      )}

      <button type="button" onClick={() => setOuvert((o) => !o)} className="flex items-center gap-1 self-start text-[11px] font-semibold text-legion-muted">
        <IconChevronDown size={13} className={ouvert ? 'rotate-180' : ''} /> {ouvert ? t('legion.publications.moins') : t('legion.publications.plus')}
      </button>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-legion-line pt-2">
        {p.statut === 'proposee' && (
          <>
            <button type="button" disabled={occupe} onClick={() => onStatut(p, 'validee')} className="inline-flex items-center gap-1 rounded-pill bg-legion-gold px-3 py-1 text-[12px] font-semibold text-legion-bg disabled:opacity-50">
              <IconCheck size={13} /> {t('legion.publications.valider')}
            </button>
            <button type="button" disabled={occupe} onClick={() => onStatut(p, 'refusee')} className="inline-flex items-center gap-1 rounded-pill border border-legion-line px-3 py-1 text-[12px] font-semibold text-legion-muted disabled:opacity-50">
              <IconX size={13} /> {t('legion.publications.refuser')}
            </button>
          </>
        )}
        {p.statut === 'validee' && (
          <>
            <span className="text-[11px] font-semibold text-legion-success">✓ {t('legion.publications.statut.validee')}</span>
            <button type="button" onClick={copier} className="inline-flex items-center gap-1 rounded-pill bg-legion-gold px-3 py-1 text-[12px] font-semibold text-legion-bg">
              <IconCopy size={13} /> {copie ? t('legion.publications.copiee') : t('legion.publications.copier')}
            </button>
            <button type="button" disabled={occupe} onClick={() => onStatut(p, 'publiee')} className="rounded-pill border border-legion-gold/50 px-3 py-1 text-[12px] font-semibold text-legion-gold disabled:opacity-50">
              {t('legion.publications.marquerPubliee')}
            </button>
          </>
        )}
        {p.statut === 'publiee' && <span className="text-[11px] font-semibold text-legion-success">✓ {t('legion.publications.statut.publiee')}</span>}
        {p.statut === 'refusee' && (
          <>
            <span className="text-[11px] text-legion-muted">{t('legion.publications.statut.refusee')}</span>
            <button type="button" disabled={occupe} onClick={() => onStatut(p, 'proposee')} className="text-[11px] font-semibold text-legion-gold disabled:opacity-50">{t('legion.publications.remettre')}</button>
          </>
        )}
      </div>
    </li>
  );
}

export function Publications({ entreprise, agents, moi, t, langue = 'fr' }) {
  const [lignes, setLignes] = useState(null); // null = chargement
  const [semaine, setSemaine] = useState(null);
  const [occupe, setOccupe] = useState(null);
  const [erreur, setErreur] = useState(false);
  const L = langue === 'en' ? 'en' : 'fr';

  const charger = useCallback(async () => {
    const { data, error } = await supabase.from('legion_publications').select('*')
      .eq('entreprise_id', entreprise.id).order('semaine', { ascending: false }).order('jour').limit(70);
    if (error) { setErreur(true); setLignes([]); return; }
    setErreur(false);
    setLignes(data || []);
  }, [entreprise.id]);
  useEffect(() => { charger(); }, [charger]);

  const semaines = useMemo(() => [...new Set((lignes || []).map((p) => p.semaine))], [lignes]);
  const choisie = semaine && semaines.includes(semaine) ? semaine : semaines[0];
  const visibles = (lignes || []).filter((p) => p.semaine === choisie);
  const aValider = visibles.filter((p) => p.statut === 'proposee').length;
  const nomDe = (id) => agents.find((a) => a.id === id)?.nom;

  async function changerStatut(p, statut) {
    setOccupe(p.id);
    const { error } = await supabase.from('legion_publications')
      .update({ statut, decide_par: moi?.user_id || null, decide_le: new Date().toISOString() }).eq('id', p.id);
    setOccupe(null);
    if (error) { setErreur(true); return; }
    setLignes((ls) => ls.map((x) => (x.id === p.id ? { ...x, statut } : x)));
  }

  const dateSemaine = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(L === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long' });

  return (
    <section className="space-y-4 rounded-2xl border border-legion-line bg-legion-panel p-5" aria-labelledby="leo-publications">
      <div className="flex flex-wrap items-start gap-2 border-b border-legion-line pb-3">
        <div className="min-w-0 flex-1">
          <h3 id="leo-publications" className="flex items-center gap-2 text-caption font-bold text-legion-ink">
            <span aria-hidden="true">📱</span> {t('legion.publications.titre')}
            {aValider > 0 && <span className="rounded-pill bg-legion-gold px-2 py-0.5 text-[11px] font-bold text-legion-bg">{t('legion.publications.aValider', { count: aValider })}</span>}
          </h3>
          <p className="mt-1 text-[12px] leading-snug text-legion-muted">{t('legion.publications.aide')}</p>
        </div>
        {semaines.length > 1 && (
          <select value={choisie} onChange={(e) => setSemaine(e.target.value)} aria-label={t('legion.publications.choisirSemaine')}
            className="rounded-input border border-legion-line bg-legion-bg px-2 py-1 text-[16px] text-legion-ink sm:text-[12px]">
            {semaines.map((s) => <option key={s} value={s}>{t('legion.publications.semaineDu', { date: dateSemaine(s) })}</option>)}
          </select>
        )}
      </div>

      {erreur && <p className="text-[12px] text-legion-danger">{t('errors.generic')}</p>}

      {lignes === null ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-card bg-legion-card" />)}
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-card border border-dashed border-legion-line p-4 text-[12.5px] leading-relaxed text-legion-muted">
          <p>{t('legion.publications.vide')}</p>
          <a href="#leo-missions" className="mt-2 inline-block font-semibold text-legion-gold">{t('legion.publications.versMissions')}</a>
        </div>
      ) : (
        <>
          {semaines.length === 1 && <p className="text-[11px] font-semibold uppercase tracking-wider text-legion-muted">{t('legion.publications.semaineDu', { date: dateSemaine(choisie) })}</p>}
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {visibles.map((p) => <Carte key={p.id} p={p} auteur={nomDe(p.auteur_id)} L={L} t={t} onStatut={changerStatut} occupe={occupe === p.id} />)}
          </ul>
        </>
      )}
    </section>
  );
}
