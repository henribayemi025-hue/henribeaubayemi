import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconUsersGroup } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useFondLegion } from './parties/useFondLegion';
import { Spinner } from '../../components/Spinner';

// LEGION — rejoindre une entreprise par un lien d'invitation (B7).
// On arrive ici connecté (la porte de Legion s'en charge): on voit où l'on
// entre et de la part de qui, puis on rejoint.
export default function Rejoindre() {
  const { t } = useTranslation();
  const { jeton } = useParams();
  const navigate = useNavigate();
  useFondLegion();
  const [apercu, setApercu] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    supabase.rpc('legion_apercu_invitation', { p_jeton: jeton }).then(({ data }) => setApercu(data || null));
  }, [jeton]);

  async function rejoindre() {
    setBusy(true); setErreur('');
    const { data, error } = await supabase.rpc('legion_rejoindre', { p_jeton: jeton });
    setBusy(false);
    if (error) { setErreur(error.message); return; }
    navigate(`/legion/${data}`, { replace: true });
  }

  return (
    <div className="legion-app flex h-dvh items-center justify-center overflow-y-auto bg-legion-bg px-4 text-legion-ink">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-legion-line bg-legion-panel p-6 text-center">
        <img src="/logos/legion.png" alt="Legion" className="mx-auto h-12 w-12 rounded-input object-cover" />
        {apercu === undefined ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : !apercu ? (
          <p className="text-body text-legion-muted">{t('legion.invitationInconnue', 'Ce lien d’invitation n’existe pas.')}</p>
        ) : apercu.deja_membre ? (
          <>
            <p className="text-body">{t('legion.dejaMembre', { nom: apercu.entreprise, defaultValue: 'Tu fais déjà partie de « {{nom}} ».' })}</p>
            <Link to={`/legion/${apercu.entreprise_id}`} className="block rounded-pill bg-legion-gold px-4 py-2.5 text-body font-semibold text-legion-bg">{t('legion.entrer', 'Entrer')}</Link>
          </>
        ) : !apercu.valide ? (
          <p className="text-body text-legion-muted">{t('legion.invitationPerimee', 'Ce lien a déjà servi ou a expiré. Demande-en un nouveau.')}</p>
        ) : (
          <>
            <IconUsersGroup size={28} className="mx-auto text-legion-gold" />
            <p className="text-body">
              {t('legion.invitationTexte', { qui: apercu.invite_par, nom: apercu.entreprise, defaultValue: '{{qui}} t’invite dans « {{nom}} » : ses salons, ses agents, ses tâches.' })}
            </p>
            <button type="button" onClick={rejoindre} disabled={busy}
              className="w-full rounded-pill bg-legion-gold px-4 py-2.5 text-body font-semibold text-legion-bg disabled:opacity-60">
              {busy ? '…' : t('legion.rejoindre', 'Rejoindre')}
            </button>
          </>
        )}
        {erreur && <p className="text-caption text-legion-danger">{erreur}</p>}
        <Link to="/legion" className="inline-flex items-center gap-1 text-caption text-legion-muted"><IconArrowLeft size={13} /> Legion</Link>
      </div>
    </div>
  );
}
