// La photo d'un salon (Beau, 25/09 : « pas d'icône, même genre des photos »). Si le salon a sa
// photo, on la montre ; sinon les VRAIS visages de ceux qui y travaillent — le département et ses
// agents qui ont un portrait — en mosaïque. L'icône ne reste qu'en dernier recours, quand
// personne n'a encore de visage.
export function visagesDu(salon, agents) {
  const nom = String(salon?.nom || '').trim().toLowerCase();
  return (agents || [])
    .filter((a) => !a.user_id && a.avatar_url && String(a.departement || '').trim().toLowerCase() === nom)
    .sort((a, b) => Number(!!b.est_directeur) - Number(!!a.est_directeur) || Number(!!b.actif) - Number(!!a.actif))
    .slice(0, 4);
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
  // 1 visage : plein cadre ; 2 ou 3 : deux moitiés ; 4 : un carré de quatre.
  const cases = v.length >= 4 ? v : v.length >= 2 ? v.slice(0, 2) : v;
  const grille = cases.length === 4 ? 'grid-cols-2 grid-rows-2' : cases.length === 2 ? 'grid-cols-2' : 'grid-cols-1';
  return (
    <span style={style} className={`grid shrink-0 gap-px overflow-hidden bg-legion-line ${grille} ${arrondi} ${className}`}>
      {cases.map((a) => <img key={a.id} src={a.avatar_url} alt="" loading="lazy" className="h-full w-full object-cover object-top" />)}
    </span>
  );
}
