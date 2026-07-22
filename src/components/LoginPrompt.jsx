import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';
import { useUI } from '../hooks/useUI';

// Global login gate: opened via useUI().requireLogin() when a guest taps a
// protected action (message, follow, buy, publish…).
export function LoginPrompt() {
  const { t } = useTranslation();
  const { loginPrompt, closeLoginPrompt } = useUI();
  const navigate = useNavigate();
  const location = useLocation();

  function go() {
    closeLoginPrompt();
    navigate('/auth', { state: { from: location.pathname } });
  }

  return (
    <Modal open={loginPrompt} onClose={closeLoginPrompt} title={t('auth.loginPrompt')}>
      <p className="mb-4 text-body text-muted">{t('auth.loginNeeded')}</p>
      <div className="space-y-2">
        <Button onClick={go}>{t('auth.login')}</Button>
        <Button variant="ghost" className="w-full" onClick={closeLoginPrompt}>
          {t('common.cancel')}
        </Button>
      </div>
    </Modal>
  );
}
