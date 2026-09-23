import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Spinner } from '../components/Spinner';

// LA PAGE D'ARRIVÉE DU RELAIS DE CONNEXION (point 47, 0173).
//
// Une autre application Finjaro (Accounting, la console…) a demandé un code
// pour la personne connectée chez elle et l'a envoyée ici avec ce code. On
// l'échange contre une session, on la pose, et on va là où elle voulait
// aller (`vers`). Si le code est périmé ou brûlé, on montre simplement la
// connexion habituelle: rien de pire qu'avant.
export default function Relais() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [etat, setEtat] = useState('en_cours'); // en_cours | echec
  const code = params.get('code') || '';
  // Seulement un chemin de CE site: pas de « //ailleurs.com ».
  const brut = params.get('vers') || '/';
  const vers = /^\/(?!\/)/.test(brut) ? brut : '/';

  useEffect(() => {
    let annule = false;
    (async () => {
      if (!/^[0-9a-f]{48}$/.test(code)) { setEtat('echec'); return; }
      const { data, error } = await supabase.functions.invoke('sso-relais', { body: { action: 'echanger', code } });
      if (annule) return;
      if (error || !data?.access_token || !data?.refresh_token) { setEtat('echec'); return; }
      const { error: e2 } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
      if (annule) return;
      if (e2) { setEtat('echec'); return; }
      navigate(vers, { replace: true });
    })();
    return () => { annule = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      {etat === 'en_cours' ? (
        <>
          <Spinner />
          <p className="text-body text-muted">{t('relais.enCours', 'Connexion en cours…')}</p>
        </>
      ) : (
        <>
          <p className="text-section text-ink">{t('relais.echec', 'Le relais a expiré.')}</p>
          <p className="text-body text-muted">{t('relais.echecAide', 'Connecte-toi ici, avec le même compte que sur les autres applications Finjaro.')}</p>
          <Link to={`/auth?next=${encodeURIComponent(vers)}`} className="btn-primary">{t('auth.login', 'Se connecter')}</Link>
        </>
      )}
    </div>
  );
}
