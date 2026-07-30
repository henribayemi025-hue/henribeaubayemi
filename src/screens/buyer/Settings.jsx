import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconLanguage, IconCoin, IconBell, IconMail } from '@tabler/icons-react';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { CURRENCIES } from '../../lib/currency';
import { enablePush } from '../../lib/push';
import { supabase } from '../../lib/supabase';

/* global __BUILD_ID__ */
const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';

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

  // Réception des e-mails. Sur iPhone le push web ne marche que si le site a
  // été ajouté à l'écran d'accueil, donc l'e-mail est souvent le SEUL canal
  // qui arrive vraiment — d'où le réglage séparé, activé par défaut.
  const [emailOn, setEmailOn] = useState(true);
  const [emailBusy, setEmailBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('email_notifications')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setEmailOn(data.email_notifications !== false);
      });
  }, [user]);

  async function toggleEmail(next) {
    if (!user) return;
    setEmailBusy(true);
    const previous = emailOn;
    setEmailOn(next); // optimiste, annulé si la base refuse
    const { error } = await supabase
      .from('profiles')
      .update({ email_notifications: next })
      .eq('id', user.id);
    setEmailBusy(false);
    if (error) {
      setEmailOn(previous);
      toast.error(error.message);
    } else {
      toast.success(t('common.saved'));
    }
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
            <h2 className="mb-2 flex items-center gap-2 text-section text-ink"><IconBell size={20} /> {t('notifications.title')}</h2>
            <button onClick={turnOnPush} className="btn-secondary">{t('notifications.enable')}</button>
            <label className="mt-3 flex items-start gap-3 rounded-card border border-hairline p-3">
              <input
                type="checkbox"
                checked={emailOn}
                disabled={emailBusy}
                onChange={(e) => toggleEmail(e.target.checked)}
                className="mt-0.5 h-5 w-5 accent-[#C25E38]"
              />
              <span className="flex-1">
                <span className="flex items-center gap-1.5 text-body text-ink">
                  <IconMail size={16} /> {t('notifications.email')}
                </span>
                <span className="mt-0.5 block text-caption text-muted">{t('notifications.emailHelp')}</span>
              </span>
            </label>
          </section>
        )}

        <p className="pt-2 text-center text-caption text-muted">Finjaro · build {BUILD_ID}</p>
      </div>
    </div>
  );
}
