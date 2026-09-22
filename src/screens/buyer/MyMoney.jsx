import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconPigMoney, IconTargetArrow, IconUsersGroup, IconRepeat,
  IconPlus, IconCheck, IconLink,
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Field, TextInput, Select } from '../../components/Field';
import { Skeleton, ErrorState, EmptyState } from '../../components/states';

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

const ONGLETS = ['comptes', 'budget', 'epargne', 'njangi', 'projets', 'espaces'];

// Les centimes comptent — vu à l'écran le 22/09: un compte Paypal à 0,16 €
// s'affichait « 0 » et 22,88 € s'affichait « 23 ». J'arrondissais comme du
// FCFA, qui n'a pas de centimes. Un montant entier reste affiché sans
// décimales; seul ce qui en a les garde.
function montant(n, lang) {
  return new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(Number(n) || 0);
}

export default function MyMoney() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
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

    return {
      comptes: comptes.data || [],
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

  if (loading) return <Skeleton />;
  if (error) return <ErrorState onRetry={recharger} />;
  if (!data) return null;

  return (
    <div>
      <AppHeader title={t('money.title')} />

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-hairline px-4 pb-2 pt-1">
        {ONGLETS.map((o) => (
          <button
            key={o}
            onClick={() => setOnglet(o)}
            className={`shrink-0 rounded-pill px-3 py-1 text-caption font-semibold ${
              onglet === o ? 'bg-teal text-white' : 'border border-hairline text-muted'
            }`}
          >
            {t(`money.tab.${o}`)}
          </button>
        ))}
      </div>

      <div className="px-4 pb-24 pt-3">
        {onglet === 'comptes' && <Comptes comptes={data.comptes} lang={lang} t={t} userId={user.id} onDone={recharger} />}
        {onglet === 'espaces' && <Espaces espaces={data.espaces} moi={user.id} lang={lang} t={t} onDone={recharger} />}
        {onglet === 'budget' && <Budget lignes={data.budget} lang={lang} t={t} userId={user.id} onDone={recharger} />}
        {onglet === 'epargne' && <Epargne objectifs={data.epargne} lang={lang} t={t} userId={user.id} onDone={recharger} />}
        {onglet === 'projets' && <Projets projets={data.projets} lang={lang} t={t} onDone={recharger} />}
        {onglet === 'njangi' && <Njangi njangis={data.njangis} moi={user.id} lang={lang} t={t} onDone={recharger} />}
      </div>
    </div>
  );
}

/* ------------------------------- comptes ------------------------------ */

