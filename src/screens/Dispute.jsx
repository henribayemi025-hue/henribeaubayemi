import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { disputeFor, DISPUTE_VERSION } from '../legal/dispute';

// Procédure en cas de litige, dans la langue active (texte dans src/legal/dispute.js).
// Même mise en page que les Conditions : voir Terms.jsx pour le pourquoi du conteneur défilant.
//
// Rendu HORS de BuyerLayout (voir App.jsx: accessible depuis la connexion,
// l'espace acheteur ET l'espace vendeur) — donc SANS le <main
// overflow-y-auto> que BuyerLayout fournit d'habitude. Le document lui-même
// ne défile jamais (overflow: hidden sur html/body, volontaire pour éviter
// que le clavier iOS ne pousse toute l'app) : sans son propre conteneur
// défilant, cet écran était bloqué, illisible au-delà du premier écran.
export default function Dispute() {
  const { i18n } = useTranslation();
  const doc = disputeFor(i18n.language);

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'var(--app-height, 100dvh)', paddingTop: 'env(safe-area-inset-top)' }}>
      <AppHeader title={doc.title} back />
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 pb-16">
        <p className="text-caption text-muted">
          {doc.updatedLabel} : {doc.updatedAt} · {doc.versionLabel} {DISPUTE_VERSION}
        </p>

        {doc.draftNotice && (
          <p className="rounded-card border border-hairline bg-white p-3 text-caption text-muted">{doc.draftNotice}</p>
        )}

        {doc.preamble.map((p, i) => (
          <p key={`pre-${i}`} className="text-body text-ink">{p}</p>
        ))}

        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-2">
            <h2 className="text-section text-ink">{section.title}</h2>
            {section.body.map((line, i) =>
              line.startsWith('• ') ? (
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
