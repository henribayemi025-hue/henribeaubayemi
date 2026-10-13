# Outil des vidéos du jour (sans crédit)

Fait le 13/10. Une voix locale (Piper), des pages HTML animées dessinées dans le
style de Finjaro, rendues image par image (Playwright + Chromium), montées avec
ffmpeg. Aucune API, aucun crédit.

1. **Script** : `scenes.exemple.json` (une scène = une phrase dite + sa légende).
2. **Voix** : `pip install piper-tts` ; modèle `fr_FR-siwis-medium` sur
   `huggingface.co/rhasspy/piper-voices` ; une phrase par scène,
   `python3 -m piper -m <modele>.onnx -f audio/<id>.wav` ; durée mesurée avec
   `ffprobe` ; champ `duree` = durée de la voix + 0,5 s dans `scenes.json`.
3. **Image** : `page.html` (720 × 1280, 24 images par seconde) contient une
   fonction `draw.<type>(p)` par type de scène ; `rendre.mjs` rend toutes les
   images. Ajouter un type de scène = ajouter une fonction dans `draw`.
4. **Montage** : chaque voix est calée sur la durée de sa scène (`apad`), puis
   `ffmpeg -framerate 24 -i frames/f%05d.jpg -i voix.wav -c:v libx264 -pix_fmt yuv420p -c:a aac`.
5. **Contrôle avant envoi** : une planche de six images (`hstack`) et la durée
   (`ffprobe`). Chaque phrase dite doit être un fait vérifié ou une explication,
   jamais une affirmation non mesurée (la première version disait « beaucoup
   n'osent pas » : retiré).

Le fichier vidéo n'entre jamais dans le dépôt : il part à Beau avec
`SendUserFile`.
