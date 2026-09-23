// Le prix d'une ligne du panier: le prix de lot dès lot_qty pièces (achat
// groupé, 0172), sinon le prix normal. Même règle que place_order en base —
// le panier et le paiement doivent montrer le total que la commande aura.
export function prixLigne(i) {
  if (i.price_on_request) return 0;
  if (i.lot_qty && i.lot_price_fcfa && i.qty >= i.lot_qty) return i.lot_price_fcfa;
  return i.price_fcfa;
}
