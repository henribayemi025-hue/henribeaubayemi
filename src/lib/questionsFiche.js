// Les questions toutes prêtes de la fiche article (idée 4 de la revue du
// jeudi 01/10).
//
// Le premier message est celui qu'on n'envoie pas : il faut l'écrire soi-même,
// et c'est là qu'on renonce. Facebook Marketplace pré-remplit « Est-ce
// toujours disponible ? » — un appui et le message part. Ici, deux ou trois
// questions concrètes ouvrent WhatsApp avec l'article, la variante choisie et
// le lien déjà écrits. C'est la cliente qui envoie, de son téléphone.

export function questionsPour(product) {
  const quote = !!product?.price_on_request;
  const liste = [
    { cle: 'dispo', defaut: 'Encore disponible ?', texte: 'Est-il encore disponible ?' },
    quote
      ? { cle: 'prix', defaut: 'Quel prix ?', texte: 'Quel est son prix ?' }
      : { cle: 'livraison', defaut: 'Livraison possible ?', texte: 'Pouvez-vous me le livrer ? Où et à quel prix ?' },
    { cle: 'variantes', defaut: 'Autres tailles ou couleurs ?', texte: 'Avez-vous d’autres tailles ou couleurs ?' },
  ];
  return liste;
}

// Le message complet. `t` vient d'i18n : chaque morceau a sa clé, avec le
// français par défaut.
export function messageQuestion(t, { question, product, size, color, url }) {
  const variante = [size, color].filter(Boolean).join(' · ');
  return t('product.quickQuestionMessage', {
    name: product.name,
    variant: variante ? ` (${variante})` : '',
    question: t(`product.quickQ.${question.cle}.text`, question.texte),
    url,
    defaultValue: 'Bonjour, je vous écris depuis Finjaro au sujet de « {{name}} »{{variant}}. {{question}}\n{{url}}',
  });
}
