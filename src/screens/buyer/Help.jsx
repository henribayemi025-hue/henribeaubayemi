import { useTranslation } from 'react-i18next';
import { IconMail, IconChevronDown, IconBrandWhatsapp } from '@tabler/icons-react';
import { AppHeader } from '../../components/AppHeader';

// Numéro de Beau, donné explicitement pour figurer ici (09/09): l'e-mail
// seul restait sans réponse trop longtemps, WhatsApp est ce que tout le
// monde utilise déjà au Cameroun.
const SUPPORT_WHATSAPP = '+33751026448';

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

        <div className="flex flex-col gap-2">
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <IconBrandWhatsapp size={20} /> {t('help.contactWhatsapp')}
          </a>
          <a href="mailto:fin.finjaro@gmail.com" className="btn-secondary">
            <IconMail size={20} /> {t('help.contactCta')}
          </a>
        </div>

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
