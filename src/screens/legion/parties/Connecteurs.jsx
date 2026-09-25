import { useCallback, useEffect, useState } from 'react';
import { LogoMarque, MARQUES } from '../../../components/LogoMarque';
import { IconPlugConnected, IconBuildingStore, IconChartBar, IconRobot, IconCopy, IconCalculator } from '@tabler/icons-react';
import { supabase } from '../../../lib/supabase';

// LEGION — les connecteurs: ce que les agents ont le droit de lire.
//
// Chantier 4, « Se connecter avec Finjaro » (Beau, 22/09): une entreprise
// qui a une boutique sur la place de marché la relie ici; ses agents
// lisent SES ventes, SON stock, SES avis, SES messages en attente — jamais
// ceux des autres, jamais un numéro ni une adresse de cliente. Le
// connecteur « Mesures Finjaro » (les chiffres de toute la plateforme)
// reste réservé à l'équipe Finjaro.

// La veille RSS, Linear, Jira, et la réunion sur ticket GitHub (0188, 24/09).
function ConnecteursFlux({ entreprise, connecteurs, github, busy, setBusy, onChange, t }) {
  const [salons, setSalons] = useState([]);
  const [flux, setFlux] = useState('');
  const [cleLinear, setCleLinear] = useState('');
  const [equipeLinear, setEquipeLinear] = useState('');
  const [jira, setJira] = useState({ site: '', email: '', jeton: '', projet: '' });
  const [erreur, setErreur] = useState({});
  const [bilan, setBilan] = useState('');
  useEffect(() => {
    supabase.from('legion_canaux').select('id, nom, prive_entre').eq('entreprise_id', entreprise.id).order('ordre')
      .then(({ data }) => setSalons((data || []).filter((s) => !s.prive_entre?.length)), () => {});
  }, [entreprise.id]);
  const rss = connecteurs.find((c) => c.type === 'rss' && c.actif);
  const linear = connecteurs.find((c) => c.type === 'linear' && c.actif);
  const jiraC = connecteurs.find((c) => c.type === 'jira' && c.actif);
  async function brancher(type, config, jeton, actif = true) {
    setBusy(true); setErreur((e) => ({ ...e, [type]: '' }));
    const { error } = await supabase.rpc('legion_brancher_outil', { p_entreprise: entreprise.id, p_type: type, p_config: config || {}, p_jeton: jeton || null, p_actif: actif });
    setBusy(false);
    if (error) setErreur((e) => ({ ...e, [type]: error.message })); else { setCleLinear(''); setJira((j) => ({ ...j, jeton: '' })); onChange(); }
  }
  async function options(type, o) {
    setBusy(true);
    await supabase.rpc('legion_connecteur_options', { p_entreprise: entreprise.id, p_type: type, p_options: o });
    setBusy(false); onChange();
  }
  async function lireMaintenant() {
    setBusy(true); setBilan('');
    const { data, error } = await supabase.functions.invoke('legion-flux', { body: { entreprise_id: entreprise.id } });
    setBusy(false);
    setBilan(error || data?.erreur ? (data?.erreur || error.message) : (data?.journal || []).map((l) => l.split(' ').slice(1).join(' ')).join(' · ') || t('legion.flux.rien'));
    onChange();
  }
  const SalonChoix = ({ c, type }) => (
    <label className="mt-1 flex items-center gap-1.5 text-[12px] text-legion-muted">{t('legion.flux.salon')}
      <select value={c?.config?.salon_id || ''} onChange={(e) => options(type, { salon_id: e.target.value || null })} disabled={busy}
        className="rounded-input border border-legion-line bg-legion-bg px-1.5 py-0.5 text-[16px] text-legion-ink sm:text-[12px]">
        <option value="">{t('legion.flux.salonDefaut')}</option>
        {salons.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
      </select>
    </label>
  );
  return (
    <>
      {github && (
        <li className="flex items-start gap-2">
          <LogoMarque marque="github" taille={26} />
          <div className="min-w-0 flex-1">
            <label className="flex items-center gap-2 font-semibold text-legion-ink">
              <input type="checkbox" checked={!!github.config?.reunion_sur_ticket} disabled={busy} onChange={(e) => options('github', { reunion_sur_ticket: e.target.checked })} />
              {t('legion.flux.reunionTicket')}
            </label>
            <p className="text-[11px] leading-snug text-legion-muted">{t('legion.flux.reunionTicketAide')}</p>
            {github.config?.reunion_sur_ticket && <SalonChoix c={github} type="github" />}
          </div>
        </li>
      )}
      <li className="flex items-start gap-2">
        <LogoMarque marque="rss" taille={26} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-legion-ink">{t('legion.flux.rss')}</p>
          {rss ? (
            <>
              <ul className="mt-0.5 space-y-0.5 text-[12px] text-legion-muted">{(rss.config?.flux || []).map((u) => <li key={u} className="truncate">• {u}</li>)}</ul>
              <p className="text-[11px] text-legion-muted">{rss.config?.lu_le ? t('legion.flux.luLe', { quand: new Date(rss.config.lu_le).toLocaleString() }) : t('legion.flux.pasEncoreLu')}{(rss.config?.erreurs || []).length ? ` · ${t('legion.flux.enErreur', { n: rss.config.erreurs.length })}` : ''}</p>
              <SalonChoix c={rss} type="rss" />
              <div className="mt-1 flex gap-3">
                <button type="button" disabled={busy} onClick={lireMaintenant} className="text-[12px] font-semibold text-legion-gold">{t('legion.flux.lireMaintenant')}</button>
                <button type="button" disabled={busy} onClick={() => brancher('rss', null, null, false)} className="text-[12px] font-semibold text-legion-danger">{t('legion.debrancher', 'Débrancher')}</button>
              </div>
            </>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); brancher('rss', { flux: flux.split(/\s+/).filter(Boolean) }); }} className="mt-1 flex flex-col gap-2">
              <textarea value={flux} onChange={(e) => setFlux(e.target.value)} rows={2} placeholder={t('legion.flux.rssPlaceholder')} className="input text-[13px]" />
              <button type="submit" disabled={busy || !flux.trim()} className="self-start rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg disabled:opacity-50">{t('legion.brancher', 'Brancher')}</button>
            </form>
          )}
          <p className="mt-1 text-[11px] leading-snug text-legion-muted">{t('legion.flux.rssAide')}</p>
          {bilan && <p className="text-[11px] text-legion-success">{bilan}</p>}
          {erreur.rss && <p className="text-[11px] text-legion-danger">{erreur.rss}</p>}
        </div>
      </li>
      <li className="flex items-start gap-2">
        <LogoMarque marque="linear" taille={26} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-legion-ink">Linear</p>
          {linear ? (
            <p className="text-legion-muted">{t('legion.flux.linearBranche', { equipe: linear.config?.equipe || t('legion.flux.toutes') })} <button type="button" disabled={busy} onClick={() => brancher('linear', null, null, false)} className="font-semibold text-legion-danger">{t('legion.debrancher', 'Débrancher')}</button></p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); brancher('linear', { equipe: equipeLinear }, cleLinear); }} className="mt-1 flex flex-wrap items-center gap-2">
              <input type="password" value={cleLinear} onChange={(e) => setCleLinear(e.target.value)} autoComplete="off" placeholder={t('legion.flux.cleLinear')} className="input min-w-0 flex-1 text-[13px]" />
              <input value={equipeLinear} onChange={(e) => setEquipeLinear(e.target.value)} placeholder={t('legion.flux.equipeLinear')} className="input w-28 text-[13px]" />
              <button type="submit" disabled={busy || !cleLinear.trim()} className="rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg disabled:opacity-50">{t('legion.brancher', 'Brancher')}</button>
            </form>
          )}
          {erreur.linear && <p className="text-[11px] text-legion-danger">{erreur.linear}</p>}
        </div>
      </li>
      <li className="flex items-start gap-2">
        <LogoMarque marque="jira" taille={26} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-legion-ink">Jira</p>
          {jiraC ? (
            <p className="text-legion-muted">{t('legion.flux.jiraBranche', { site: jiraC.config?.site, projet: jiraC.config?.projet || t('legion.flux.toutes') })} <button type="button" disabled={busy} onClick={() => brancher('jira', null, null, false)} className="font-semibold text-legion-danger">{t('legion.debrancher', 'Débrancher')}</button></p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); brancher('jira', { site: jira.site, email: jira.email, projet: jira.projet }, jira.jeton); }} className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input value={jira.site} onChange={(e) => setJira((j) => ({ ...j, site: e.target.value }))} placeholder="https://monequipe.atlassian.net" className="input text-[13px]" />
              <input value={jira.projet} onChange={(e) => setJira((j) => ({ ...j, projet: e.target.value }))} placeholder={t('legion.flux.projetJira')} className="input text-[13px]" />
              <input value={jira.email} onChange={(e) => setJira((j) => ({ ...j, email: e.target.value }))} placeholder={t('legion.flux.emailJira')} className="input text-[13px]" />
              <input type="password" value={jira.jeton} onChange={(e) => setJira((j) => ({ ...j, jeton: e.target.value }))} autoComplete="off" placeholder={t('legion.flux.jetonJira')} className="input text-[13px]" />
              <button type="submit" disabled={busy || !jira.site.trim()} className="justify-self-start rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg disabled:opacity-50">{t('legion.brancher', 'Brancher')}</button>
            </form>
          )}
          <p className="mt-1 text-[11px] leading-snug text-legion-muted">{t('legion.flux.ticketsAide')}</p>
          {erreur.jira && <p className="text-[11px] text-legion-danger">{erreur.jira}</p>}
        </div>
      </li>
    </>
  );
}

