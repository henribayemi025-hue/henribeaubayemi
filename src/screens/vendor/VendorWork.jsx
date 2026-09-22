import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconPlus, IconCircleCheck, IconCamera, IconMapPin, IconClock,
  IconUserPlus, IconAlertTriangle,
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Field, TextInput, Select } from '../../components/Field';
import { Skeleton, ErrorState, EmptyState } from '../../components/states';

// Finjaro Work — la preuve, pas la discussion.
//
// WhatsApp reste pour parler. Ici on assigne une tâche, quelqu'un la fait, et
// il en reste une trace datée par le SERVEUR — pas par le téléphone — que
// personne ne peut réécrire ensuite.
//
// Ce que ça remplace: « WhatsApp donne la sensation de diriger sans la
// substance. Un message envoyé n'est pas une tâche assignée. Une photo reçue
// n'est pas un travail vérifié. » Un responsable passe en moyenne 2 h 18 par
// jour à courir après des confirmations dans des groupes.

const STATUTS = ['todo', 'doing', 'done'];

function enRetard(t) {
  return t.status !== 'done' && t.due_at && new Date(t.due_at) < new Date();
}

export default function VendorWork() {
  const { shop } = useOutletContext();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const [rafraichir, setRafraichir] = useState(0);

  const { data, loading, error } = useAsync(async () => {
    const [taches, equipe] = await Promise.all([
      supabase
        .from('work_tasks')
        .select('id, title, details, assignee_id, due_at, status, done_at, created_at')
        .eq('shop_id', shop.id)
        .order('status')
        .order('due_at', { nullsFirst: false }),
      supabase
        .from('work_members')
        .select('user_id, role')
        .eq('shop_id', shop.id),
    ]);
    if (taches.error) throw taches.error;
    if (equipe.error) throw equipe.error;

    const ids = [...new Set((equipe.data || []).map((m) => m.user_id))];
    // Les noms passent par la fonction publique: on ne lit pas `profiles`
    // directement, qui n'expose pas les autres.
    const { data: gens } = ids.length
      ? await supabase.rpc('get_public_profiles', { p_ids: ids })
      : { data: [] };
    const nomPar = Object.fromEntries((gens || []).map((g) => [g.id, g.name]));

    const tids = (taches.data || []).map((x) => x.id);
    const { data: preuves } = tids.length
      ? await supabase
          .from('work_proofs')
          .select('id, task_id, by_user, note, photo_url, lat, lng, created_at')
          .in('task_id', tids)
          .order('created_at')
      : { data: [] };

    return {
      taches: taches.data || [],
      equipe: (equipe.data || []).map((m) => ({ ...m, name: nomPar[m.user_id] })),
      preuves: preuves || [],
      monRole: (equipe.data || []).find((m) => m.user_id === user?.id)?.role
        || (shop.owner_id === user?.id ? 'owner' : null),
    };
  }, [shop.id, user?.id, rafraichir]);

  const peutAssigner = data?.monRole === 'owner' || data?.monRole === 'manager';

  if (loading) return <Skeleton />;
  if (error) return <ErrorState onRetry={() => setRafraichir((n) => n + 1)} />;

  const { taches, equipe, preuves } = data;
  const enCours = taches.filter((x) => x.status !== 'done' && x.status !== 'cancelled');
  const faites = taches.filter((x) => x.status === 'done');

  return (
    <div>
      <AppHeader title={t('work.title')} />

      <div className="px-4 pb-24 pt-3">
        <p className="text-caption text-muted">{t('work.baseline')}</p>

        {peutAssigner && (
          <NouvelleTache
            shopId={shop.id}
            equipe={equipe}
            onDone={() => setRafraichir((n) => n + 1)}
          />
        )}

        <h2 className="mt-5 text-section text-ink">{t('work.ongoing')}</h2>
        {enCours.length === 0 ? (
          <EmptyState title={t('work.noneOngoing')} />
        ) : (
          <ul className="mt-2 space-y-2">
            {enCours.map((x) => (
              <Tache
                key={x.id}
                tache={x}
                equipe={equipe}
                preuves={preuves.filter((p) => p.task_id === x.id)}
                moi={user?.id}
                lang={lang}
                t={t}
                toast={toast}
                onDone={() => setRafraichir((n) => n + 1)}
              />
            ))}
          </ul>
        )}

        {faites.length > 0 && (
          <>
            <h2 className="mt-6 text-section text-ink">{t('work.register')}</h2>
            <p className="text-caption text-muted">{t('work.registerNote')}</p>
            <ul className="mt-2 space-y-2">
              {faites.map((x) => (
                <Tache
                  key={x.id}
                  tache={x}
                  equipe={equipe}
                  preuves={preuves.filter((p) => p.task_id === x.id)}
                  moi={user?.id}
                  lang={lang}
                  t={t}
                  toast={toast}
                  onDone={() => setRafraichir((n) => n + 1)}
                />
              ))}
            </ul>
          </>
        )}

        {peutAssigner && (
          <div className="mt-6 rounded-card border border-hairline p-3">
            <p className="flex items-center gap-2 text-body font-semibold text-ink">
              <IconUserPlus size={18} /> {t('work.team')}
            </p>
            <ul className="mt-2 space-y-1">
              {equipe.map((m) => (
                <li key={m.user_id} className="flex justify-between text-body">
                  <span className="truncate text-ink">{m.name || t('work.someone')}</span>
                  <span className="shrink-0 text-caption text-muted">{t(`work.role.${m.role}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function NouvelleTache({ shopId, equipe, onDone }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [titre, setTitre] = useState('');
  const [qui, setQui] = useState('');
  const [quand, setQuand] = useState('');
  const [envoi, setEnvoi] = useState(false);

  // Une tâche sans personne et sans échéance n'est pas une tâche, c'est un
  // souhait. L'écran les réclame tous les deux.
  const valide = titre.trim() !== '' && qui !== '' && quand !== '';

  async function creer() {
    setEnvoi(true);
    try {
      const { error } = await supabase.from('work_tasks').insert({
        shop_id: shopId,
        title: titre.trim(),
        assignee_id: qui,
        due_at: new Date(quand).toISOString(),
        created_by: user.id,
      });
      if (error) throw error;
      setTitre(''); setQui(''); setQuand(''); setOuvert(false);
      onDone();
    } catch (e) {
      toast.error(e.message || t('errors.generic'));
    } finally {
      setEnvoi(false);
    }
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-pill bg-teal px-3 py-2 text-body font-semibold text-white"
      >
        <IconPlus size={18} /> {t('work.newTask')}
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-card border border-hairline p-3">
      <Field label={t('work.what')} required>
        {(id) => <TextInput id={id} value={titre} onChange={(e) => setTitre(e.target.value)} />}
      </Field>
      <Field label={t('work.who')} required>
        {(id) => (
          <Select id={id} value={qui} onChange={(e) => setQui(e.target.value)}>
            <option value="">—</option>
            {equipe.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.name || t('work.someone')}</option>
            ))}
          </Select>
        )}
      </Field>
      <Field label={t('work.when')} required>
        {(id) => (
          <TextInput id={id} type="datetime-local" value={quand} onChange={(e) => setQuand(e.target.value)} />
        )}
      </Field>
      <div className="flex gap-2">
        <Button onClick={creer} loading={envoi} disabled={!valide}>{t('work.assign')}</Button>
        <Button variant="secondary" onClick={() => setOuvert(false)}>{t('common.cancel')}</Button>
      </div>
    </div>
  );
}

function Tache({ tache, equipe, preuves, moi, lang, t, toast, onDone }) {
  const [ouvert, setOuvert] = useState(false);
  const qui = equipe.find((m) => m.user_id === tache.assignee_id);
  const retard = enRetard(tache);
  const aMoi = tache.assignee_id === moi;

  const quand = (iso) =>
    new Date(iso).toLocaleString(lang, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <li className={`rounded-card border p-3 ${retard ? 'border-danger' : 'border-hairline'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-ink">{tache.title}</p>
          <p className="mt-0.5 text-caption text-muted">
            {qui?.name || t('work.someone')}
            {tache.due_at && <> · <IconClock size={12} className="inline" /> {quand(tache.due_at)}</>}
          </p>
        </div>
        {tache.status === 'done' ? (
          <IconCircleCheck size={20} className="shrink-0 text-success" />
        ) : retard ? (
          <IconAlertTriangle size={20} className="shrink-0 text-danger" />
        ) : null}
      </div>

      {preuves.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-hairline pt-2">
          {preuves.map((p) => (
            <li key={p.id} className="text-caption text-muted">
              {p.photo_url && (
                <img src={p.photo_url} alt="" className="mb-1 h-24 w-full rounded-card object-cover" />
              )}
              {p.note && <span className="text-ink">{p.note}</span>}
              <span className="ml-1 whitespace-nowrap">
                · {quand(p.created_at)}
                {p.lat != null && <> · <IconMapPin size={11} className="inline" /> {t('work.located')}</>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {tache.status !== 'done' && aMoi && (
        ouvert
          ? <PoserPreuve tache={tache} moi={moi} t={t} toast={toast} onDone={onDone} />
          : (
            <button
              onClick={() => setOuvert(true)}
              className="mt-2 flex w-fit items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
            >
              <IconCamera size={14} /> {t('work.markDone')}
            </button>
          )
      )}
    </li>
  );
}

function PoserPreuve({ tache, moi, t, toast, onDone }) {
  const [note, setNote] = useState('');
  const [envoi, setEnvoi] = useState(false);

  // La position est DEMANDÉE, jamais imposée: un refus ne doit pas empêcher
  // de déclarer un travail fait. On enregistre ce qu'on a.
  function position() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy_m: p.coords.accuracy }),
        () => resolve(null),
        { timeout: 6000, maximumAge: 60000 },
      );
    });
  }

  async function valider() {
    setEnvoi(true);
    try {
      const pos = await position();
      const { error: e1 } = await supabase.from('work_proofs').insert({
        task_id: tache.id,
        by_user: moi,
        note: note.trim() || null,
        ...(pos || {}),
      });
      if (e1) throw e1;
      // `done_at` est posé par le serveur (trigger), jamais par le téléphone.
      const { error: e2 } = await supabase
        .from('work_tasks').update({ status: 'done' }).eq('id', tache.id);
      if (e2) throw e2;
      onDone();
    } catch (e) {
      toast.error(e.message || t('errors.generic'));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="mt-2 space-y-2 border-t border-hairline pt-2">
      <Field label={t('work.proofNote')}>
        {(id) => <TextInput id={id} value={note} onChange={(e) => setNote(e.target.value)} />}
      </Field>
      <Button onClick={valider} loading={envoi} disabled={note.trim() === ''}>
        <IconCircleCheck size={18} /> {t('work.confirmDone')}
      </Button>
      <p className="text-caption text-muted">{t('work.proofHint')}</p>
    </div>
  );
}
