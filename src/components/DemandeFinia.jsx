import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSparkles, IconCheck } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Button } from './Button';
import { Field, TextInput } from './Field';

// « Aucun résultat » était un cul-de-sac: la personne cherchait quelque chose
// de précis, on ne l'avait pas, elle repartait — et on ne pouvait rien lui
// proposer plus tard, faute de savoir où la joindre.
//
// Ce bloc transforme la page vide en demande: ce qu'elle cherche, un détail
// libre, et un contact. C'est le contact qui rend la promesse « réponse sous
// 24 h » tenable; sans lui on ne collecte qu'une statistique de plus (les
// recherches vides sont DÉJÀ comptées dans `events`, ça n'apporterait rien).
//
// Volontairement utilisable SANS COMPTE: exiger une inscription ici, c'est
// perdre exactement la personne qu'on veut retenir.
export function DemandeFinia({ recherche, source = 'recherche' }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [details, setDetails] = useState('');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function envoyer(e) {
    e.preventDefault();
    const c = contact.trim();
    if (c.length < 5) return toast.error(t('demande.contactRequis'));
    setBusy(true);
    const { error } = await supabase.from('demandes_acheteurs').insert({
      user_id: user?.id ?? null,
      recherche: String(recherche || '').trim().slice(0, 200),
      details: details.trim().slice(0, 500) || null,
      contact: c.slice(0, 120),
      source,
    });
    setBusy(false);
    if (error) return toast.error(t('demande.erreur'));
    setEnvoye(true);
  }

  if (envoye) {
    return (
      <div className="rounded-card border border-teal/30 bg-teal-light/40 p-4 text-center">
        <IconCheck size={26} className="mx-auto text-teal" />
        <p className="mt-2 text-body font-semibold text-ink">{t('demande.merciTitre')}</p>
        <p className="mt-1 text-caption text-muted">{t('demande.merciTexte')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} className="rounded-card border border-hairline bg-base p-4">
      <p className="flex items-center gap-1.5 text-body font-semibold text-ink">
        <IconSparkles size={17} className="shrink-0 text-brass" />
        {t('demande.titre')}
      </p>
      <p className="mt-1 text-caption text-muted">{t('demande.sousTitre')}</p>

      <div className="mt-3 space-y-2">
        <Field label={t('demande.detailsLabel')}>
          {(id) => (
            <TextInput
              id={id}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t('demande.detailsPlaceholder')}
              maxLength={500}
            />
          )}
        </Field>
        <Field label={t('demande.contactLabel')} hint={t('demande.contactHint')}>
          {(id) => (
            <TextInput
              id={id}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+237 6XX XXX XXX"
              maxLength={120}
              required
            />
          )}
        </Field>
      </div>

      <Button type="submit" loading={busy} className="mt-3">
        {t('demande.envoyer')}
      </Button>
    </form>
  );
}
