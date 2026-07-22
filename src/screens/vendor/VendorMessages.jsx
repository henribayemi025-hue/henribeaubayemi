import { useTranslation } from 'react-i18next';
import { AppHeader } from '../../components/AppHeader';
import { ConversationList } from '../buyer/Inbox';

export default function VendorMessages() {
  const { t } = useTranslation();
  return (
    <div>
      <AppHeader title={t('nav.messages')} />
      <ConversationList vendor />
    </div>
  );
}
