import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconPigMoney, IconTargetArrow, IconUsersGroup, IconRepeat,
  IconPlus, IconCheck, IconLink, IconPencil, IconX,
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { useSettings } from '../../hooks/useSettings';
import { Button } from '../../components/Button';
import { Field, TextInput, Select } from '../../components/Field';
import { Skeleton, ErrorState, EmptyState } from '../../components/states';
import ChatEspace from './ChatEspace';
import Analyste from './Analyste';
import { MoneyShell } from './MoneyShell';
import { montant } from './montant';

// Les pastilles de compte. Ce sont EXACTEMENT les six couleurs que les
// comptes existants portent déjà en base (`accounts.color`) — pas le
// terracotta de la place de marché, qui n'a rien à faire ici.
const COULEURS = ['#6366F1', '#38BDF8', '#34D399', '#F5B544', '#8B5CF6', '#FB7185'];

// Mon argent — le tout premier Finjaro, remis en service.
//
// Beau, 22/09: « on avait même commencé à travailler sur ça, c'était par là
// qu'on avait commencé, avec les projets, njangi et tout ça ». Il ne se
// trompait pas. Les tables sont toujours en production et contiennent de
// VRAIES données — 8 projets, 12 objectifs d'épargne, 2 njangis, 7 lignes de
// budget. Ce sont les ÉCRANS qui ont disparu du code au moment où Finjaro
// est devenu une place de marché. Des gens ont rangé des choses là-dedans et
// ne pouvaient plus les atteindre.
//
// ⚠️ AUCUNE CONVERSION DE MONNAIE ICI, et c'est délibéré.
//
// Ces montants ont été TAPÉS par la personne elle-même. Les objectifs
// existants le prouvent: « Maison France: 20 000 », « Boursorama: 1 000 » —
// ce sont des euros, pas des FCFA. Les convertir afficherait 13 millions
// pour une maison. C'est la même règle que pour une vendeuse qui relit ses
// prix (§2 du CLAUDE.md): un montant qu'on a saisi soi-même se relit tel
// qu'on l'a saisi. On met le symbole de la monnaie choisie à côté, rien de
// plus.


export default function MyMoney() {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const { currency: devise } = useSettings();
  const lang = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const [onglet, setOnglet] = useState('comptes');
  const [n, setN] = useState(0);
  const recharger = () => setN((x) => x + 1);

  const { data, loading, error } = useAsync(async () => {
    if (!user?.id) return null;
    const [comptes, budget, epargne, projets, njangis, espaces] = await Promise.all([
      supabase.from('accounts').select('id, name, balance, color, glyph').eq('user_id', user.id).order('created_at'),
      supabase.from('budget_entries').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('savings_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name, emoji, goal, invite_code, owner_id').order('created_at', { ascending: false }),
      supabase.from('njangis').select('id, name, amount, frequency, current_round, invite_code, owner_id').order('created_at', { ascending: false }),
      supabase.from('shared_spaces').select('id, name, invite_code, owner_id').order('created_at', { ascending: false }),
    ]);
    if (budget.error) throw budget.error;

    const pids = (projets.data || []).map((p) => p.id);
    const { data: contribs } = pids.length
      ? await supabase.from('project_contributions').select('project_id, amount').in('project_id', pids)
      : { data: [] };

    const nids = (njangis.data || []).map((x) => x.id);
    const [membres, paiements] = await Promise.all([
      nids.length ? supabase.from('njangi_members').select('njangi_id, user_id, name, position').in('njangi_id', nids) : { data: [] },
      nids.length ? supabase.from('njangi_payments').select('njangi_id, round, user_id').in('njangi_id', nids) : { data: [] },
    ]);

    const sids = (espaces.data || []).map((e) => e.id);
    const [membresEsp, mouvements] = await Promise.all([
      sids.length ? supabase.from('space_members').select('space_id, user_id, name, role').in('space_id', sids) : { data: [] },
      sids.length ? supabase.from('space_tx').select('space_id, user_id, name, kind, label, amount, created_at').in('space_id', sids).order('created_at', { ascending: false }) : { data: [] },
    ]);

    // `accounts.balance` est le solde de DÉPART, pas le solde d'aujourd'hui.
    // Chaque ligne de budget rattachée à un compte (`budget_entries.account_id`)
    // le fait bouger: une entrée l'augmente, une dépense le diminue. Lire
    // `balance` tel quel affichait Revolut à 31 au lieu de 19,1 et la caisse
    // d'épargne en positif alors qu'elle est à découvert.
    // Aucun filtre de mois ici, et c'est voulu: un solde est cumulatif.
    const soldeDe = (id) =>
      (budget.data || [])
        .filter((b) => b.account_id === id)
        .reduce((s2, b) => s2 + (b.kind === 'income' ? 1 : -1) * Number(b.actual || 0), 0);

    return {
      comptes: (comptes.data || []).map((c) => ({
        ...c,
        solde: Number(c.balance || 0) + soldeDe(c.id),
      })),
      espaces: (espaces.data || []).map((e) => {
        const tx = (mouvements.data || []).filter((m) => m.space_id === e.id);
        const entre = tx.filter((m) => m.kind === 'in').reduce((s2, m) => s2 + Number(m.amount || 0), 0);
        const sorti = tx.filter((m) => m.kind !== 'in').reduce((s2, m) => s2 + Number(m.amount || 0), 0);
        return { ...e, tx, entre, sorti, solde: entre - sorti,
                 membres: (membresEsp.data || []).filter((m) => m.space_id === e.id) };
      }),
      budget: budget.data || [],
      epargne: epargne.data || [],
      projets: (projets.data || []).map((p) => ({
        ...p,
        recu: (contribs || []).filter((c) => c.project_id === p.id)
          .reduce((s, c) => s + Number(c.amount || 0), 0),
      })),
      njangis: (njangis.data || []).map((x) => ({
        ...x,
        membres: (membres.data || []).filter((m) => m.njangi_id === x.id),
        payes: (paiements.data || []).filter((p) => p.njangi_id === x.id && p.round === x.current_round),
      })),
    };
  }, [user?.id, n]);

  // Même en attente, on reste dans la coque sombre: sans ça, le crème de la
  // place de marché apparaît une seconde avant l'application.
  const enveloppe = (contenu) => (
    <MoneyShell onglet={onglet} setOnglet={setOnglet} prenom={profile?.name} t={t}>
      <div className="px-4 pt-3">{contenu}</div>
    </MoneyShell>
  );
  if (loading) return enveloppe(<Skeleton className="h-40 w-full" />);
  if (error) return enveloppe(<ErrorState onRetry={recharger} />);
  if (!data) return null;

  return (
    <MoneyShell onglet={onglet} setOnglet={setOnglet} prenom={profile?.name} t={t}>
      <div className="px-4 pb-28 pt-3">
        {onglet === 'comptes' && <Comptes devise={devise} comptes={data.comptes} lang={lang} t={t} userId={user.id} onDone={recharger} />}
        {onglet === 'espaces' && <Espaces devise={devise} espaces={data.espaces} moi={user.id} lang={lang} t={t} onDone={recharger} />}
        {onglet === 'analyste' && (
          <Analyste devise={devise} lignes={data.budget} comptes={data.comptes} epargne={data.epargne} lang={lang} t={t} />
        )}
        {onglet === 'budget' && <Budget devise={devise} lignes={data.budget} lang={lang} t={t} userId={user.id} onDone={recharger} />}
        {onglet === 'epargne' && <Epargne devise={devise} objectifs={data.epargne} lang={lang} t={t} userId={user.id} onDone={recharger} />}
        {onglet === 'projets' && <Projets devise={devise} projets={data.projets} lang={lang} t={t} onDone={recharger} />}
        {onglet === 'njangi' && <Njangi devise={devise} njangis={data.njangis} moi={user.id} lang={lang} t={t} onDone={recharger} />}
      </div>
    </MoneyShell>
  );
}

