// Le texte de Finia, lisible.
//
// Beau, capture à l'appui: « ce n'est pas beau, ce n'est pas bien présenté ».
// La bulle affichait le texte du modèle TEL QUEL, donc « 1. **Ouvre ta
// boutique** : ... » avec les étoiles en clair. Le modèle écrit en Markdown —
// c'est sa langue — et personne ne le lisait de notre côté.
//
// Un rendu minuscule et sûr, sans bibliothèque et sans injection HTML: on
// construit des éléments React, jamais du HTML brut. Trois choses seulement,
// celles que le modèle produit vraiment: le gras, les listes numérotées et
// les listes à puces.

// `**gras**` — on découpe sur le marqueur, une occurrence sur deux est en gras.
function inline(text, keyBase) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1
      ? <strong key={`${keyBase}-b${i}`} className="font-semibold">{part}</strong>
      : part,
  );
}

const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/;
const BULLET = /^\s*[-*•]\s+(.*)$/;

export function RichText({ text }) {
  if (!text) return null;
  const lines = String(text).split('\n');

  const blocks = [];
  lines.forEach((line, i) => {
    const numbered = line.match(NUMBERED);
    const bullet = numbered ? null : line.match(BULLET);

    if (numbered || bullet) {
      // Le repère (chiffre ou point) garde sa propre colonne: le texte long
      // s'aligne dessous au lieu de repasser sous le numéro.
      blocks.push(
        <span key={i} className="flex gap-2">
          <span className="shrink-0 font-semibold text-teal">
            {numbered ? `${numbered[1]}.` : '•'}
          </span>
          <span className="min-w-0 flex-1">{inline(numbered ? numbered[2] : bullet[1], i)}</span>
        </span>,
      );
      return;
    }

    // Une ligne vide sépare deux idées: on lui donne un vrai blanc, plus
    // discret qu'un retour à la ligne entier.
    if (!line.trim()) {
      blocks.push(<span key={i} className="block h-2" />);
      return;
    }

    blocks.push(<span key={i} className="block">{inline(line, i)}</span>);
  });

  return <span className="block space-y-0.5">{blocks}</span>;
}
