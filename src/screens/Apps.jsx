import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCodePlus } from '@tabler/icons-react';
import { AppHeader } from '../components/AppHeader';
import { AppsList } from '../components/AppLauncher';
import { Button } from '../components/Button';
import { Field, TextInput, TextArea } from '../components/Field';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import { useToast } from '../hooks/useToast';

// L'environnement Finjaro sur une page: la même liste que la grille du haut,
// mais partageable par un lien (finjaro.net/apps) et lisible sans compte.
export default function Apps() {
  const { t } = useTranslation();
  return (
    <div className="pb-8">
      <AppHeader title={t('apps.title')} back />
      <div className="mx-auto w-full max-w-3xl p-4">
        <p className="mb-4 text-body text-muted">{t('apps.intro')}</p>
        <AppsList currentKey="marketplace" />
        <p className="mt-5 text-caption text-muted">{t('apps.sameAccount')}</p>
        <Proposer t={t} />
      </div>
    </div>
  );
}

// LE DÉPÔT OUVERT (0171). Beau, dans son post: « Finjaro s'ouvre aux
// développeurs: venez ajouter vos applications ». Ici, on propose; l'équipe
// accepte (l'application rejoint le sélecteur) ou refuse, et répond.
function Proposer({ t }) {
  const { user } = useAuth();
  const { requireLogin } = useUI();
  const toast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [f, setF] = useState({ nom: '', url: '', accroche: '', description: '', contact: '' });
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const maj = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function envoyer(e) {
    e.preventDefault();
    if (!user) return requireLogin();
    if (!f.nom.trim() || !/^https?:\/\//i.test(f.url.trim())) return toast.error(t('apps.proposeMissing', 'Le nom et l’adresse (https://…) sont obligatoires.'));
    setEnvoi(true);
    const { error } = await supabase.from('finjaro_apps_propositions').insert({
      user_id: user.id, nom: f.nom.trim(), url: f.url.trim(), accroche: f.accroche.trim() || null, description: f.description.trim() || null, contact: f.contact.trim() || null,
    });
    setEnvoi(false);
    if (error) return toast.error(error.message);
    setEnvoye(true);
  }

  return (
    <section className="mt-8 rounded-card border border-hairline bg-white p-4">
      <h2 className="flex items-center gap-2 text-section text-ink"><IconCodePlus size={20} className="text-teal" /> {t('apps.proposeTitle', 'Développeurs : proposez votre application')}</h2>
      <p className="mt-1 text-caption text-muted">{t('apps.proposeIntro', 'Vous avez construit une application utile aux commerçants, aux créateurs ou aux entrepreneurs ? Proposez-la : si elle est acceptée, elle rejoint l’environnement Finjaro et s’ouvre avec le même compte.')}</p>
      {envoye ? (
        <p className="mt-3 rounded-card bg-success-bg p-3 text-body text-success">{t('apps.proposeSent', 'Reçu. L’équipe regarde et vous répond.')}</p>
      ) : !ouvert ? (
        <Button variant="secondary" className="mt-3" onClick={() => (user ? setOuvert(true) : requireLogin())}>{t('apps.proposeButton', 'Proposer mon application')}</Button>
      ) : (
        <form onSubmit={envoyer} className="mt-3 space-y-3">
          <Field label={t('apps.proposeName', 'Nom de l’application')} required>{(id) => <TextInput id={id} value={f.nom} onChange={maj('nom')} maxLength={60} />}</Field>
          <Field label={t('apps.proposeUrl', 'Adresse')} required>{(id) => <TextInput id={id} type="url" inputMode="url" placeholder="https://" value={f.url} onChange={maj('url')} />}</Field>
          <Field label={t('apps.proposeTagline', 'En une phrase, ce qu’elle fait')}>{(id) => <TextInput id={id} value={f.accroche} onChange={maj('accroche')} maxLength={90} />}</Field>
          <Field label={t('apps.proposeDescription', 'Pour qui, et pourquoi elle a sa place dans Finjaro')}>{(id) => <TextArea id={id} rows={3} value={f.description} onChange={maj('description')} maxLength={1000} />}</Field>
          <Field label={t('apps.proposeContact', 'Comment vous joindre')} hint={t('apps.proposeContactHint', 'Un e-mail ou un numéro, vu seulement par l’équipe Finjaro.')}>{(id) => <TextInput id={id} value={f.contact} onChange={maj('contact')} maxLength={120} />}</Field>
          <div className="flex gap-2">
            <Button type="submit" loading={envoi}>{t('apps.proposeSend', 'Envoyer')}</Button>
            <Button variant="secondary" type="button" onClick={() => setOuvert(false)}>{t('common.cancel')}</Button>
          </div>
        </form>
      )}
    </section>
  );
}
