import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Modal } from './Modal';
import { Button } from './Button';
import { Field, TextInput } from './Field';

// Réparer les comptes sans nom.
//
// `signInWithOtp` créait un compte quand le numéro était inconnu — y compris
// depuis l'écran de CONNEXION, où aucun champ « nom » n'est affiché. Cinq
// personnes se sont retrouvées avec un compte vide sans l'avoir demandé, et
// chacune s'est réinscrite quelques minutes plus tard par Google. La cause
// est corrigée dans `useAuth` (`shouldCreateUser`), mais ces cinq comptes
// existent toujours, et rien ne les répare tout seul.
//
// Un compte sans nom n'est pas un détail cosmétique: le nom est ce que voit
// une vendeuse quand la personne lui écrit, et ce qui s'affiche sur une
// commande. Sans lui, elle reçoit un message de personne.
//
// On demande donc une fois, à la première ouverture qui suit. On ne devine
// rien et on n'invente aucun nom — c'est la personne qui l'écrit.
export function NameGate() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const [nom, setNom] = useState('');
  const [busy, setBusy] = useState(false);

  // Ni pendant le chargement, ni pour les comptes normaux.
  if (!profile || (profile.name || '').trim()) return null;

  async function enregistrer(e) {
    e.preventDefault();
    const propre = nom.trim();
    if (!propre) return;
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ name: propre }).eq('id', profile.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await refreshProfile();
  }

  return (
    // Pas de `onClose` qui ferme: l'écran ne sert à rien tant que le nom
    // manque, et il n'y a qu'un seul champ à remplir.
    <Modal open onClose={() => {}} title={t('auth.nameMissingTitle')}>
      <form onSubmit={enregistrer} className="space-y-3">
        <p className="text-body text-muted">{t('auth.nameMissingHelp')}</p>
        <Field label={t('auth.name')}>
          {(id) => (
            <TextInput
              id={id}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              autoComplete="name"
              autoFocus
            />
          )}
        </Field>
        <Button type="submit" loading={busy} disabled={!nom.trim()}>
          {t('common.save')}
        </Button>
      </form>
    </Modal>
  );
}
