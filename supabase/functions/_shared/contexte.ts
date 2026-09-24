// Deux morceaux de contexte communs aux agents (0190, 24/09).
// deno-lint-ignore no-explicit-any
type Service = any;

// Le marché de l'entreprise (idée 164 des 200) : le pays où elle vend
// surtout, choisi par le fondateur. Vide = on ne suppose AUCUN pays.
export function blocMarche(marche: string | null | undefined): string {
  if (!marche || !/^[A-Z]{2}$/.test(marche)) return '';
  let nom = marche;
  try { nom = new Intl.DisplayNames(['fr'], { type: 'region' }).of(marche) || marche; } catch { /* le code suffit */ }
  return `\nLE MARCHÉ DE L'ENTREPRISE : ${nom} (${marche}). Quand c'est utile, adapte-toi à ce marché — sa monnaie, ses usages, ses jours fériés, son cadre légal, des exemples qui lui parlent — sans l'annoncer à chaque phrase. Ne suppose jamais un autre pays ; si une question vise un autre pays, dis-le.\n`;
}

// La page « Ce qu'on a décidé » du wiki (idée 165), tenue par le directeur.
export async function blocWiki(service: Service, entrepriseId: string): Promise<string> {
  try {
    const { data } = await service.from('legion_wiki').select('contenu, maj_le').eq('entreprise_id', entrepriseId).eq('cle', 'decisions').maybeSingle();
    if (!data?.contenu) return '';
    return `\nLE WIKI DE L'ÉQUIPE — « Ce qu'on a décidé » (mis à jour le ${String(data.maj_le).slice(0, 10)}) :\n${String(data.contenu).slice(0, 1500)}\n`;
  } catch { return ''; }
}
