import { useSettings } from '../hooks/useSettings';
import { formatPrice } from '../lib/currency';

// Renders an FCFA-stored amount in the user's selected currency, app-wide.
export function Price({ fcfa, className = '' }) {
  const { currency, language } = useSettings();
  return <span className={className}>{formatPrice(fcfa, currency, language)}</span>;
}
