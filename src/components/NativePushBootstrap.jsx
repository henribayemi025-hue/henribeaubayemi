import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../hooks/useAuth';
import { enableNativePushIfUndecided, linkNativePushToUser } from '../lib/push';

// Demande l'autorisation de notification DÈS LA TOUTE PREMIÈRE OUVERTURE de
// l'app installée — avant même qu'un compte existe.
//
// Beau: « installe l'app et ouvre, dès que tu ouvres il te demande
// d'autoriser ». La carte PushPrompt.jsx (accueil, une fois connecté) reste
// en place — elle ne réapparaît simplement plus jamais après ce composant,
// puisque la permission est déjà tranchée ('granted' ou 'denied') au moment
// où la personne l'atteint. Objection technique posée puis résolue avec
// Beau: une notification PERSONNELLE (message, commande) suppose de savoir
// à qui l'envoyer, donc a toujours besoin d'un compte — mais une diffusion
// DÉCIDÉE PAR LUI (l'onglet « Annonce » de l'admin, audience « tout le
// monde ») n'a besoin que d'un téléphone qui a dit oui. Le jeton part donc
// anonyme (device_id, migration 0076) et se rattache tout seul au compte
// dès la connexion.
export function NativePushBootstrap() {
  const { user } = useAuth();
  const asked = useRef(false);

  // Une seule tentative par session d'app: enableNativePushIfUndecided
  // vérifie lui-même l'état système et ne redemande jamais après un refus.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || asked.current) return;
    asked.current = true;
    enableNativePushIfUndecided().catch(() => {});
    // Volontairement une seule fois, à l'ouverture — pas à chaque
    // changement de `user` (le rattachement post-connexion est géré par
    // l'effet séparé ci-dessous).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connexion (ou app rouverte déjà connectée): réclame un jeton anonyme
  // existant, sans jamais rouvrir de dialogue de permission.
  useEffect(() => {
    if (!user) return;
    linkNativePushToUser(user.id).catch(() => {});
  }, [user]);

  return null;
}
