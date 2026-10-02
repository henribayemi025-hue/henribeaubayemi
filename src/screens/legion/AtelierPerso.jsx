import { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PleinEcran } from './parties/Vues';
import ChargementLeo from './parties/ChargementLeo';

const Atelier = lazy(() => import('./atelier/Atelier'));

// L'atelier sans entreprise (Beau, 02/10 : « depuis Learn, avec le même
// compte ») : /legion/atelier ouvre l'atelier de code de la personne
// connectée, en formule gratuite ou Premium (atelier/src/formule.js). Learn y
// envoie ses élèves ; une entreprise de Léo garde son atelier à elle.
export default function AtelierPerso() {
  const { t, i18n } = useTranslation();
  const naviguer = useNavigate();
  const langue = i18n.language;
  return (
    <div className="legion-app">
      <PleinEcran titre={t('legion.vues.titre.atelier')} onFermer={() => naviguer('/legion')} t={t}>
        <Suspense fallback={<ChargementLeo />}>
          <Atelier t={t} langue={langue} entrepriseId={null} />
        </Suspense>
      </PleinEcran>
    </div>
  );
}
