import { Component } from 'react';
import { useTranslation } from 'react-i18next';
import { IconAlertTriangle } from '@tabler/icons-react';

// Recoverable fallback: a render error in one screen shows this inside the
// content area (nav stays) instead of white-screening the whole app. Keyed by
// route in the layouts, so navigating away clears it automatically.
function Fallback({ onReset }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <IconAlertTriangle size={40} className="text-brass" />
      <p className="text-section text-ink">{t('errors.crashTitle')}</p>
      <p className="max-w-xs text-caption text-muted">{t('errors.crashHint')}</p>
      <button onClick={onReset} className="mt-2 rounded-input bg-teal px-5 py-2.5 text-body font-semibold text-white transition active:scale-95">
        {t('common.retry')}
      </button>
    </div>
  );
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[Finjaro] render error', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) return <Fallback onReset={() => this.setState({ hasError: false })} />;
    return this.props.children;
  }
}
