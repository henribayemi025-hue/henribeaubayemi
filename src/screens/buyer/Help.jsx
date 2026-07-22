import { useTranslation } from 'react-i18next';
import { IconMail, IconChevronDown } from '@tabler/icons-react';
import { AppHeader } from '../../components/AppHeader';

// Dedicated Help screen (FIX 7) — clear contact path + a short FAQ.
export default function Help() {
  const { t } = useTranslation();
  const faq = [
    { q: t('help.q1'), a: t('help.a1') },
    { q: t('help.q2'), a: t('help.a2') },
    { q: t('help.q3'), a: t('help.a3') },
  ];

  return (
    <div>
      <AppHeader title={t('profile.helpTitle')} back />
      <div className="space-y-6 p-4">
        <p className="text-body text-muted">{t('profile.helpText')}</p>

        <a href="mailto:support@finjaro.app" className="btn-primary">
          <IconMail size={20} /> {t('help.contactCta')}
        </a>

        <section>
          <h2 className="mb-2 text-section text-ink">{t('help.faqTitle')}</h2>
          <div className="divide-y divide-hairline rounded-card border border-hairline">
            {faq.map((item, i) => (
              <details key={i} className="group px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-body font-semibold text-ink">
                  {item.q}
                  <IconChevronDown size={18} className="text-muted transition-transform duration-150 group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-caption text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