export function Connecteurs({ entreprise, t }) {
  const [connecteurs, setConnecteurs] = useState(null);
  const [boutiques, setBoutiques] = useState([]);
  const [choix, setChoix] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');
  const [depot, setDepot] = useState('');
  const [jeton, setJeton] = useState('');
  const [erreurGit, setErreurGit] = useState('');
  // Finjaro Accounting (0180): les espaces dont la personne est membre, lus
  // avec SES droits (la règle d'Accounting: finia_is_member) — l'identifiant
  // et le nom, rien d'autre.
  const [espaces, setEspaces] = useState([]);
  const [espace, setEspace] = useState('');
  const [erreurCompta, setErreurCompta] = useState('');
  // MON ASSISTANT (0174): les jetons pour brancher Claude, ChatGPT, Claude
  // Code… sur Legion (fonction legion-mcp). Le jeton en clair ne s'affiche
  // qu'une fois, à la création; ensuite on ne voit que le nom et l'usage.
  const [jetons, setJetons] = useState([]);
  const [nomJeton, setNomJeton] = useState('');
  const [jetonClair, setJetonClair] = useState('');
  const [erreurJeton, setErreurJeton] = useState('');
  const [copie, setCopie] = useState(false);
  const [duree, setDuree] = useState(90); // jours de vie d'un jeton (0189) ; 0 = sans fin
  const chargerJetons = useCallback(async () => {
    const { data } = await supabase.from('legion_jetons').select('id, nom, cree_le, dernier_usage_le, expire_le').is('revoque_le', null).order('cree_le', { ascending: false });
    setJetons(data || []);
  }, []);
  useEffect(() => { chargerJetons(); }, [chargerJetons]);
  const adresseMcp = (clair) => `${supabase.supabaseUrl}/functions/v1/legion-mcp/${clair}`;
  async function creerJeton(e) {
    e.preventDefault(); setErreurJeton(''); setBusy(true);
    // Un jeton qui expire (0189, idée 117 des 200) : 90 jours par défaut.
    const { data, error } = await supabase.rpc('legion_creer_jeton_expirant', { p_nom: nomJeton.trim() || null, p_jours: duree });
    setBusy(false);
    if (error) return setErreurJeton(error.message === 'trop_de_jetons' ? t('legion.tropDeJetons', 'Cinq jetons au plus : révoque-en un d’abord.') : error.message);
    setJetonClair(data); setNomJeton(''); setCopie(false); chargerJetons();
  }
  async function revoquerJeton(id) {
    setBusy(true); await supabase.rpc('legion_revoquer_jeton', { p_id: id }); setBusy(false); chargerJetons();
  }
  async function copierAdresse() {
    try { await navigator.clipboard.writeText(adresseMcp(jetonClair)); setCopie(true); } catch { setCopie(false); }
  }

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
      const { data: w } = await supabase.from('finia_workspaces').select('id, name').order('created_at');
      setEspaces(w || []);
      if (w?.length) setEspace((x) => x || w[0].id);
    }
  }, [entreprise.id, choix]);
  useEffect(() => { charger(); }, [charger]);

  if (!connecteurs) return null;
  const mesures = connecteurs.find((c) => c.type === 'finjaro-mesures' && c.actif);
  const boutique = connecteurs.find((c) => c.type === 'finjaro-boutique' && c.actif);
  const github = connecteurs.find((c) => c.type === 'github' && c.actif);
  const compta = connecteurs.find((c) => c.type === 'finjaro-accounting' && c.actif);

  async function brancher(actif, shopId) {
    setBusy(true); setErreur('');
    const { error } = await supabase.rpc('legion_brancher_boutique', { p_entreprise: entreprise.id, p_shop: shopId, p_actif: actif });
    setBusy(false);
    if (error) setErreur(error.message); else charger();
  }

  // GitHub (0169): chaque entreprise branche SON dépôt. Le jeton part dans
  // le coffre du serveur et ne revient jamais à l'écran.
  async function brancherGithub(actif) {
    setBusy(true); setErreurGit('');
    const { error } = await supabase.rpc('legion_brancher_github', { p_entreprise: entreprise.id, p_depot: actif ? depot : (github?.config?.depot || ''), p_jeton: actif ? jeton : null, p_actif: actif });
    setBusy(false);
    if (error) setErreurGit(error.message); else { setJeton(''); charger(); }
  }
  async function brancherCompta(actif) {
    setBusy(true); setErreurCompta('');
    const id = actif ? espace : compta?.config?.espace_id;
    const nom = espaces.find((w) => w.id === id)?.name || null;
    const { error } = await supabase.rpc('legion_brancher_comptabilite', { p_entreprise: entreprise.id, p_espace: id, p_nom: nom, p_actif: actif });
    setBusy(false);
    if (error) setErreurCompta(error.message); else charger();
  }
  async function oublierJeton() {
    setBusy(true);
    await supabase.rpc('legion_oublier_jeton_github', { p_entreprise: entreprise.id });
    setBusy(false); charger();
  }

  return (
    <section className="space-y-3 rounded-2xl border border-legion-line bg-legion-panel p-5">
      <div className="border-b border-legion-line pb-3">
        <h3 className="flex items-center gap-2 text-caption font-bold text-legion-ink">
          <IconPlugConnected size={15} className="text-legion-gold" /> {t('legion.connecteursTitre', 'Ce que les agents peuvent lire')}
        </h3>
      </div>
      {/* Ce qui vient (Beau, 25/09 : « connecter Supabase, Cloudflare, Vercel… pour
          chaque nouvel utilisateur »). Pas encore branchable : dit comme tel. */}
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-dashed border-legion-line px-3 py-2">
        <span className="text-[11.5px] font-semibold text-legion-muted">{t('legion.bientot')}</span>
        {['supabase', 'cloudflare', 'vercel', 'notion', 'googledrive', 'gmail', 'googlecalendar', 'slack', 'figma'].map((m) => (
          <span key={m} className="inline-flex items-center gap-1.5 text-[11.5px] text-legion-muted"><LogoMarque marque={m} taille={20} />{MARQUES[m].titre}</span>
        ))}
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
          <IconCalculator size={16} className="mt-0.5 shrink-0 text-legion-gold" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-legion-ink">{t('legion.connecteurCompta', 'Ma comptabilité sur Finjaro Accounting')}</p>
            {compta ? (
              <p className="text-legion-muted">
                {t('legion.connecteurComptaBranchee', { nom: compta.config?.nom, defaultValue: '« {{nom}} » est branchée : résumé du mois, ventes, dépenses, impayés.' })}
                {' '}<button type="button" disabled={busy} onClick={() => brancherCompta(false)} className="font-semibold text-legion-danger">{t('legion.debrancher', 'Débrancher')}</button>
              </p>
            ) : espaces.length === 0 ? (
              <p className="text-legion-muted">
                {t('legion.connecteurSansCompta', 'Tu n’as pas encore d’espace sur Finjaro Accounting.')}
                {' '}<a href="https://accounting.finjaro.net" target="_blank" rel="noreferrer" className="font-semibold text-legion-gold underline">{t('legion.ouvrirAccounting', 'Ouvrir Finjaro Accounting')}</a>
              </p>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <select value={espace} onChange={(e) => setEspace(e.target.value)} className="input min-w-0 flex-1 text-[13px]">
                  {espaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <button type="button" disabled={busy || !espace} onClick={() => brancherCompta(true)}
                  className="rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg disabled:opacity-50">
                  {t('legion.brancher', 'Brancher')}
                </button>
              </div>
            )}
            <p className="mt-1 text-[11px] leading-snug text-legion-muted">{t('legion.connecteurComptaAide', 'Les agents lisent les TOTAUX de tes livres : le résumé d’un mois, les ventes, les dépenses par catégorie, ce qui reste à encaisser et à payer — jamais le nom d’un client ni le détail d’une ligne. Si tu quittes cet espace, ils ne lisent plus rien.')}</p>
            {erreurCompta && <p className="text-[11px] text-legion-danger">{erreurCompta}</p>}
          </div>
        </li>
        <li className="flex items-start gap-2">
          <LogoMarque marque="github" taille={26} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-legion-ink">{t('legion.connecteurGithub', 'Mon dépôt GitHub')}</p>
            {github ? (
              <p className="text-legion-muted">
                {t('legion.connecteurGithubBranche', { depot: github.config?.depot, defaultValue: '« {{depot}} » est branché : derniers changements et tickets ouverts.' })}
                {github.config?.avec_jeton ? ` ${t('legion.connecteurGithubJeton', 'Jeton gardé au coffre.')} ` : ' '}
                {github.config?.avec_jeton && <button type="button" disabled={busy} onClick={oublierJeton} className="mr-2 font-semibold text-legion-muted underline">{t('legion.oublierJeton', 'Effacer le jeton')}</button>}
                <button type="button" disabled={busy} onClick={() => brancherGithub(false)} className="font-semibold text-legion-danger">{t('legion.debrancher', 'Débrancher')}</button>
              </p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); brancherGithub(true); }} className="mt-1 flex flex-wrap items-center gap-2">
                <input value={depot} onChange={(e) => setDepot(e.target.value)} placeholder={t('legion.depotExemple', 'propriétaire/dépôt')} className="input min-w-0 flex-1 text-[13px]" />
                <input type="password" value={jeton} onChange={(e) => setJeton(e.target.value)} autoComplete="off" placeholder={t('legion.jetonFacultatif', 'Jeton (facultatif si le dépôt est public)')} className="input min-w-0 flex-1 text-[13px]" />
                <button type="submit" disabled={busy || !depot.trim()} className="rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg disabled:opacity-50">{t('legion.brancher', 'Brancher')}</button>
              </form>
            )}
            <p className="mt-1 text-[11px] leading-snug text-legion-muted">
              {t('legion.connecteurGithubAide', 'Les agents lisent les derniers changements et les tickets ouverts de TON dépôt, en lecture seule. Pour un dépôt privé : sur GitHub, Paramètres › Developer settings › Personal access tokens › Fine-grained, accès à ce seul dépôt, droits « Contents » et « Issues » en lecture. Le jeton est rangé au coffre et ne s’affiche plus jamais.')}
            </p>
            {erreurGit && <p className="text-[11px] text-legion-danger">{erreurGit}</p>}
          </div>
        </li>
        <ConnecteursFlux entreprise={entreprise} connecteurs={connecteurs} github={github} busy={busy} setBusy={setBusy} onChange={charger} t={t} />
        <li className="flex items-start gap-2">
          <IconRobot size={16} className="mt-0.5 shrink-0 text-legion-gold" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-legion-ink">{t('legion.connecteurAssistant', 'Mon assistant (Claude, ChatGPT, Claude Code…)')}</p>
            <p className="text-legion-muted">{t('legion.connecteurAssistantAide', 'Ton assistant lit tes salons, tes tâches et ta feuille de route, et peut écrire dans un salon à ton nom — avec tes droits, rien de plus. Crée un jeton, colle l’adresse dans ton assistant (connecteur « sans authentification »).')}</p>
            {/* « Mon ordinateur » (Beau, 25/09) : l'assistant qui tourne sur SON
                ordinateur (Claude dans Chrome, Claude pour ordinateur) prend
                les tâches marquées « Mon ordinateur » au tableau. */}
            <p className="mt-1 text-legion-muted">🖥 {t('legion.ordinateur.aide')}</p>
            {jetonClair && (
              <div className="mt-2 rounded-xl border border-legion-gold/40 bg-legion-bg p-2">
                <p className="text-[11px] font-semibold text-legion-gold">{t('legion.jetonUneFois', 'Copie cette adresse maintenant : elle ne s’affichera plus.')}</p>
                <p className="mt-1 break-all font-mono text-[11px] text-legion-ink">{adresseMcp(jetonClair)}</p>
                <button type="button" onClick={copierAdresse} className="mt-1 inline-flex items-center gap-1 rounded-pill bg-legion-gold px-3 py-1 text-[12px] font-semibold text-legion-bg"><IconCopy size={13} /> {copie ? t('legion.copie', 'Copié') : t('legion.copier', 'Copier')}</button>
              </div>
            )}
            {jetons.length > 0 && (
              <ul className="mt-2 space-y-1">
                {jetons.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-center gap-x-2 text-[12px] text-legion-muted">
                    <span className="font-semibold text-legion-ink">{j.nom}</span>
                    <span>{j.dernier_usage_le ? t('legion.jetonUsage', { quand: new Date(j.dernier_usage_le).toLocaleDateString(), defaultValue: 'utilisé le {{quand}}' }) : t('legion.jetonJamais', 'jamais utilisé')}</span>
                    <span className={j.expire_le && new Date(j.expire_le) < new Date() ? 'text-legion-danger' : ''}>{j.expire_le ? (new Date(j.expire_le) < new Date() ? t('legion.securite.jetonExpire') : t('legion.securite.jetonJusquAu', { date: new Date(j.expire_le).toLocaleDateString() })) : t('legion.securite.jetonSansFin')}</span>
                    <button type="button" disabled={busy} onClick={async () => { setBusy(true); const { data } = await supabase.rpc('legion_remplacer_jeton', { p_id: j.id }); setBusy(false); if (data) { setJetonClair(data); setCopie(false); } chargerJetons(); }} className="font-semibold text-legion-gold">{t('legion.securite.remplacer')}</button>
                    <button type="button" disabled={busy} onClick={() => revoquerJeton(j.id)} className="font-semibold text-legion-danger">{t('legion.revoquer', 'Révoquer')}</button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={creerJeton} className="mt-2 flex flex-wrap items-center gap-2">
              <input value={nomJeton} onChange={(e) => setNomJeton(e.target.value)} maxLength={60} placeholder={t('legion.jetonNom', 'Nom (ex. Claude sur mon téléphone)')} className="input min-w-0 flex-1 text-[13px]" />
              <select value={duree} onChange={(e) => setDuree(Number(e.target.value))} className="rounded-input border border-legion-line bg-legion-bg px-1.5 py-1 text-[16px] text-legion-ink sm:text-[12px]" aria-label={t('legion.securite.duree')}>
                {[30, 90, 365, 0].map((d) => <option key={d} value={d}>{d ? t('legion.securite.jours', { n: d }) : t('legion.securite.sansFin')}</option>)}
              </select>
              <button type="submit" disabled={busy} className="rounded-pill bg-legion-gold px-3 py-1.5 text-[12px] font-semibold text-legion-bg disabled:opacity-50">{t('legion.creerJeton', 'Créer un jeton')}</button>
            </form>
            {erreurJeton && <p className="text-[11px] text-legion-danger">{erreurJeton}</p>}
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
