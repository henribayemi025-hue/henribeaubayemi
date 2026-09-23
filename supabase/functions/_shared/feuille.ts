// La feuille de route de l'entreprise (0168), telle que les agents la
// lisent: le trimestre, le mois, la semaine et le jour — ce qui est fait et
// ce qui reste. Beau, 23/09: les agents travaillent POUR ce plan.
// deno-lint-ignore no-explicit-any
type Service = any;
export async function lireFeuille(service: Service, entrepriseId: string, noms: Record<string, string>): Promise<string> {
  const auj = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const lundi = new Date(auj); lundi.setUTCDate(auj.getUTCDate() - ((auj.getUTCDay() + 6) % 7));
  const dimanche = new Date(lundi); dimanche.setUTCDate(lundi.getUTCDate() + 6);
  const mois = `${iso(auj).slice(0, 7)}-01`;
  const { data } = await service.from('legion_feuille').select('horizon, debut, titre, responsable, fait, commentaire')
    .eq('entreprise_id', entrepriseId).neq('horizon', 'recurrent')
    .or(`horizon.in.(trimestre,annee),and(horizon.eq.mois,debut.eq.${mois}),and(horizon.eq.semaine,debut.eq.${iso(lundi)}),and(horizon.eq.jour,debut.gte.${iso(auj)},debut.lte.${iso(dimanche)})`)
    .order('debut').limit(80);
  if (!data?.length) return '';
  const ligne = (l: { horizon: string; debut: string; titre: string; responsable: string | null; fait: boolean; commentaire: string | null }) =>
    `- [${l.fait ? 'fait' : 'à faire'}] ${l.horizon === 'jour' ? `${l.debut} ` : ''}${l.titre}${l.responsable && noms[l.responsable] ? ` — ${noms[l.responsable]}` : ''}${l.commentaire ? ` (commentaire: ${l.commentaire})` : ''}`;
  const bloc = (h: string[], titre: string) => {
    const x = data.filter((l: { horizon: string }) => h.includes(l.horizon));
    return x.length ? `${titre}:\n${x.map(ligne).join('\n')}` : '';
  };
  return `\nLA FEUILLE DE ROUTE DE L'ENTREPRISE (fixée par le fondateur — ton travail la sert; si on te demande le plan, pars d'elle):\n${[bloc(['trimestre', 'annee'], 'Le trimestre'), bloc(['mois'], 'Ce mois'), bloc(['semaine'], 'Cette semaine'), bloc(['jour'], 'Les jours de la semaine')].filter(Boolean).join('\n')}\n`;
}
