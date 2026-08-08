import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { deletionFor } from '../legal/deletion';

// Page « Supprimer mon compte » — l'adresse déclarée à Google Play dans le
// champ « URL de suppression de compte ». Elle DOIT rester publique: un
// examinateur l'ouvre sans être connecté, et une page derrière un mot de
// passe fait refuser la fiche.
//
// Même structure défilante que Terms/Privacy, et pour la même raison:
// html/body ne défilent jamais (volontaire, pour que le clavier iOS ne
// pousse pas l'app), donc l'écran fournit son propre conteneur.
export default function AccountDeletion() {
  const { i18n } = useTranslation();
  const doc = deletionFor(i18n.language);

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'var(--app-height, 100dvh)', paddingTop: 'env(safe-area-inset-top)' }}>
      <AppHeader title={doc.title} back />
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 pb-16">
        <p className="text-caption text-muted">{doc.updatedLabel} : {doc.updatedAt}</p>

        {doc.preamble.map((p, i) => (
          <p key={`pre-${i}`} className="text-body text-ink">{p}</p>
        ))}

        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-2">
            <h2 className="text-section text-ink">{section.title}</h2>
            {section.body.map((line, i) =>
              line.startsWith('• ') || /^\d\./.test(line) ? (
                <p key={i} className="pl-4 text-body text-muted">{line}</p>
              ) : (
                <p key={i} className="text-body text-muted">{line}</p>
              ),
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
