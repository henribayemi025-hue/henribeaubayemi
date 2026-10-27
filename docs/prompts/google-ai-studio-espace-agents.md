# Prompt pour Google AI Studio : l'espace « apprendre à coder avec des agents IA »

Demande de Beau (27/10) : un exemple visuel de l'espace de travail de Finjaro Learn, façon Codex / VS Code, mais avec des idées nouvelles. À coller tel quel dans Google AI Studio (mode Build). Le résultat sert d'inspiration : on reprend les idées, pas le code. Rien n'est repris sans relecture.

---

```
Build a single-page web app: a "learn to code with AI agents" workspace.
It must look like the best developer tool of 2026, the kind of interface people screenshot and share. Think Codex, Cursor, Zed, Linear, Raycast, Vercel, Arc: calm, dense, precise, alive. Use the newest visual language, never the old one.

GOAL
A beginner writes real Python in the browser, a teacher explains, and several AI agents watch the code and help. One screen, three zones, everything one glance away. Make it feel like a studio, not a classroom.

LAYOUT (desktop first, must also work on a phone)
1. Left column, "Lesson": the explanation of the current lesson. Short blocks, one idea each, a simple example in a code card, a "I don't understand" button that opens a plain-words explanation, a progress ring, and a small map of the course (modules as a vertical timeline, current step glowing).
2. Center, "Code": a real code editor (line numbers, syntax colours, minimap off by default, bracket guides, soft current-line highlight, ghost-text suggestions that the learner accepts with Tab). Tabs for files. A console below with a live status pill (not run / passing / needs a fix / error), the test counter as "Tests 3 / 5" with small dots, and an error explained in plain words under the red line, never a raw stack trace first.
3. Right column, "Agents": a collapsible rail of AI assistants, each with a face, a name and a role: a teacher (explains), a reviewer (reads the code and flags bugs, style, ideas), a tester (tries to break the code), a coach (suggests the next step), an architect (for projects). Each agent has a live state (idle, reading, thinking, found something) shown as a soft pulse. Chat input at the bottom, auto-growing, Enter to send, Shift+Enter for a new line. Answers come with code blocks that have Copy, Compare and Apply buttons.

THE AGENT THAT WATCHES THE CODE
A small avatar sits in the editor gutter next to the last line being typed. It blinks when something needs attention. Click it for help, or press a "Save me" button in the console. Under the editor, a "Scan" button runs a review by three assistants (bugs, style, ideas) and shows findings pinned to exact line numbers, with one-click jump to the line.

PROJECTS AS CASE STUDIES
Learning is organised in milestones. Each milestone is a mandatory real-world case study written as a brief: a company-style situation (a fictional team at a well-known type of company), a mission with exact function names, input and output examples, 3 progressive hints, and refresher cards linking back to earlier lessons. The learner cannot move on until all tests pass; after two failed attempts a different case study is offered. Show this as a roadmap with locked and unlocked stations, and a celebratory but tasteful moment when a case study is validated (confetti, a certificate-like card, the next station lighting up).

CREATIVITY AND EXTRA FEATURES (add what you think is best, keep it organised)
- A command palette (Cmd/Ctrl+K) to jump to any lesson, file, agent or setting.
- A "Playground" tab for free experiments with a visual output area (charts, tables, simple canvas drawings) so beginners see their code come alive.
- A "Replay" timeline of the learner's own attempts, scrubbable, to see how they progressed.
- Streaks, a daily goal ring, and small badges for real skills (loops, functions, debugging), never fake numbers.
- A "Explain like I'm new" toggle and a "Challenge me" toggle that change the tone of every agent.
- Split view: compare the learner's code with an agent's suggestion side by side.
- Keyboard-first, with a discreet shortcut hint bar.
- Light and dark themes, dark as the default.

VISUAL DIRECTION (this is the most important part)
- Modern design only. No Windows-style scrollbars, no chunky borders, no default browser controls, no emoji used as icons. Use a crisp, consistent line-icon set (Lucide-style) with a single stroke width.
- Scrollbars: very thin overlay scrollbars that only appear on hover.
- Surfaces: layered glass and soft depth, subtle noise, 1px hairline borders at low opacity, large smooth radii, gentle inner glows, no heavy drop shadows.
- Colour: a deep slate / near-black base with a sky-blue to indigo accent, plus a warm secondary accent for success and highlights. Gradients are quiet, never rainbow.
- Typography: a modern geometric sans for the interface and a refined monospace for code (JetBrains Mono or Geist Mono). Tight tracking on headings, generous line height on lessons.
- Motion: spring-based, short, meaningful (agents pulsing, the progress ring filling, panels sliding, tests ticking in one by one). Respect reduced-motion.
- Layout details: resizable panels with elegant drag handles, collapsible agent rail, sticky status bar at the bottom with language, tests, streak and connection state, breadcrumb at the top.
- Empty states and loading states must be designed, never blank.
- Everything aligned to a strict spacing scale; real, believable content in every area (an actual Python lesson about loops, a real code sample, realistic agent replies). No lorem ipsum.

QUALITY BAR
Make it feel premium and a little magical, while staying calm and readable for a total beginner. Organise every feature clearly so nothing feels cluttered. Work on desktop and at phone width without horizontal scroll. After building it, list in a short note the five visual ideas you are proudest of.
```

---

## Comment s'en servir
1. Coller le bloc dans Google AI Studio (Build).
2. Garder les idées qui plaisent et les noter ici ; on les adapte à l'espace de Learn en gardant le style demandé par Beau (ardoise et bleu ciel pour l'espace de travail).
3. Aucune de ses images ni photos n'est reprise telle quelle dans Finjaro.
