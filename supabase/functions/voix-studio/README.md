# voix-studio

Voix off des vidéos (studio de Claude) avec Fish Audio, via la clé `FISH_AUDIO_API_KEY` déjà posée dans les secrets Supabase.
Déployée le 17/11/2026 (verify_jwt false). Accès par l'en-tête `x-studio-token` : seule l'empreinte SHA-256 du jeton est dans le code.
Jeton perdu (nouvelle session) : générer un nouveau jeton, remplacer l'empreinte, redéployer. Aucune action de Beau.
Actions : `{"action":"credit"}`, `{"action":"voix","recherche":"..."}`, `{"texte":"...","voix":"<id 32 hex>"}` → mp3 192 kbps.
