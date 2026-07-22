import { useTranslation } from 'react-i18next';
import { IconLanguage, IconCoin, IconBell } from '@tabler/icons-react';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { CURRENCIES } from '../../lib/currency';
import { enablePush } from '../../lib/push';

export default function Settings() {
  const { t } = useTranslation();
  const { language, setLanguage, currency, setCurrency } = useSettings();
  const { user } = useAuth();
  const toast = useToast();

  async function turnOnPush() {
    const res = await enablePush(user?.id);
    if (res.ok) toast.success(t('notifications.enabled'));
    else if (res.reason === 'denied' || res.reason === 'unsupported') toast.error(t('notifications.blocked'));
    else toast.info(t('common.comingSoon'));
  }

  return (
    <div>
      <AppHeader title={t('profile.settings')} back />
      <div className="space-y-6 p-4">
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-section text-ink"><IconLanguage size={20} /> {t('common.language')}</h2>
          <div className="flex gap-2">
            {[{ v: 'fr', l: t('common.french') }, { v: 'en', l: t('common.english') }].map((o) => (
              <button key={o.v} onClick={() => setLanguage(o.v)} className={`chip flex-1 justify-center ${language === o.v ? 'chip-active' : 'text-ink'}`}>
                {o.l}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 text-section text-ink"><IconCoin size={20} /> {t('common.currency')}</h2>
          <div className="grid grid-cols-4 gap-2">
            {CURRENCIES.map((c) => (
              <button key={c} onClick={() => setCurrency(c)} className={`chip justify-center ${currency === c ? 'chip-active' : 'text-ink'}`}>
                {c}
              </button>
            ))}
          </div>
        </section>

        {user && (
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-section text-ink"><IconBell size={20} /> {t('notifications.enable')}</h2>
            <button onClick={turnOnPush} className="btn-secondary">{t('notifications.enable')}</button>
          </section>
        )}

        <section id="help">
          <h2 className="mb-2 text-section text-ink">{t('profile.help')}</h2>
          <p className="text-body text-muted">{t('profile.helpText')}</p>
        </section>
      </div>
    </div>
  );
}
