import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { privacyFor, PRIVACY_VERSION } from '../legal/privacy';

// Politique de confidentialité — page PUBLIQUE, hors BuyerLayout (comme Terms
// et About). Elle doit rester accessible SANS connexion: Google Play et
// l'App Store rejettent une URL de confidentialité placée derrière un mur
// d'authentification.
//
// Même structure défilante que Terms.jsx, et pour la même raison: html/body
// ne défilent jamais (volontaire, pour que le clavier iOS ne pousse pas
// l'app), donc l'écran DOIT fournir son propre conteneur `overflow-y-auto`,
// sans quoi le document est bloqué au premier écran.
export default function Privacy() {
  const { i18n } = useTranslation();
  const doc = privacyFor(i18n.language);

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'var(--app-height, 100dvh)' }}>
      <AppHeader title={doc.title} back />
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 pb-16">
        <p className="text-caption text-muted">
          {doc.updatedLabel} : {doc.updatedAt} · {doc.versionLabel} {PRIVACY_VERSION}
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
