import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSend, IconCheck } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { TextArea } from '../../components/Field';
import { ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

// Le message de Finjaro, et la case pour y répondre.
//
// Une vendeuse relancée devait jusqu'ici répondre sur WhatsApp — donc hors
// de l'application, dans un fil que personne ne retrouve. Ici elle répond en
// deux gestes, sans quitter Finjaro et sans avoir d'e-mail: c'est la seule
// façon d'atteindre les comptes créés avec un simple numéro.
export default function Relance() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [texte, setTexte] = useState('');
  const [busy, setBusy] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: r, error: err } = await supabase.from('relances').select('*').eq('id', id).maybeSingle();
    if (err) throw err;
    if (!r) return null;
    // Ouvrir le message VAUT l'avoir lu. Beau a besoin de distinguer « elle
    // n'a pas vu » de « elle a vu et n'a pas répondu »: sans ça, il ne sait
    // pas s'il faut réécrire ou changer de canal.
    if (!r.lu_le) {
      supabase.from('relances').update({ lu_le: new Date().toISOString() }).eq('id', id).then(() => {}, () => {});
    }
    return r;
  }, [id]);

  async function repondre() {
    const t2 = texte.trim();
    if (!t2) return;
    setBusy(true);
    const { error: err } = await supabase
      .from('relances')
      .update({ reponse: t2, repondu_le: new Date().toISOString() })
      .eq('id', id);
    setBusy(false);
    if (err) return toast.error(err.message);
    setEnvoye(true);
    toast.success(t('relance.sent'));
  }

  if (loading) return <div className="space-y-3 p-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
  if (error) return <ErrorState onRetry={retry} />;
  if (!data) {
    return (
      <div>
        <AppHeader title={t('relance.title')} back />
        <p className="p-4 text-body text-muted">{t('relance.gone')}</p>
      </div>
    );
  }

  const dejaRepondu = envoye || !!data.reponse;

  return (
    <div>
      <AppHeader title={t('relance.title')} back />
      <div className="space-y-4 p-4">
        <div className="rounded-card border border-hairline bg-white p-4">
          <p className="text-caption font-semibold text-teal">{t('relance.from')}</p>
          <p className="mt-1 whitespace-pre-wrap text-body text-ink">{data.message}</p>
          <p className="mt-2 text-caption text-muted">{timeAgo(data.envoye_le, i18n.language)}</p>
        </div>

        {dejaRepondu ? (
          <div className="rounded-card border border-success/30 bg-success-bg p-4">
            <p className="flex items-center gap-2 text-body font-semibold text-success">
              <IconCheck size={18} /> {t('relance.answered')}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-caption text-ink">{data.reponse || texte}</p>
          </div>
        ) : (
          <div>
            <TextArea
              rows={4}
              placeholder={t('relance.placeholder')}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
            />
            <Button className="mt-2" loading={busy} disabled={!texte.trim()} onClick={repondre}>
              <IconSend size={18} /> {t('relance.send')}
            </Button>
          </div>
        )}

        {/* Une relance sert à débloquer quelqu'un, pas à discuter: le bouton
            qui l'emmène là où elle allait vaut mieux qu'un long message. */}
        <Button variant="secondary" onClick={() => navigate('/vendor/products/bulk')}>
          {t('relance.goPublish')}
        </Button>
      </div>
    </div>
  );
}
