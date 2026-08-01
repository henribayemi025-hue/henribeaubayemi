import { useTranslation } from 'react-i18next';
import { IconMessages } from '@tabler/icons-react';
import { AppHeader } from '../../components/AppHeader';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { ConversationList, MessagesShell } from '../buyer/Inbox';

export default function VendorMessages() {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Même logique que côté acheteuse: deux panneaux sur ordinateur, une page
  // à la fois sur mobile.
  if (isDesktop) {
    return (
      <MessagesShell vendor>
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <IconMessages size={44} stroke={1.5} className="text-hairline" />
          <p className="text-body text-muted">{t('inbox.pickConversation')}</p>
        </div>
      </MessagesShell>
    );
  }

  return (
    <div>
      <AppHeader title={t('nav.messages')} />
      <ConversationList vendor />
    </div>
  );
}
