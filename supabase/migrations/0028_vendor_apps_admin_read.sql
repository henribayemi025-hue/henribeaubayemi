-- Finjaro — l'admin doit pouvoir LIRE les candidatures vendeur pour les
-- vérifier (KYC assisté par OCR, Finou 2.0 capacité 13). Jusqu'ici seule la
-- candidate voyait sa propre ligne — l'écran admin n'aurait rien listé.
-- Politique ADDITIVE (les SELECT s'additionnent en OR): rien ne change pour
-- les candidates, l'admin gagne la lecture. Pas de droit d'écriture admin
-- ici — approuver/rejeter reste un chantier à part.
drop policy if exists vendor_apps_admin_read on public.vendor_applications;
create policy vendor_apps_admin_read on public.vendor_applications
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
