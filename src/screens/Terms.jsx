import { useTranslation } from 'react-i18next';
import { IconAlertTriangle } from '@tabler/icons-react';
import { AppHeader } from '../components/AppHeader';
import { termsFor, TERMS_VERSION } from '../legal/terms';

// Legal screen — renders the Terms of Use & Sale in the active language.
// The text itself lives in src/legal/terms.js (too long for translation.json).
export default function Terms() {
  const { i18n } = useTranslation();
  const doc = termsFor(i18n.language);

  return (
    <div>
      <AppHeader title={doc.title} back />
      <div className="mx-auto max-w-3xl space-y-6 p-4 pb-16">
        <p className="text-caption text-muted">
          {doc.updatedLabel} : {doc.updatedAt} · {doc.versionLabel} {TERMS_VERSION}
        </p>

        <div className="flex items-start gap-2 rounded-card border border-hairline bg-warning-bg p-3">
          <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-brass" />
          <p className="text-caption text-muted">{doc.draftNotice}</p>
        </div>

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
