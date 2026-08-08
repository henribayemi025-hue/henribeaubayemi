import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { termsFor, TERMS_VERSION } from '../legal/terms';

// Legal screen — renders the Terms of Use & Sale in the active language.
// The text itself lives in src/legal/terms.js (too long for translation.json).
//
// Rendu HORS de BuyerLayout (voir App.jsx: accessible depuis la connexion,
// l'espace acheteur ET l'espace vendeur) — donc SANS le <main
// overflow-y-auto> que BuyerLayout fournit d'habitude. Le document lui-même
// ne défile jamais (overflow: hidden sur html/body, volontaire pour éviter
// que le clavier iOS ne pousse toute l'app) : sans son propre conteneur
// défilant, cet écran était bloqué, illisible au-delà du premier écran.
export default function Terms() {
  const { i18n } = useTranslation();
  const doc = termsFor(i18n.language);

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'var(--app-height, 100dvh)', paddingTop: 'env(safe-area-inset-top)' }}>
      <AppHeader title={doc.title} back />
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 pb-16">
        <p className="text-caption text-muted">
          {doc.updatedLabel} : {doc.updatedAt} · {doc.versionLabel} {TERMS_VERSION}
        </p>

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
