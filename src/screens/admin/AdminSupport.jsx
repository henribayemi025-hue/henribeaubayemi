import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconLifebuoy, IconBug, IconAlertTriangle, IconHelp, IconSend, IconCheck } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { TextArea } from '../../components/Field';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

const ONGLETS = ['ouvert', 'repondu', 'clos'];

const GRAVITE = {
  urgent: { Icon: IconAlertTriangle, classe: 'bg-danger-bg text-danger' },
  bug: { Icon: IconBug, classe: 'bg-warning-bg text-warning' },
  question: { Icon: IconHelp, classe: 'bg-teal-light text-teal' },
};

// Les demandes d'aide remontées par Finia.
//
// Ce que cet écran doit faire, et que l'e-mail ne faisait pas: montrer le
// CONTEXTE TECHNIQUE en même temps que la plainte. Le 24/08, une vendeuse a
// écrit « les photos ne partent pas »; il a fallu fouiller la base pour
// découvrir qu'elle n'avait rien envoyé depuis dix-sept jours, et deviner son
// navigateur. Ici, le navigateur et l'écran sont écrits sous le message.
export default function AdminSupport() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [onglet, setOnglet] = useState('ouvert');
  const [brouillons, setBrouillons] = useState({});
  const [busy, setBusy] = useState(null);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: rows, error: err } = await supabase
      .from('support_tickets')
      .select('*, profils:profiles!support_tickets_user_id_fkey(name, phone, is_vendor)')
      .order('created_at', { ascending: false });
    if (err) throw err;
    return rows || [];
  }, []);

  async function repondre(ticket) {
    const texte = (brouillons[ticket.id] || '').trim();
    if (!texte) return;
    setBusy(ticket.id);
    const { error: err } = await supabase
      .from('support_tickets')
      .update({ reponse: texte, statut: 'repondu', repondu_le: new Date().toISOString(), repondu_par: user.id })
      .eq('id', ticket.id);
    if (err) { setBusy(null); return toast.error(err.message); }

    // La personne doit RECEVOIR la réponse, sinon on a juste écrit dans une
    // base de données. La cloche de notification est le seul canal qui
    // atteint tout le monde, y compris les comptes sans e-mail.
    if (ticket.user_id) {
      await supabase.from('notifications').insert({
        user_id: ticket.user_id,
        type: 'support_reponse',
        title: t('admin.supportAnswerTitle'),
        body: texte.slice(0, 300),
        data: { ticket_id: ticket.id },
      });
    }
    setBusy(null);
    setBrouillons((b) => ({ ...b, [ticket.id]: '' }));
    toast.success(t('admin.supportAnswered'));
    retry();
  }

  async function clore(ticket) {
    setBusy(ticket.id);
    const { error: err } = await supabase
      .from('support_tickets')
      .update({ statut: 'clos', repondu_par: user.id })
      .eq('id', ticket.id);
    setBusy(null);
    if (err) return toast.error(err.message);
    retry();
  }

  if (loading) return <div className="space-y-3 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  const comptes = Object.fromEntries(ONGLETS.map((s) => [s, (data || []).filter((r) => r.statut === s).length]));
  const liste = (data || []).filter((r) => r.statut === onglet);

  return (
    <div className="space-y-3 p-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {ONGLETS.map((s) => (
          <button key={s} onClick={() => setOnglet(s)} className={`chip shrink-0 ${onglet === s ? 'chip-active' : 'text-ink'}`}>
            {t(`admin.supportStatus.${s}`)}
            {comptes[s] > 0 && <span className="ml-1 font-semibold">({comptes[s]})</span>}
          </button>
        ))}
      </div>

      {liste.length === 0 ? (
        <EmptyState icon={IconLifebuoy} title={t('admin.supportEmpty')} />
      ) : (
        <ul className="space-y-3">
          {liste.map((ticket) => {
            const g = GRAVITE[ticket.gravite] || GRAVITE.question;
            const ctx = ticket.contexte || {};
            return (
              <li key={ticket.id} className="rounded-card border border-hairline p-3">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${g.classe}`}>
                    <g.Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-semibold text-ink">{ticket.sujet}</p>
                    <p className="text-caption text-muted">
                      {ticket.profils?.name || t('admin.supportAnonymous')}
                      {ticket.profils?.is_vendor && ` · ${t('admin.isVendorShort')}`}
                      {ticket.profils?.phone && ` · ${ticket.profils.phone}`}
                      {' · '}
                      {timeAgo(ticket.created_at, i18n.language)}
                    </p>
                  </div>
                </div>

                <p className="mt-2 whitespace-pre-wrap rounded-input bg-base p-2.5 text-caption text-ink">{ticket.resume}</p>

                {/* Le contexte technique: c'est lui qui évite trois jours
                    d'enquête. Volontairement en petit — on le lit quand on
                    en a besoin, il n'encombre pas le reste. */}
                {Object.keys(ctx).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-muted">
                      {t('admin.supportContext')}
                    </summary>
                    <pre className="mt-1 overflow-x-auto rounded-input bg-base p-2 text-[11px] leading-relaxed text-muted">
                      {JSON.stringify(ctx, null, 2)}
                    </pre>
                  </details>
                )}

                {ticket.reponse && (
                  <p className="mt-2 rounded-input border-l-2 border-teal bg-teal-light/40 p-2.5 text-caption text-ink">
                    {ticket.reponse}
                  </p>
                )}

                {onglet === 'ouvert' && (
                  <div className="mt-3 space-y-2">
                    <TextArea
                      rows={3}
                      value={brouillons[ticket.id] || ''}
                      onChange={(e) => setBrouillons((b) => ({ ...b, [ticket.id]: e.target.value }))}
                      placeholder={t('admin.supportReplyPlaceholder')}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        disabled={busy === ticket.id || !(brouillons[ticket.id] || '').trim()}
                        onClick={() => repondre(ticket)}
                      >
                        <IconSend size={17} /> {t('admin.supportReply')}
                      </Button>
                      <Button variant="secondary" className="flex-1" disabled={busy === ticket.id} onClick={() => clore(ticket)}>
                        <IconCheck size={17} /> {t('admin.supportClose')}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
