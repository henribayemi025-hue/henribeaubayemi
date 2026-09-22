import { useState } from 'react';
import { IconSend, IconMessage } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/Field';
import { EmptyState, Skeleton } from '../../components/states';

// La discussion d'un espace partagé.
//
// Une caisse commune, ce n'est pas qu'une addition: entre deux personnes qui
// partagent une caisse, « c'était pour quoi ? » se règle en se parlant. Cet
// écran existait dans la toute première version de Finjaro, la table
// `space_messages` est toujours en production, seul le composant avait
// disparu du code.
//
// Colonnes réelles de `space_messages`: id, space_id, user_id, name, text,
// created_at. `name` est le nom de l'autrice au moment de l'envoi, comme
// dans `space_members` et `space_tx`: on le range à l'envoi pour pouvoir
// afficher qui parle sans relire les profils.
//
// L'heure est formatée avec la locale du navigateur (`undefined`): chacun lit
// l'heure comme chez lui, sans supposer où il se trouve.
function heure(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function ChatEspace({ spaceId, moi, t }) {
  const toast = useToast();
  const { profile } = useAuth();
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const { data, loading, error, retry, setData } = useAsync(async () => {
    if (!spaceId) return [];
    const { data: lignes, error: err } = await supabase
      .from('space_messages')
      .select('id, user_id, name, text, created_at')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: true });
    if (err) throw err;
    return lignes || [];
  }, [spaceId]);

  const messages = data || [];
  const vide = texte.trim() === '';

  async function envoyer(e) {
    if (e) e.preventDefault();
    const contenu = texte.trim();
    if (contenu === '' || envoi) return;
    setEnvoi(true);
    try {
      const { data: ligne, error: err } = await supabase
        .from('space_messages')
        .insert({
          space_id: spaceId,
          user_id: moi,
          name: profile?.name || null,
          text: contenu,
        })
        .select('id, user_id, name, text, created_at')
        .single();
      if (err) throw err;
      // On ajoute le message à la liste déjà chargée: la discussion ne doit
      // pas clignoter ni tout recharger pour une phrase.
      setData((anciens) => [...(anciens || []), ligne]);
      setTexte('');
    } catch (err) {
      toast.error(err.message || t('errors.generic'));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="rounded-card border border-money-line p-3">
      <p className="text-caption font-semibold text-money-muted">{t('money.chatTitle')}</p>

      {loading ? (
        <div className="mt-2 space-y-2">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="ml-auto h-10 w-2/3" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      ) : error ? (
        <div className="mt-2">
          <p className="text-body text-money-danger">{t('errors.generic')}</p>
          <button type="button" onClick={retry} className="mt-1 text-caption font-semibold text-money-accent">
            {t('common.retry')}
          </button>
        </div>
      ) : messages.length === 0 ? (
        <EmptyState icon={IconMessage} title={t('money.chatEmpty')} hint={t('money.chatEmptyHint')} />
      ) : (
        <ul className="mt-2 max-h-[420px] space-y-2 overflow-y-auto">
          {messages.map((m) => {
            const amoi = m.user_id === moi;
            return (
              <li key={m.id} className={`flex ${amoi ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] sm:max-w-[70%]">
                  {!amoi && (
                    <p className="mb-0.5 truncate text-caption text-money-muted">{m.name || t('work.someone')}</p>
                  )}
                  <div
                    className={`rounded-card px-3 py-2 ${
                      amoi ? 'bg-money-accent text-white' : 'border border-money-line bg-money-card text-money-ink'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-body">{m.text}</p>
                    <p className={`mt-0.5 text-caption ${amoi ? 'text-white/75' : 'text-money-muted'}`}>
                      {heure(m.created_at)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Le bouton est désactivé tant qu'il n'y a rien à envoyer: il vaut mieux
          qu'il se voie éteint que de refuser en silence une fois cliqué. */}
      <form onSubmit={envoyer} className="mt-3 flex items-center gap-2">
        <TextInput
          className="flex-1"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder={t('money.chatPlaceholder')}
          aria-label={t('money.chatPlaceholder')}
          maxLength={2000}
        />
        <Button type="submit" loading={envoi} disabled={vide} aria-label={t('money.chatSend')}>
          <IconSend size={18} />
        </Button>
      </form>
    </div>
  );
}
