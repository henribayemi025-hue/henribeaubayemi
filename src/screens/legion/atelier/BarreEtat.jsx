// La barre d'état en bas de l'éditeur, façon VS Code. Écrite par Ada Nkemba
// (tâche du 24/09, relue et reprise par Claude le 25/09 : couleurs remises
// aux nôtres, compteur d'erreurs caché tant que les erreurs ne sont pas
// soulignées) ; la bande colorée vient du prototype de Beau.
export default function BarreEtat({ ligne, colonne, langage, mode, modele, cout, plafond, erreurs, enAttente, onClicErreurs, onClicMode, t }) {
  return (
    <footer className="flex h-6 shrink-0 select-none items-center gap-1 overflow-hidden bg-[#13806f] px-2 text-[11px] text-white">
      <span className="mx-1 tabular-nums" title={t('legion.atelier.etat_ligne_colonne')}>{t('legion.atelier.etat_position', { ligne, colonne })}</span>
      {langage && <span className="mx-1 hidden sm:inline" title={t('legion.atelier.etat_langage')}>{langage}</span>}
      {modele && <span className="mx-1 hidden truncate sm:inline" title={t('legion.atelier.etat_modele')}>{modele}</span>}
      {enAttente > 0 && <span className="mx-1 hidden rounded bg-black/25 px-1.5 sm:inline" title={t('legion.atelier.etat_en_attente')}>{t('legion.atelier.etat_en_attente_court', { n: enAttente })}</span>}
      {typeof erreurs === 'number' && (
        <button type="button" onClick={onClicErreurs} className="mx-1 hidden items-center rounded px-1 hover:bg-black/20 sm:flex" title={t('legion.atelier.etat_erreurs')}>⚠ {erreurs}</button>
      )}
      <span className="flex-1" />
      <button type="button" onClick={onClicMode} className="mx-1 rounded px-1.5 font-semibold hover:bg-black/20" title={t('legion.atelier.etat_mode')}>
        {t(`legion.atelier.mode_${mode}`, mode)}
      </button>
      <span className="mx-1 tabular-nums" title={t('legion.atelier.etat_cout')}>{cout} / {plafond}</span>
    </footer>
  );
}