// Les comptes: Paypal, Revolut, la caisse, l'argent liquide. C'est la
// première chose qu'on veut voir en ouvrant — combien j'ai, et où.
// `color` et `glyph` étaient déjà en base et resservent tels quels.
function Comptes({ comptes, lang, t, userId, onDone }) {
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState('');
  const [solde, setSolde] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const total = comptes.reduce((s2, c) => s2 + Number(c.balance || 0), 0);

  async function ajouter() {
    setEnvoi(true);
    try {
      const { error } = await supabase.from('accounts').insert({
        user_id: userId,
        name: nom.trim(),
        balance: Number(solde) || 0,
        glyph: nom.trim().charAt(0).toUpperCase(),
        color: '#C25E38',
      });
      if (error) throw error;
      setNom(''); setSolde(''); setOuvert(false); onDone();
    } catch (e) { toast.error(e.message || t('errors.generic')); }
    finally { setEnvoi(false); }
  }

  return (
    <>
      <div className="rounded-card border border-hairline p-3">
        <p className="text-caption text-muted">{t('money.total')}</p>
        <p className={`text-title ${total < 0 ? 'text-danger' : 'text-teal'}`}>{montant(total, lang)}</p>
      </div>

      {!ouvert ? (
        <button onClick={() => setOuvert(true)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-pill bg-teal px-3 py-2 text-body font-semibold text-white">
          <IconPlus size={18} /> {t('money.addAccount')}
        </button>
      ) : (
        <div className="mt-3 space-y-2 rounded-card border border-hairline p-3">
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
            <li key={c.id} className="rounded-card border border-hairline p-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-card text-caption font-semibold text-white"
                style={{ backgroundColor: c.color || '#C25E38' }}
              >
                {c.glyph || (c.name || '?').charAt(0).toUpperCase()}
              </span>
              <p className="mt-2 truncate text-caption text-muted">{c.name}</p>
              <p className={`text-body font-semibold ${Number(c.balance) < 0 ? 'text-danger' : 'text-ink'}`}>
                {montant(c.balance, lang)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ------------------------------- espaces ------------------------------ */

// Un espace partagé: un compte commun avec quelqu'un. Qui a mis quoi, qui a
// sorti quoi. « L'activité (qui a payé) » est la seule question qui compte
// entre deux personnes qui partagent une caisse.
function Espaces({ espaces, moi, lang, t, onDone }) {
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
        <button onClick={() => setActif(null)} className="text-caption text-muted">‹ {t('money.allSpaces')}</button>
        <div className="mt-2 rounded-card bg-teal p-4 text-white">
          <p className="text-body font-semibold">{espace.name}</p>
          <p className="text-title">{montant(espace.solde, lang)}</p>
          <div className="mt-1 flex gap-4 text-caption opacity-90">
            <span>{t('money.income')} {montant(espace.entre, lang)}</span>
            <span>{t('money.spent')} {montant(espace.sorti, lang)}</span>
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

        <div className="mt-4 rounded-card border border-hairline p-3">
          <p className="text-caption font-semibold text-muted">{t('money.members')}</p>
          <ul className="mt-1 space-y-1">
            {espace.membres.map((m) => (
              <li key={m.user_id} className="flex justify-between text-body">
                <span className="truncate text-ink">
                  {m.name || t('work.someone')}{m.user_id === moi ? ` (${t('money.me')})` : ''}
                </span>
                <span className="shrink-0 text-caption text-muted">{m.role}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 rounded-card border border-hairline p-3">
          <p className="text-caption font-semibold text-muted">{t('money.whoPaid')}</p>
          {espace.tx.length === 0 ? (
            <p className="mt-1 text-body text-muted">{t('money.noActivity')}</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {espace.tx.map((m, i) => (
                <li key={i} className="flex justify-between text-body">
                  <span className="truncate text-ink">
                    {m.label || t('money.movement')} · <span className="text-muted">{m.name || t('work.someone')}</span>
                  </span>
                  <span className={`shrink-0 font-semibold ${m.kind === 'in' ? 'text-success' : 'text-danger'}`}>
                    {m.kind === 'in' ? '+' : '−'}{montant(m.amount, lang)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <RejoindreParCode rpc="join_space" libelle={t('money.joinSpace')} t={t} onDone={onDone} />
      {espaces.length === 0 ? (
        <EmptyState title={t('money.noSpace')} />
      ) : (
        <ul className="mt-4 space-y-2">
          {espaces.map((e) => (
            <li key={e.id}>
              <button onClick={() => setActif(e.id)} className="flex w-full items-center justify-between rounded-card border border-hairline p-3 text-left">
                <span className="min-w-0">
                  <span className="block truncate text-body font-semibold text-ink">{e.name}</span>
                  <span className="text-caption text-muted">
                    {t('money.memberCount', { count: e.membres.length })}
                  </span>
                </span>
                <span className="shrink-0 text-body font-semibold text-teal">{montant(e.solde, lang)}</span>
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

function Budget({ lignes: toutes, lang, t, userId, onDone }) {
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
          className="rounded-pill border border-hairline px-3 py-1 text-body text-ink">‹</button>
        <div className="text-center">
          <p className="text-body font-semibold text-ink">{nomMois}</p>
          {periode === moisCourant() && <p className="text-caption text-muted">{t('money.thisMonth')}</p>}
        </div>
        <button onClick={() => setPeriode(moisVoisin(periode, 1))} aria-label={t('money.nextMonth')}
          className="rounded-pill border border-hairline px-3 py-1 text-body text-ink">›</button>
      </div>

      {lignes.length === 0 && (
        <button onClick={reporter} className="mb-3 w-full rounded-card border border-hairline px-3 py-2 text-caption font-semibold text-ink">
          {t('money.carryOver')}
        </button>
      )}

      <div className="rounded-card border border-hairline p-3">
        <p className="text-caption text-muted">{t('money.remaining')}</p>
        <p className={`text-title ${reste < 0 ? 'text-danger' : 'text-teal'}`}>{montant(reste, lang)}</p>
        <div className="mt-2 flex justify-between text-caption text-muted">
          <span>{t('money.income')} {montant(somme(revenus, 'actual'), lang)}</span>
          <span>{t('money.spent')} {montant(somme(depenses, 'actual'), lang)}</span>
        </div>
      </div>

      {!ouvert ? (
        <button onClick={() => setOuvert(true)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-pill bg-teal px-3 py-2 text-body font-semibold text-white">
          <IconPlus size={18} /> {t('money.addLine')}
        </button>
      ) : (
        <div className="mt-3 space-y-2 rounded-card border border-hairline p-3">
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
              <li key={l.id} className="flex items-center justify-between rounded-card border border-hairline p-3">
                <div className="min-w-0">
                  <p className="truncate text-body text-ink">{l.category}</p>
                  <p className="text-caption text-muted">
                    {t('money.plannedShort')} {montant(l.planned, lang)}
                  </p>
                </div>
                <span className={`shrink-0 text-body font-semibold ${depasse ? 'text-danger' : 'text-ink'}`}>
                  {l.kind === 'income' ? '+' : '−'}{montant(l.actual, lang)}
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

function Epargne({ objectifs, lang, t, userId, onDone }) {
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

  return (
    <>
      {!ouvert ? (
        <button onClick={() => setOuvert(true)} className="flex w-full items-center justify-center gap-1 rounded-pill bg-teal px-3 py-2 text-body font-semibold text-white">
          <IconTargetArrow size={18} /> {t('money.newGoal')}
        </button>
      ) : (
        <div className="space-y-2 rounded-card border border-hairline p-3">
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
          {objectifs.map((o) => {
            const pct = Number(o.target) > 0
              ? Math.min(100, Math.round((Number(o.saved) / Number(o.target)) * 100))
              : 0;
            return (
              <li key={o.id} className="rounded-card border border-hairline p-3">
                <div className="flex items-baseline justify-between">
                  <p className="truncate text-body font-semibold text-ink">{o.name}</p>
                  <span className="shrink-0 text-caption text-muted">{pct} %</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-black/[0.06]">
                  <div className="h-full rounded-pill bg-teal" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-caption text-muted">
                  {montant(o.saved, lang)} / {montant(o.target, lang)}
                </p>
                <div className="mt-2 flex gap-2">
                  {[1000, 5000].map((v) => (
                    <button key={v} onClick={() => mettre(o, v)}
                      className="rounded-pill border border-hairline px-3 py-1 text-caption font-semibold text-ink">
                      + {montant(v, lang)}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/* ------------------------------- projets ------------------------------ */

function Projets({ projets, lang, t, onDone }) {
  return (
    <>
      <RejoindreParCode rpc="join_project" libelle={t('money.joinProject')} t={t} onDone={onDone} />
      {projets.length === 0 ? (
        <EmptyState title={t('money.noProject')} />
      ) : (
        <ul className="mt-4 space-y-3">
          {projets.map((p) => {
            const pct = Number(p.goal) > 0 ? Math.min(100, Math.round((p.recu / Number(p.goal)) * 100)) : 0;
            return (
              <li key={p.id} className="rounded-card border border-hairline p-3">
                <div className="flex items-baseline justify-between">
                  <p className="truncate text-body font-semibold text-ink">
                    {p.emoji ? `${p.emoji} ` : ''}{p.name}
                  </p>
                  {p.invite_code && (
                    <span className="shrink-0 text-caption text-muted"><IconLink size={12} className="inline" /> {p.invite_code}</span>
                  )}
                </div>
                {Number(p.goal) > 0 && (
                  <>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-black/[0.06]">
                      <div className="h-full rounded-pill bg-brass" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-caption text-muted">
                      {montant(p.recu, lang)} / {montant(p.goal, lang)}
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

function Njangi({ njangis, moi, lang, t, onDone }) {
  return (
    <>
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
              <li key={x.id} className="rounded-card border border-hairline p-3">
                <div className="flex items-baseline justify-between">
                  <p className="truncate text-body font-semibold text-ink">{x.name}</p>
                  <span className="shrink-0 text-caption text-muted">
                    {t('money.round')} {x.current_round}
                  </span>
                </div>
                <p className="text-caption text-muted">
                  {montant(x.amount, lang)}{x.frequency ? ` · ${t(`money.freq.${x.frequency}`, { defaultValue: x.frequency })}` : ''}
                </p>
                {beneficiaire && (
                  <p className="mt-1 text-caption text-brass">
                    {t('money.thisRoundFor', { name: beneficiaire.name || t('work.someone') })}
                  </p>
                )}
                <ul className="mt-2 space-y-1">
                  {x.membres.map((m) => (
                    <li key={m.user_id} className="flex items-center justify-between text-body">
                      <span className="truncate text-ink">
                        {m.name || t('work.someone')}{m.user_id === moi ? ` (${t('money.me')})` : ''}
                      </span>
                      {paye.has(m.user_id)
                        ? <IconCheck size={16} className="shrink-0 text-success" />
                        : <span className="shrink-0 text-caption text-muted">{t('money.notPaid')}</span>}
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
