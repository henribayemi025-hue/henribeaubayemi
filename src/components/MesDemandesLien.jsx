import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPackage, IconChevronRight } from '@tabler/icons-react';
import { mesDemandes } from '../lib/mesDemandes';

// Le chemin de retour vers « Mes demandes » (/ma-commande).
//
// Retour d'une testeuse (25/11) : « tu envoies la demande, mais tu ne sais
// pas si on t'a répondu, si on va te répondre ou pas ». Le suivi existait
// depuis le 01/10, mais on n'y entrait que par le bouton « Suivre ma
// demande », une seule fois, juste après l'envoi. Fermé, il n'y avait plus
// aucun lien pour y revenir. Ce bandeau s'affiche partout où une personne
// sans compte cherche ses demandes : le profil et le panier.
//
// Rien ne s'affiche tant qu'aucune demande n'a été envoyée depuis ce
// téléphone : pas de rubrique vide.
export function MesDemandesLien({ className = '' }) {
  const { t } = useTranslation();
  const n = mesDemandes().length;
  if (n === 0) return null;
  return (
    <Link
      to="/ma-commande"
      className={`card flex items-center gap-3 ${className}`}
      data-testid="mes-demandes-lien"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-light text-teal">
        <IconPackage size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold text-ink">
          {t('suivi.mine', 'Mes demandes')} ({n})
        </span>
        <span className="block text-caption text-muted">
          {t('suivi.mineHint', 'Voir où en est chaque demande envoyée aux boutiques')}
        </span>
      </span>
      <IconChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  );
}
