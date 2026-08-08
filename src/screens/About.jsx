import { useTranslation } from 'react-i18next';
import { IconMail } from '@tabler/icons-react';
import { AppHeader } from '../components/AppHeader';
import { aboutFor, CONTACT_EMAIL } from '../legal/about';

// Page publique "À propos" — pensée pour être lue par des clientes ET
// indexée par Google (voir index.html: sitemap.xml, JSON-LD Organization).
// Même structure/correctif que Terms.jsx: rendue hors de BuyerLayout,
// donc avec sa propre zone défilante dès le départ.
export default function About() {
  const { i18n } = useTranslation();
  const doc = aboutFor(i18n.language);

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'var(--app-height, 100dvh)', paddingTop: 'env(safe-area-inset-top)' }}>
      <AppHeader title={doc.title} back />
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 pb-16">
        <p className="text-section font-semibold text-teal">{doc.tagline}</p>

        {doc.intro.map((p, i) => (
          <p key={`intro-${i}`} className="text-body text-ink">{p}</p>
        ))}

        {doc.sections.map((section, i) => (
          <section key={i} className="space-y-2">
            <h2 className="text-section text-ink">{section.title}</h2>
            {section.body.map((line, j) => (
              <p key={j} className="text-body text-muted">{line}</p>
            ))}
          </section>
        ))}

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center justify-center gap-2 rounded-input border border-hairline py-2.5 text-body font-semibold text-ink"
        >
          <IconMail size={18} /> {doc.contactCta}
        </a>
      </div>
    </div>
  );
}