/* ------------------------------- comptes ------------------------------ */

// Les comptes: Paypal, Revolut, la caisse, l'argent liquide. C'est la
// première chose qu'on veut voir en ouvrant — combien j'ai, et où.
// `color` et `glyph` étaient déjà en base et resservent tels quels.
function Comptes({ devise, comptes, lang, t, userId, onDone }) {
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState('');
  const [solde, setSolde] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const total = comptes.reduce((s2, c) => s2 + Number(c.solde || 0), 0);

  async function ajouter() {
    setEnvoi(true);
    try {
      const { error } = await supabase.from('accounts').insert({
        user_id: userId,
        name: nom.trim(),
        balance: Number(solde) || 0,
        glyph: nom.trim().charAt(0).toUpperCase(),
        color: COULEURS[Math.floor(Math.random() * COULEURS.length)],
      });
      if (error) throw error;
      setNom(''); setSolde(''); setOuvert(false); onDone();
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setEnvoi(false); }
  }

  return (
    <>
      {/* La grande carte violette de ses captures: « Total balance » en
          petit, le solde en très grand. C'est la première chose qu'on voit
          en ouvrant, et la seule qui compte. */}
      <div className="rounded-[20px] bg-gradient-to-br from-money-accent to-money-accent-soft p-5 text-white shadow-lg shadow-money-accent/20">
        <p className="text-body text-white/80">{t('money.total')}</p>
        <p className="mt-1 text-[40px] font-bold leading-none tracking-tight">{montant(total, lang, devise)}</p>
      </div>

      {/* « ACCOUNTS » à gauche, « + Add account » en petit à droite — pas un
          bouton large comme la page. */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-caption font-semibold uppercase tracking-wider text-money-muted">{t('money.tab.comptes')}</p>
        {!ouvert && (
          <button onClick={() => setOuvert(true)} className="flex items-center gap-1 text-body font-semibold text-money-accent">
            <IconPlus size={18} /> {t('money.addAccount')}
          </button>
        )}
      </div>

      {ouvert && (
        <div className="mt-3 space-y-2 rounded-card border border-money-line bg-money-card p-3">
          <Field label={t('money.accountName')} required>
            {(id) => <TextInput id={id} value={nom} onChange={(e) => setNom(e.target.value)} />}
          </Field>
          <Field label={t('money.accountBalance')}>
            {(id) => <TextInput id={id} type="number" inputMode="decimal" value={solde} onChange={(e) => setSolde(e.target.value)} />}
          </Field>
          <div className="flex gap-2">
            <Button onClick={ajouter} loading={envoi} disabled={nom.trim() === ''}>{t('common.add')}</Button>
            <Button variant="secondary" onClick={() => setOuvert(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}

      {comptes.length === 0 ? (
        <EmptyState title={t('money.noAccount')} />
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {comptes.map((c) => (
            <CarteCompte devise={devise} key={c.id} compte={c} lang={lang} t={t} onDone={onDone} />
          ))}
        </ul>
      )}
    </>
  );
}

// Une carte de compte: le crayon pour corriger, la croix pour retirer.
// Les deux manquaient — on pouvait ajouter un compte et plus jamais y toucher.
//
// ⚠️ On modifie `balance`, le solde de DÉPART, jamais le solde affiché: celui-ci
// est la somme du départ et des lignes de budget. L'écran le dit, sinon on
// tape « 19,1 » dans une case qui contient « 31 » et le compte se décale.
//
// Retirer un compte ne supprime AUCUNE ligne de budget: la clé étrangère est
// en `on delete set null`, les lignes restent et se détachent simplement.
function CarteCompte({ devise, compte: c, lang, t, onDone }) {
  const toast = useToast();
  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState(c.name || '');
  const [depart, setDepart] = useState(String(c.balance ?? ''));
  const [envoi, setEnvoi] = useState(false);

  const mouvements = Number(c.solde || 0) - Number(c.balance || 0);

  async function enregistrer() {
    setEnvoi(true);
    try {
      const { error } = await supabase.from('accounts')
        .update({ name: nom.trim(), balance: Number(depart) || 0 })
        .eq('id', c.id);
      if (error) throw error;
      setEdition(false);
      onDone();
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setEnvoi(false); }
  }

  async function retirer() {
    if (!window.confirm(t('money.removeAccountConfirm', { name: c.name }))) return;
    setEnvoi(true);
    try {
      const { error } = await supabase.from('accounts').delete().eq('id', c.id);
      if (error) throw error;
      onDone();
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setEnvoi(false); }
  }

  if (edition) {
    return (
      <li className="col-span-2 space-y-2 rounded-card border border-money-line p-3 bg-money-card">
        <Field label={t('money.accountName')} required>
          {(id) => <TextInput id={id} value={nom} onChange={(e) => setNom(e.target.value)} />}
        </Field>
        <Field label={t('money.openingBalance')} hint={t('money.openingBalanceHint')}>
          {(id) => <TextInput id={id} type="number" inputMode="decimal" value={depart} onChange={(e) => setDepart(e.target.value)} />}
        </Field>
        {mouvements !== 0 && (
          <p className="text-caption text-money-muted">
            {t('money.accountMovements', { amount: montant(mouvements, lang, devise), total: montant(c.solde, lang, devise) })}
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={enregistrer} loading={envoi} disabled={nom.trim() === ''}>{t('common.save')}</Button>
          <Button variant="secondary" onClick={() => { setEdition(false); setNom(c.name || ''); setDepart(String(c.balance ?? '')); }}>
            {t('common.cancel')}
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="relative rounded-card border border-money-line p-3 bg-money-card">
      <div className="absolute right-2 top-2 flex gap-1">
        <button type="button" onClick={() => setEdition(true)} aria-label={t('money.editAccount', { name: c.name })} className="p-1 text-money-muted">
          <IconPencil size={16} />
        </button>
        <button type="button" onClick={retirer} disabled={envoi} aria-label={t('money.removeAccount', { name: c.name })} className="p-1 text-money-muted">
          <IconX size={16} />
        </button>
      </div>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-card text-caption font-semibold text-white"
        style={{ backgroundColor: c.color || '#C25E38' }}
      >
        {c.glyph || (c.name || '?').charAt(0).toUpperCase()}
      </span>
      <p className="mt-2 truncate pr-12 text-caption text-money-muted">{c.name}</p>
      <p className={`text-body font-semibold ${Number(c.solde) < 0 ? 'text-money-danger' : 'text-money-ink'}`}>
        {montant(c.solde, lang, devise)}
      </p>
    </li>
  );
}

/* ------------------------------- espaces ------------------------------ */

// Un espace partagé: un compte commun avec quelqu'un. Qui a mis quoi, qui a
// sorti quoi. « L'activité (qui a payé) » est la seule question qui compte
// entre deux personnes qui partagent une caisse.
function Espaces({ devise, espaces, moi, lang, t, onDone }) {
  const toast = useToast();
  const [actif, setActif] = useState(null);
  const espace = espaces.find((e) => e.id === actif);

  async function mouvement(kind) {
    const label = window.prompt(t('money.txLabel'));
    if (label === null) return;
    const brut = window.prompt(t('money.txAmount'));
    if (brut === null) return;
    const somme = Number(String(brut).replace(',', '.'));
    if (!Number.isFinite(somme) || somme <= 0) { toast.error(t('money.txBadAmount')); return; }
    try {
      const { error } = await supabase.from('space_tx').insert({
        space_id: espace.id, user_id: moi, kind, label: label.trim() || null, amount: somme,
      });
      if (error) throw error;
      onDone();
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }

  if (espace) {
    return (
      <>
        <button onClick={() => setActif(null)} className="text-caption text-money-muted">‹ {t('money.allSpaces')}</button>
        <div className="mt-2 rounded-card bg-money-accent p-4 text-white">
          <p className="text-body font-semibold">{espace.name}</p>
          <p className="text-title">{montant(espace.solde, lang, devise)}</p>
          <div className="mt-1 flex gap-4 text-caption opacity-90">
            <span>{t('money.income')} {montant(espace.entre, lang, devise)}</span>
            <span>{t('money.spent')} {montant(espace.sorti, lang, devise)}</span>
          </div>
          {espace.invite_code && (
            <p className="mt-2 text-caption opacity-90">
              <IconLink size={12} className="inline" /> {espace.invite_code}
            </p>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={() => mouvement('in')} className="flex-1 rounded-pill bg-success px-3 py-2 text-body font-semibold text-white">
            + {t('money.moneyIn')}
          </button>
          <button onClick={() => mouvement('out')} className="flex-1 rounded-pill bg-danger px-3 py-2 text-body font-semibold text-white">
            + {t('money.moneyOut')}
          </button>
        </div>

        <div className="mt-4 rounded-card border border-money-line p-3 bg-money-card">
          <p className="text-caption font-semibold text-money-muted">{t('money.members')}</p>
          <ul className="mt-1 space-y-1">
            {espace.membres.map((m) => (
              <li key={m.user_id} className="flex justify-between text-body">
                <span className="truncate text-money-ink">
                  {m.name || t('work.someone')}{m.user_id === moi ? ` (${t('money.me')})` : ''}
                </span>
                <span className="shrink-0 text-caption text-money-muted">{m.role}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 rounded-card border border-money-line p-3 bg-money-card">
          <p className="text-caption font-semibold text-money-muted">{t('money.whoPaid')}</p>
          {espace.tx.length === 0 ? (
            <p className="mt-1 text-body text-money-muted">{t('money.noActivity')}</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {espace.tx.map((m, i) => (
                <li key={i} className="flex justify-between text-body">
                  <span className="truncate text-money-ink">
                    {m.label || t('money.movement')} · <span className="text-money-muted">{m.name || t('work.someone')}</span>
                  </span>
                  <span className={`shrink-0 font-semibold ${m.kind === 'in' ? 'text-money-success' : 'text-money-danger'}`}>
                    {m.kind === 'in' ? '+' : '−'}{montant(m.amount, lang, devise)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 rounded-card border border-money-line p-3 bg-money-card">
          <ChatEspace spaceId={espace.id} moi={moi} t={t} />
        </div>
      </>
    );
  }

  return (
    <>
      <CreerParSoiMeme
        table="shared_spaces"
        libelle={t('money.newSpace')}
        champs={[{ cle: 'name', libelle: 'money.spaceName' }]}
        t={t}
        onDone={onDone}
      />
      <RejoindreParCode rpc="join_space" libelle={t('money.joinSpace')} t={t} onDone={onDone} />
      {espaces.length === 0 ? (
        <EmptyState title={t('money.noSpace')} />
      ) : (
        <ul className="mt-4 space-y-2">
          {espaces.map((e) => (
            <li key={e.id}>
              <button onClick={() => setActif(e.id)} className="flex w-full items-center justify-between rounded-card border border-money-line p-3 text-left bg-money-card">
                <span className="min-w-0">
                  <span className="block truncate text-body font-semibold text-money-ink">{e.name}</span>
                  <span className="text-caption text-money-muted">
                    {t('money.memberCount', { count: e.membres.length })}
                  </span>
                </span>
                <span className="shrink-0 text-body font-semibold text-money-accent">{montant(e.solde, lang, devise)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ------------------------------- budget ------------------------------- */

// Le budget est MENSUEL, et je l'avais raté.
//
// La colonne `period` ('2026-06') existait depuis le premier Finjaro, et les
// captures de Beau montrent un sélecteur de mois en haut de l'écran. Sans
// lui, les sept lignes de juin s'affichaient comme si elles étaient de
// septembre: un budget qui additionne tous les mois ne veut rien dire.
//
// La méthode, écrite à l'écran dans l'ancienne version: on PRÉVOIT en début
// de mois, on saisit le RÉEL au fil du mois, on compare. Le prévu n'est pas
// un souhait, c'est le point de comparaison.
function moisCourant() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function moisVoisin(p, pas) {
  const [a, m] = p.split('-').map(Number);
  const d = new Date(a, m - 1 + pas, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function Budget({ devise, lignes: toutes, lang, t, userId, onDone }) {
  const toast = useToast();
  const [periode, setPeriode] = useState(moisCourant());
  const lignes = toutes.filter((l) => (l.period || moisCourant()) === periode);
  const [ouvert, setOuvert] = useState(false);
  const [kind, setKind] = useState('expense');
  const [cat, setCat] = useState('');
  const [prevu, setPrevu] = useState('');
  const [reel, setReel] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const revenus = lignes.filter((l) => l.kind === 'income');
  const depenses = lignes.filter((l) => l.kind !== 'income');
  const somme = (liste, champ) => liste.reduce((s, l) => s + Number(l[champ] || 0), 0);
  // Ce qui reste: ce qui est VRAIMENT entré moins ce qui est VRAIMENT sorti.
  // Le prévu sert à comparer, pas à se rassurer.
  const reste = somme(revenus, 'actual') - somme(depenses, 'actual');

  async function ajouter() {
    setEnvoi(true);
    try {
      const { error } = await supabase.from('budget_entries').insert({
        user_id: userId,
        kind,
        category: cat.trim(),
        planned: Number(prevu) || 0,
        actual: Number(reel) || 0,
        period: periode,
      });
      if (error) throw error;
      setCat(''); setPrevu(''); setReel(''); setOuvert(false);
      onDone();
    } catch (e) {
      toast.error(e.message || t('errors.generic'));
    } finally { setEnvoi(false); }
  }

  // Reprendre les lignes du mois précédent: le loyer, l'abonnement, le
  // transport ne changent pas. Les retaper chaque mois est ce qui fait
  // abandonner un budget.
  async function reporter() {
    const avant = toutes.filter((l) => l.period === moisVoisin(periode, -1));
    if (avant.length === 0) { toast.error(t('money.nothingToCarry')); return; }
    try {
      const { error } = await supabase.from('budget_entries').insert(
        avant.map((l) => ({
          user_id: userId, kind: l.kind, category: l.category,
          planned: l.planned, actual: 0, period: periode,
        })),
      );
      if (error) throw error;
      onDone();
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }

  const nomMois = new Date(`${periode}-01T00:00:00`).toLocaleDateString(lang, { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setPeriode(moisVoisin(periode, -1))} aria-label={t('money.prevMonth')}
          className="rounded-pill border border-money-line px-3 py-1 text-body text-money-ink">‹</button>
        <div className="text-center">
          <p className="text-body font-semibold text-money-ink">{nomMois}</p>
          {periode === moisCourant() && <p className="text-caption text-money-muted">{t('money.thisMonth')}</p>}
        </div>
        <button onClick={() => setPeriode(moisVoisin(periode, 1))} aria-label={t('money.nextMonth')}
          className="rounded-pill border border-money-line px-3 py-1 text-body text-money-ink">›</button>
      </div>

      {lignes.length === 0 && (
        <button onClick={reporter} className="mb-3 w-full rounded-card border border-money-line px-3 py-2 text-caption font-semibold text-money-ink bg-money-card">
          {t('money.carryOver')}
        </button>
      )}

      <div className="rounded-card border border-money-line p-3 bg-money-card">
        <p className="text-caption text-money-muted">{t('money.remaining')}</p>
        <p className={`text-title ${reste < 0 ? 'text-money-danger' : 'text-money-accent'}`}>{montant(reste, lang, devise)}</p>
        <div className="mt-2 flex justify-between text-caption text-money-muted">
          <span>{t('money.income')} {montant(somme(revenus, 'actual'), lang, devise)}</span>
          <span>{t('money.spent')} {montant(somme(depenses, 'actual'), lang, devise)}</span>
        </div>
      </div>

      {!ouvert ? (
        <button onClick={() => setOuvert(true)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-pill bg-money-accent px-3 py-2 text-body font-semibold text-white">
          <IconPlus size={18} /> {t('money.addLine')}
        </button>
      ) : (
        <div className="mt-3 space-y-2 rounded-card border border-money-line p-3 bg-money-card">
          <Field label={t('money.kind')}>
            {(id) => (
              <Select id={id} value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="expense">{t('money.expense')}</option>
                <option value="income">{t('money.incomeOne')}</option>
              </Select>
            )}
          </Field>
          <Field label={t('money.category')} required>
            {(id) => <TextInput id={id} value={cat} onChange={(e) => setCat(e.target.value)} />}
          </Field>
          <div className="flex gap-2">
            <Field label={t('money.planned')}>
              {(id) => <TextInput id={id} type="number" inputMode="numeric" value={prevu} onChange={(e) => setPrevu(e.target.value)} />}
            </Field>
            <Field label={t('money.actual')}>
              {(id) => <TextInput id={id} type="number" inputMode="numeric" value={reel} onChange={(e) => setReel(e.target.value)} />}
            </Field>
          </div>
          <div className="flex gap-2">
            <Button onClick={ajouter} loading={envoi} disabled={cat.trim() === ''}>{t('common.add')}</Button>
            <Button variant="secondary" onClick={() => setOuvert(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}

      {lignes.length === 0 ? (
        <EmptyState title={t('money.noBudget')} />
      ) : (
        <ul className="mt-4 space-y-2">
          {lignes.map((l) => {
            const depasse = l.kind !== 'income' && Number(l.actual) > Number(l.planned) && Number(l.planned) > 0;
            return (
              <li key={l.id} className="flex items-center justify-between rounded-card border border-money-line p-3 bg-money-card">
                <div className="min-w-0">
                  <p className="truncate text-body text-money-ink">{l.category}</p>
                  <p className="text-caption text-money-muted">
                    {t('money.plannedShort')} {montant(l.planned, lang, devise)}
                  </p>
                </div>
                <span className={`shrink-0 text-body font-semibold ${depasse ? 'text-money-danger' : 'text-money-ink'}`}>
                  {l.kind === 'income' ? '+' : '−'}{montant(l.actual, lang, devise)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/* ------------------------------- épargne ------------------------------ */

function Epargne({ devise, objectifs, lang, t, userId, onDone }) {
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState('');
  const [cible, setCible] = useState('');
  const [envoi, setEnvoi] = useState(false);

  async function ajouter() {
    setEnvoi(true);
    try {
      const { error } = await supabase.from('savings_goals').insert({
        user_id: userId, name: nom.trim(), target: Number(cible) || 0, saved: 0,
      });
      if (error) throw error;
      setNom(''); setCible(''); setOuvert(false); onDone();
    } catch (e) {
      toast.error(e.message || t('errors.generic'));
    } finally { setEnvoi(false); }
  }

  async function mettre(o, combien) {
    try {
      const { error } = await supabase
        .from('savings_goals')
        .update({ saved: Math.max(0, Number(o.saved || 0) + combien) })
        .eq('id', o.id);
      if (error) throw error;
      onDone();
    } catch (e) { toast.error(e.message || t('errors.generic')); }
  }

  const misDeCote = objectifs.reduce((s2, o) => s2 + Number(o.saved || 0), 0);
  const vise = objectifs.reduce((s2, o) => s2 + Number(o.target || 0), 0);

  return (
    <>
      {objectifs.length > 0 && (
        <div className="mb-3 rounded-card border border-money-line p-3 bg-money-card">
          <p className="text-caption text-money-muted">{t('money.setAsideTotal')}</p>
          <p className="text-title text-money-accent">{montant(misDeCote, lang, devise)}</p>
          {vise > 0 && (
            <p className="text-caption text-money-muted">{t('money.ofTarget', { target: montant(vise, lang, devise) })}</p>
          )}
        </div>
      )}

      {!ouvert ? (
        <button onClick={() => setOuvert(true)} className="flex w-full items-center justify-center gap-1 rounded-pill bg-money-accent px-3 py-2 text-body font-semibold text-white">
          <IconTargetArrow size={18} /> {t('money.newGoal')}
        </button>
      ) : (
        <div className="space-y-2 rounded-card border border-money-line p-3 bg-money-card">
          <Field label={t('money.goalName')} required>
            {(id) => <TextInput id={id} value={nom} onChange={(e) => setNom(e.target.value)} />}
          </Field>
          <Field label={t('money.goalTarget')} required>
            {(id) => <TextInput id={id} type="number" inputMode="numeric" value={cible} onChange={(e) => setCible(e.target.value)} />}
          </Field>
          <div className="flex gap-2">
            <Button onClick={ajouter} loading={envoi} disabled={nom.trim() === '' || !Number(cible)}>{t('common.add')}</Button>
            <Button variant="secondary" onClick={() => setOuvert(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      )}

      {objectifs.length === 0 ? (
        <EmptyState title={t('money.noGoal')} />
      ) : (
        <ul className="mt-4 space-y-3">
          {objectifs.map((o) => (
            <CarteObjectif devise={devise} key={o.id} objectif={o} lang={lang} t={t} onDone={onDone} />
          ))}
        </ul>
      )}
    </>
  );
}

// Un objectif d'épargne: la barre, le crayon, la croix, et un montant LIBRE.
//
// ⚠️ Les deux boutons « + 1 000 » et « + 5 000 » qui étaient là supposaient un
// pays. Pour quelqu'un dont les comptes sont en euros — et c'est le cas des
// données réelles, un compte à 0,16 et un autre à 22,88 — proposer d'ajouter
// 1 000 d'un coup n'a aucun sens. On laisse la personne taper ce qu'elle a
// mis de côté, dans SA monnaie, comme partout ailleurs sur cet écran.
function CarteObjectif({ devise, objectif: o, lang, t, onDone }) {
  const toast = useToast();
  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState(o.name || '');
  const [cible, setCible] = useState(String(o.target ?? ''));
  const [ajout, setAjout] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const pct = Number(o.target) > 0
    ? Math.min(100, Math.round((Number(o.saved) / Number(o.target)) * 100))
    : 0;

  async function mettre() {
    const combien = Number(ajout);
    if (!Number.isFinite(combien) || combien === 0) return;
    setEnvoi(true);
    try {
      const { error } = await supabase
        .from('savings_goals')
        .update({ saved: Math.max(0, Number(o.saved || 0) + combien) })
        .eq('id', o.id);
      if (error) throw error;
      setAjout('');
      onDone();
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setEnvoi(false); }
  }

  async function enregistrer() {
    setEnvoi(true);
    try {
      const { error } = await supabase.from('savings_goals')
        .update({ name: nom.trim(), target: Number(cible) || 0 })
        .eq('id', o.id);
      if (error) throw error;
      setEdition(false);
      onDone();
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setEnvoi(false); }
  }

  async function retirer() {
    if (!window.confirm(t('money.removeGoalConfirm', { name: o.name }))) return;
    setEnvoi(true);
    try {
      const { error } = await supabase.from('savings_goals').delete().eq('id', o.id);
      if (error) throw error;
      onDone();
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setEnvoi(false); }
  }

  if (edition) {
    return (
      <li className="space-y-2 rounded-card border border-money-line p-3 bg-money-card">
        <Field label={t('money.goalName')} required>
          {(id) => <TextInput id={id} value={nom} onChange={(e) => setNom(e.target.value)} />}
        </Field>
        <Field label={t('money.goalTarget')} required>
          {(id) => <TextInput id={id} type="number" inputMode="decimal" value={cible} onChange={(e) => setCible(e.target.value)} />}
        </Field>
        <div className="flex gap-2">
          <Button onClick={enregistrer} loading={envoi} disabled={nom.trim() === '' || !Number(cible)}>{t('common.save')}</Button>
          <Button variant="secondary" onClick={() => { setEdition(false); setNom(o.name || ''); setCible(String(o.target ?? '')); }}>
            {t('common.cancel')}
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-card border border-money-line p-3 bg-money-card">
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-body font-semibold text-money-ink">{o.name}</p>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-caption text-money-muted">{pct} %</span>
          <button type="button" onClick={() => setEdition(true)} aria-label={t('money.editGoal', { name: o.name })} className="p-1 text-money-muted">
            <IconPencil size={16} />
          </button>
          <button type="button" onClick={retirer} disabled={envoi} aria-label={t('money.removeGoal', { name: o.name })} className="p-1 text-money-muted">
            <IconX size={16} />
          </button>
        </div>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-white/10">
        <div className="h-full rounded-pill bg-money-accent" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-caption text-money-muted">
        {montant(o.saved, lang, devise)} / {montant(o.target, lang, devise)}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <TextInput
          type="number"
          inputMode="decimal"
          value={ajout}
          onChange={(e) => setAjout(e.target.value)}
          placeholder={t('money.addAmount')}
          aria-label={t('money.addToGoal', { name: o.name })}
        />
        <Button onClick={mettre} loading={envoi} disabled={!Number(ajout)}>{t('common.add')}</Button>
      </div>
    </li>
  );
}

/* ------------------------------- projets ------------------------------ */

function Projets({ devise, projets, lang, t, onDone }) {
  return (
    <>
      <CreerParSoiMeme
        table="projects"
        libelle={t('money.newProject')}
        champs={[
          { cle: 'name', libelle: 'money.projectName' },
          { cle: 'emoji', libelle: 'money.projectEmoji' },
          { cle: 'goal', libelle: 'money.projectGoal', type: 'number', aide: 'money.amountInYourCurrency' },
        ]}
        t={t}
        onDone={onDone}
      />
      <RejoindreParCode rpc="join_project" libelle={t('money.joinProject')} t={t} onDone={onDone} />
      {projets.length === 0 ? (
        <EmptyState title={t('money.noProject')} />
      ) : (
        <ul className="mt-4 space-y-3">
          {projets.map((p) => {
            const pct = Number(p.goal) > 0 ? Math.min(100, Math.round((p.recu / Number(p.goal)) * 100)) : 0;
            return (
              <li key={p.id} className="rounded-card border border-money-line p-3 bg-money-card">
                <div className="flex items-baseline justify-between">
                  <p className="truncate text-body font-semibold text-money-ink">
                    {p.emoji ? `${p.emoji} ` : ''}{p.name}
                  </p>
                  {p.invite_code && (
                    <span className="shrink-0 text-caption text-money-muted"><IconLink size={12} className="inline" /> {p.invite_code}</span>
                  )}
                </div>
                {Number(p.goal) > 0 && (
                  <>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-white/10">
                      <div className="h-full rounded-pill bg-money-gold" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-caption text-money-muted">
                      {montant(p.recu, lang, devise)} / {montant(p.goal, lang, devise)}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/* -------------------------------- njangi ------------------------------ */

function Njangi({ devise, njangis, moi, lang, t, onDone }) {
  return (
    <>
      <CreerParSoiMeme
        table="njangis"
        libelle={t('money.newNjangi')}
        champs={[
          { cle: 'name', libelle: 'money.njangiName' },
          { cle: 'amount', libelle: 'money.njangiAmount', type: 'number', aide: 'money.amountInYourCurrency' },
          { cle: 'frequency', libelle: 'money.njangiFrequency', options: [
            { valeur: 'monthly', libelle: 'money.freq.monthly' },
            { valeur: 'weekly', libelle: 'money.freq.weekly' },
            { valeur: 'daily', libelle: 'money.freq.daily' },
          ] },
        ]}
        t={t}
        onDone={onDone}
      />
      <RejoindreParCode rpc="join_njangi" libelle={t('money.joinNjangi')} t={t} onDone={onDone} />
      {njangis.length === 0 ? (
        <EmptyState title={t('money.noNjangi')} />
      ) : (
        <ul className="mt-4 space-y-3">
          {njangis.map((x) => {
            // Le tour en cours: qui a payé, qui n'a pas encore. C'est la
            // seule question qu'on se pose dans un njangi.
            const paye = new Set(x.payes.map((p) => p.user_id));
            const beneficiaire = x.membres.find((m) => m.position === x.current_round);
            return (
              <li key={x.id} className="rounded-card border border-money-line p-3 bg-money-card">
                <div className="flex items-baseline justify-between">
                  <p className="truncate text-body font-semibold text-money-ink">{x.name}</p>
                  <span className="shrink-0 text-caption text-money-muted">
                    {t('money.round')} {x.current_round}
                  </span>
                </div>
                <p className="text-caption text-money-muted">
                  {montant(x.amount, lang, devise)}{x.frequency ? ` · ${t(`money.freq.${x.frequency}`, { defaultValue: x.frequency })}` : ''}
                </p>
                {beneficiaire && (
                  <p className="mt-1 text-caption text-brass">
                    {t('money.thisRoundFor', { name: beneficiaire.name || t('work.someone') })}
                  </p>
                )}
                <ul className="mt-2 space-y-1">
                  {x.membres.map((m) => (
                    <li key={m.user_id} className="flex items-center justify-between text-body">
                      <span className="truncate text-money-ink">
                        {m.name || t('work.someone')}{m.user_id === moi ? ` (${t('money.me')})` : ''}
                      </span>
                      {paye.has(m.user_id)
                        ? <IconCheck size={16} className="shrink-0 text-money-success" />
                        : <span className="shrink-0 text-caption text-money-muted">{t('money.notPaid')}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/* ---------------------------- rejoindre ------------------------------- */

// Un njangi, un projet et un espace se rejoignent par un CODE qu'on reçoit
// sur WhatsApp. Les fonctions `join_*` existent en base depuis le premier
// Finjaro; seuls les écrans manquaient.
// Créer un projet, un njangi ou un espace.
//
// Jusqu'ici on ne pouvait que REJOINDRE celui de quelqu'un d'autre, avec un
// code. Personne ne pouvait commencer le sien — c'est le trou que Beau a vu
// sur ses captures de l'ancienne application.
//
// Rien à ajouter en base, vérifié le 22/09 sur la production: les trois
// tables acceptent déjà la création (`with check (owner_id = auth.uid())`),
// `owner_id` et le code d'invitation ont leurs valeurs par défaut, et trois
// déclencheurs qui existaient DÉJÀ — `on_project_created`,
// `on_space_created`, `on_njangi_created` — inscrivent la créatrice comme
// `admin`, en position 1 pour un njangi. J'avais écrit une migration pour
// faire ça; elle faisait doublon et je l'ai retirée.
function CreerParSoiMeme({ table, libelle, champs, t, onDone }) {
  const toast = useToast();
  const { user } = useAuth();
  const [ouvert, setOuvert] = useState(false);
  const [valeurs, setValeurs] = useState({});
  const [envoi, setEnvoi] = useState(false);

  const nom = String(valeurs.name ?? '').trim();

  async function creer() {
    setEnvoi(true);
    try {
      const ligne = { owner_id: user.id, name: nom };
      champs.forEach((c) => {
        if (c.cle === 'name') return;
        const v = valeurs[c.cle];
        if (v === undefined || v === '') return;
        ligne[c.cle] = c.type === 'number' ? Number(v) || 0 : v;
      });
      const { error } = await supabase.from(table).insert(ligne);
      if (error) throw error;
      setValeurs({}); setOuvert(false); onDone();
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setEnvoi(false); }
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="mb-3 flex w-full items-center justify-center gap-1 rounded-pill bg-money-accent px-3 py-2 text-body font-semibold text-white"
      >
        <IconPlus size={18} /> {libelle}
      </button>
    );
  }

  return (
    <div className="mb-3 space-y-2 rounded-card border border-money-line p-3 bg-money-card">
      {champs.map((c) => (
        <Field key={c.cle} label={t(c.libelle)} hint={c.aide ? t(c.aide) : undefined} required={c.cle === 'name'}>
          {(id) =>
            c.options ? (
              <Select id={id} value={valeurs[c.cle] ?? c.options[0].valeur}
                onChange={(e) => setValeurs((v) => ({ ...v, [c.cle]: e.target.value }))}>
                {c.options.map((o) => <option key={o.valeur} value={o.valeur}>{t(o.libelle)}</option>)}
              </Select>
            ) : (
              <TextInput id={id} type={c.type === 'number' ? 'number' : 'text'}
                inputMode={c.type === 'number' ? 'decimal' : undefined}
                value={valeurs[c.cle] ?? ''}
                onChange={(e) => setValeurs((v) => ({ ...v, [c.cle]: e.target.value }))} />
            )
          }
        </Field>
      ))}
      <div className="flex gap-2">
        <Button onClick={creer} loading={envoi} disabled={nom === ''}>{t('common.create')}</Button>
        <Button variant="secondary" onClick={() => { setOuvert(false); setValeurs({}); }}>{t('common.cancel')}</Button>
      </div>
    </div>
  );
}

function RejoindreParCode({ rpc, libelle, t, onDone }) {
  const toast = useToast();
  const { profile } = useAuth();
  const [code, setCode] = useState('');
  const [envoi, setEnvoi] = useState(false);

  async function rejoindre() {
    setEnvoi(true);
    try {
      const { error } = await supabase.rpc(rpc, {
        code: code.trim(),
        display_name: profile?.name || null,
      });
      if (error) throw error;
      setCode('');
      onDone();
    } catch (e) {
      toast.error(e.message || t('errors.generic'));
    } finally { setEnvoi(false); }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Field label={libelle}>
          {(id) => <TextInput id={id} value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('money.codePlaceholder')} />}
        </Field>
      </div>
      <Button onClick={rejoindre} loading={envoi} disabled={code.trim() === ''}>
        <IconUsersGroup size={18} />
      </Button>
    </div>
  );
}
