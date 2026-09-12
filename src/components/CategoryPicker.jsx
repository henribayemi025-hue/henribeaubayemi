import { useTranslation } from 'react-i18next';
import { Select } from './Field';
import { publishGroups } from '../lib/categories';

// Le menu « Rayon » des écrans de publication (fiche article, publication en
// masse, Fin). Articles ET métiers de service, groupés, la famille de la
// boutique en premier.
//
// Avant, ces trois menus ne listaient que les rayons PRODUIT: une coiffeuse
// ou un électricien ne trouvait nulle part son métier au moment de publier.
export function CategoryPicker({ id, shop, value, onChange, error, placeholder, className = '' }) {
  const { t } = useTranslation();
  const groupes = publishGroups(shop);
  return (
    <Select id={id} value={value} error={error} onChange={onChange} className={className}>
      <option value="">{placeholder}</option>
      {groupes.map((g) => (
        <optgroup key={g.cle} label={g.cle === 'services' ? t('nearYou.filterServices') : t('nearYou.filterArticles')}>
          {g.ids.map((cid) => <option key={cid} value={cid}>{t(`categories.${cid}`)}</option>)}
        </optgroup>
      ))}
    </Select>
  );
}
