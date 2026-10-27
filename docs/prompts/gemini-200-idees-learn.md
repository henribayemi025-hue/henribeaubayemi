# Finjaro Learn : fiche + deux prompts (Gemini puis Google AI Studio)

Demande de Beau (27/10) : Google AI Studio a refait ce qu'on avait déjà ; il faut qu'il AJOUTE du nouveau. Étapes : (1) Gemini donne 200 idées, Beau me les envoie ; (2) j'écris le prompt final pour AI Studio avec ces idées, plus encore, plus des fenêtres surgissantes (pop-ups) pour les visuels ; (3) quand c'est propre, Beau me l'envoie ; (4) même chose pour Léo ensuite, sans l'espace de jeux : code, chat, etc.

## Fiche : ce que sont Finjaro Learn et l'espace de travail

**Finjaro Learn** : une application pour apprendre à coder et à construire de l'IA, de zéro. On écrit du vrai code dans le navigateur (Python, JavaScript, SQL, C et d'autres), on le lance, des tests le vérifient. Un cursus en 15 modules mène de la première ligne de code à un niveau d'ingénieur IA : algorithmes, ordinateur, systèmes, maths de l'IA, données, SQL, réseaux de neurones, langage et Transformers, construire avec les modèles, capteurs et robots, éthique, recherche. Des professeurs IA (chacun sa matière, avec son visage) expliquent et répondent en connaissant l'endroit du cours où l'élève se trouve. Chaque module a des études de cas d'entreprise obligatoires, vérifiées par des tests ; deux échecs, un autre cas est proposé. Barre de progression et certificat.

**L'espace de travail** (« Travailler avec les agents IA ») : trois zones, comme Codex ou VS Code.
- Gauche : la leçon (explication simple, exemple, « je ne comprends pas »).
- Centre : un vrai éditeur de code (couleurs, numéros de ligne, suggestions avec Tab), une console avec état (pas lancé, réussi, à corriger, erreur), « Tests x / y », l'erreur expliquée en mots simples, « Sauve-moi ».
- Droite : les assistants IA (professeur, relecteur, testeur…), avec visage et rôle ; chat, blocs de code avec Copier / Comparer / Appliquer. Le visage de l'agent est dans l'éditeur, à côté de la dernière ligne.
- « Scan » : trois assistants relisent le code (bugs, style, idées) avec les numéros de ligne.
- Style actuel de l'espace : ardoise et bleu ciel, barres fines, icônes en traits.

---

## Prompt A : à coller dans Gemini (la discussion), pour obtenir 200 idées

```
You are a world-class product designer and developer-tools strategist. I am building "Finjaro Learn": an app that teaches anyone to code and to build AI, from absolute zero to AI-engineer level.

WHAT EXISTS TODAY (do not repeat these as ideas)
- Real code runs in the browser (Python, JavaScript, SQL, C and more), checked by tests.
- A 15-module course: first line of code, algorithms, how a computer works, systems, maths of AI, data, SQL, neural networks, language and Transformers, building with models, sensors and robots, ethics, research.
- AI teachers (one per subject, each with a face) who know exactly where the learner is in the course.
- Mandatory real-company case studies at each milestone, validated by tests; after two failures a different case study.
- A workspace with three zones like Codex / VS Code: lesson on the left; code editor, console, "Tests 3 / 5", plain-words error explanations and a "Save me" button in the centre; a rail of AI assistants on the right (teacher, reviewer, tester...) with chat, and Copy / Compare / Apply on code answers; the agent's face sits next to the last line of code; a "Scan" review by three assistants with line numbers.
- Progress bar and certificate. Dark slate and sky-blue style, thin scrollbars, line icons.

YOUR TASK
Give me 200 NEW ideas to make this the most loved way to learn to code and build AI in the world. Each idea: a short name, one sentence on what it does, and one on why a learner would love it. Group them under these headings, about 20 each:
1. Visual wow (animations, transitions, pop-ups, modals, toasts, hover cards, micro-interactions, the newest UI patterns of 2026)
2. The code editor
3. The AI agents (new roles, behaviours, how they watch the code, how they collaborate)
4. Learning mechanics (how people actually progress and stay)
5. Creativity (things to make, share, remix, show off)
6. Motivation and rewards (honest ones, no fake numbers)
7. Case studies and real-world projects
8. Playground and visual output (charts, drawings, simulations, robots)
9. Community and sharing (safe, optional)
10. Accessibility, phone and low-bandwidth use

RULES
- No generic filler. Every idea must be specific enough that a developer could start building it tomorrow.
- Nothing that depends on invented statistics or fake social proof.
- Do not tie the product to any one country: it is a worldwide product.
- Put the 20 ideas you think are the best at the very top, ranked, before the 10 groups.
Number the ideas 1 to 200.
```

## Prompt B : à coller dans Google AI Studio (Build), après que les 200 idées sont triées

À compléter avec les idées retenues : coller la liste choisie à la fin, à l'endroit indiqué.

```
Build a single-page web app: the "AI coding studio" of Finjaro Learn, a worldwide app that teaches anyone to code and build AI from zero to AI-engineer level.

IMPORTANT: a first version already exists with these elements, so do NOT just redo them; go further, add NEW things, and surprise me:
- three zones: lesson / code editor with console and tests / rail of AI assistants with chat
- agent avatar next to the last line of code, "Save me", "Scan" review, case-study milestones, progress, certificate

WHAT I WANT YOU TO ADD
1. Everything in the list "IDEAS TO BUILD" at the end of this message.
2. Then add at least 30 more ideas of your own that are not in my list: be bold and creative, and keep everything well organised.
3. POP-UPS AND VISUAL MOMENTS: design a complete system of the newest overlay patterns: a command palette, spring-animated modals and bottom sheets, hover cards, toasts with actions, coach-marks that point at the exact element, celebration overlays when a test passes or a case study is validated, an agent "peek" card that slides out of its avatar, a full-screen "level up" moment, onboarding tours, contextual menus on code selection, and a floating mini-agent. Each one must feel premium, short and meaningful, with reduced-motion support.
4. A "visual lab" screen listing every component and animation so I can review them one by one.

VISUAL DIRECTION
Newest 2026 design only. Thin overlay scrollbars, one crisp line-icon set (no emoji as icons), layered glass surfaces, hairline borders, soft inner glows, spring motion, a deep slate base with sky-blue and indigo accents plus a warm accent for success, a modern geometric sans with a refined monospace for code. Dark by default with a light theme. Phone and desktop. Real believable content everywhere (an actual Python lesson, realistic agent replies), no lorem ipsum, no fake statistics, nothing tied to a single country.

AT THE END
Give me a list of every feature you added, grouped by area, and flag the 10 that you think make the biggest difference.

IDEAS TO BUILD
[colle ici les idées choisies parmi les 200]
```
