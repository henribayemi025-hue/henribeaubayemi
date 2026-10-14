// La photo d'un salon (Beau, 25/09 : « pas d'icône, même genre des photos »). Si le salon a sa
// photo, on la montre ; sinon le VRAI visage de son responsable (ou de celui qui a un portrait).
// Un seul visage, plein cadre : la mosaïque de 2 à 4 visages a été retirée le 14/10 (Beau : « mélangé,
// c'est pas beau, j'aime pas »). L'icône ne reste qu'en dernier recours, quand personne n'a de visage.
export function visagesDu(salon, agents) {
  const nom = String(salon?.nom || '').trim().toLowerCase();
  return (agents || [])
    .filter((a) => !a.user_id && a.avatar_url && String(a.departement || '').trim().toLowerCase() === nom)
    .sort((a, b) => Number(!!b.est_directeur) - Number(!!a.est_directeur) || Number(!!b.actif) - Number(!!a.actif))
    .slice(0, 1);
}

export function PhotoSalon({ salon, agents, Icone, taille = 36, arrondi = 'rounded-full', className = '' }) {
  const style = { width: taille, height: taille };
  if (salon?.image_url) return <img src={salon.image_url} alt="" style={style} className={`shrink-0 object-cover ${arrondi} ${className}`} />;
  const v = visagesDu(salon, agents);
  if (!v.length) {
    return (
      <span style={{ ...style, backgroundColor: salon?.couleur || '#C25E38' }} className={`flex shrink-0 items-center justify-center text-white ${arrondi} ${className}`}>
        {Icone && <Icone size={Math.round(taille * 0.45)} />}
      </span>
    );
  }
  const cases = v;
  const grille = 'grid-cols-1';
  return (
    <span style={style} className={`grid shrink-0 gap-px overflow-hidden bg-legion-line ${grille} ${arrondi} ${className}`}>
      {cases.map((a) => <img key={a.id} src={a.avatar_url} alt="" loading="lazy" className="h-full w-full object-cover object-top" />)}
    </span>
  );
}
