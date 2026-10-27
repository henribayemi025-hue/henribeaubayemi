# Prompt AI Studio : l'espace code commun à Learn et à Léo (27/10)

Demande de Beau (capture de VS Code avec explorateur, onglets, panneau de chat et sessions) : notre espace code doit être sérieux comme un vrai éditeur, avec bibliothèques, fichiers et agents, dans Léo ET dans Learn. L'actuel est « trop ludique et vieux ». À coller dans AI Studio ; rien n'est construit avant le mot « build » du soir.

```
Build a complete single-page web app prototype: "Finjaro Code", a professional in-browser code workspace in the family of VS Code, Cursor and Codex. It must feel like a serious tool for professionals, not a toy and not a classroom game. It is used in two places, so design it as ONE workspace with two modes I can switch between:
- LEARN mode: someone learning to code and build AI. A lesson panel and tests sit alongside the workspace, and the AI helpers act as teachers.
- LÉO mode: a company's AI agents write and run code for the team, and humans review, approve and ship.
You decide the look, layout, navigation, colours, typography, motion and icons. Use the newest 2026 thinking, and make it dense, calm, precise and beautiful.

WHAT IT MUST DO
Files and project
- File explorer with folders, create, rename, move, delete, drag and drop; multiple projects; recent files.
- Tabs with unsaved markers, split editors, breadcrumbs, a minimap, an outline of the current file and a timeline of local history.
- Global search and replace across files; quick open by file name; go to symbol.
Editing
- A real code editor: syntax colouring for Python, JavaScript/TypeScript, SQL, C and others; completions, hover documentation, error and warning squiggles with quick fixes, formatting, multi-cursor, folding.
- A Problems panel listing every error and warning, with jump to line.
Running
- Run and debug in the browser: a terminal, output panel, breakpoints, a variables view, and a test runner with pass / fail per test and a "Tests 3 / 5" summary.
- Notebook-style cells for data work, with charts and tables rendered inline.
Libraries and environment
- A libraries / packages manager: search a package, see what it does, version, size, licence and a safety note; install and remove; a lock file view; separate environments per project; clear messages when something fails to install.
- Environment variables and secrets stored safely, masked in the interface.
- Connect to a Git repository: changes view, stage, commit, branches, diff view side by side, history, and pull requests.
Agents
- A chat panel with SESSIONS, like VS Code Chat: several named sessions per project, each remembering its context; search and filter sessions; pin one.
- Several AI agents with roles (builder, reviewer, tester, security auditor, explainer, data analyst). Pick one or let them collaborate. Each one shows what it is reading, thinking and changing.
- Agents propose edits as inline diffs that the human accepts, rejects or edits, with an auto-accept countdown option; agents can attach files and selections as context; every agent action is logged and can be undone.
- Ghost-text suggestions inside the editor, "explain this", "fix this", "write a test for this", "refactor" on any selection.
- A code review pass over the whole project with findings pinned to exact lines.
Learn mode only
- A lesson panel with the explanation, an example and "I don't understand"; progress through a course; mandatory case-study projects validated by tests, hints that unlock progressively, and a teacher who always knows where the learner is.
Léo mode only
- Tasks assigned to agents with status, a queue of changes waiting for human approval with a "Confirm" step before anything is merged, deployed or sent outside; connectors to company tools with scoped permissions; a deploy preview and a rollback.
Everywhere
- Command palette, keyboard shortcuts you can rebind, themes, font and size settings, a status bar (branch, errors, language, environment, agent state), notifications that stay calm, and a restricted / trusted workspace notice like VS Code.
- Works on a laptop and on a phone (reduced layout with the essentials).

RULES
- Real, believable sample content (a real Python project with real files), no lorem ipsum. Label sample data as sample. No invented statistics or fake social proof; nothing tied to a single country.
- Any irreversible, external or money-related action needs a clear human confirmation, with undo where possible.
- Everything an agent computes with numbers must come from deterministic code the user can inspect.
- Keep text on screen short.
- Include a "components" screen that lists every part of the workspace so I can review them one by one.

AT THE END
List the features you added beyond this brief, grouped by area, and flag the 10 that matter most.
```
