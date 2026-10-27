# Prompt final pour Google AI Studio : Finjaro Learn (27/10)

Les 200 idées de Gemini reçues de Beau ont été triées : on garde celles qui se voient, se montrent et font apprendre ; on écarte ce qui demande une vraie infrastructure invisible à l'écran ou de la fausse preuve sociale. À coller dans AI Studio (Build). Le résultat sert d'inspiration : on reprend les idées, pas le code.

```
Build a single-page web app: the "AI coding studio" of Finjaro Learn, a worldwide app that teaches anyone to code and build AI, from absolute zero to AI-engineer level.

A first version already exists, so do NOT redo it. It has: three zones (lesson / code editor with console and tests / rail of AI assistants with chat), an agent avatar next to the last line of code, "Save me", a "Scan" review with line numbers, mandatory real-company case studies, progress and a certificate. GO FURTHER: add NEW things everywhere and surprise me.

PART 1: BUILD EVERY IDEA BELOW
Make each one a real, visible, interactive piece of the interface (mock the data believably, label sample content as sample).

Signature features
- Code Time-Lapse Scrub: a video-style scrubber under the editor that replays every keystroke of the session.
- Ghost Cursor Pair-Programming: a translucent AI cursor that moves, highlights lines and types suggestions only on "Show me".
- Memory Graph Overlay: toggleable graph of variables, references and values updating as the code runs.
- "Save me" Branch Fork: before any AI fix, silently branch the learner's code so nothing is ever lost; show the branch in a tiny timeline.
- Multi-Agent Deliberation Panel: Teacher, Tester and Reviewer discuss the draft in a live three-way thread before the final feedback.
- Error Deconstruct Modal: click an error to open three layers: what the computer saw, what it expected, the exact line.
- Semantic Search Canvas: ask in plain words ("where did I use a loop with a dictionary?") across the whole course history.
- Attention Matrix Visualizer: heatmap grid of token-to-token attention for the Transformer lessons.
- Robot Simulator Canvas: small 3D scene with sensor rays and motors for the robotics module.
- "Spot the Flaw" Duel: a daily 3-minute game, two snippets, find the bug.
- Adaptive Friction: if the learner pastes or brute-forces, a micro-question appears before the next hint unlocks.
- Code Difference Slider: draggable split between the learner's code and a cleaner refactor, differences highlighted.
- Edge Case Generator: one button creates empty, huge and malicious inputs for the learner's function.
- Latency and Failure Simulator: inject delays, rate limits and degraded answers into a model call.
- Signed Portfolio Cards: a shareable card of a finished case study that can be re-run live.
- Low-Bandwidth Code-Only Mode: a stripped interface for slow connections, with a switch to show it.

Visual wow
- Context Raycast: a soft beam links the agent's avatar to the exact line it is discussing.
- Execution Flow Pulses running down the gutter to show control flow.
- Glass modals with backdrop blur; the workspace behind scales back slightly with depth of field.
- Console edge shimmer when new output arrives; adaptive background tint (cyan on pass, amber on warning).
- Hover memory cards on variables; hover previews on folded code.
- Fluid panel layout transitions; Focus Mode that expands the active panel and dims the rest.
- Scope boundary gradient lines for nested blocks; diff-sweep flash on lines changed by the AI.
- Spring micro-interactions on every button; gutter test markers (green or red by each function).
- Floating AST node tree on double-click of a function signature.
- Formula drawer: equations expand into live sliders; a 3D tensor cube viewer.
- AI face micro-expressions driven by generation state; segmented progress rail on the lesson with concept nodes.
- Toast pipeline that stacks like a commit history.
- Very subtle keystroke sparkles on milestones (with an off switch).

Editor
- Inline type hints, live value bubbles at line ends, minimap with heat markers for edits, failures and AI changes.
- Command palette (Cmd/Ctrl+K) for everything; regex visualizer panel; version snapshots dropped whenever tests pass.
- Assembly / bytecode side view for C and Python; multi-file tabs with split panes.

AI agents
- New roles: Architect (clean code), Security Auditor, Socratic Debugger, Performance Benchmarker, Complexity Coach, Edge Case Tester.
- Proactive idle helper that offers a micro-hint when the learner is stuck.
- Tone selector: peer, strict reviewer, playful mentor.
- Voice explanations with synchronized line highlighting.
- Mistake Memory: warns about the learner's recurring errors across modules.
- Prompt Inspector: see and tweak the exact prompt the agent received.
- "Ask another agent": one agent consults another.

Learning mechanics
- Spaced-repetition code cards; predict-the-output exercises; pick-the-root-cause error drills.
- Drag-and-drop code blocks for beginners; flowchart-to-code split canvas; loop variable-state tables.
- Hyperparameter tuning exercises with live convergence charts; a drag-and-connect system design canvas.

Creativity
- Generative art canvas, a synth and step sequencer, a 2D game starter kit, a data dashboard builder, and an auto-generated portfolio page from finished projects.

Motivation (honest, no fake numbers)
- Personal consistency heatmap, day-1 vs day-30 code comparison, production-readiness scorecard.
- Mastery matrix, skill radar, milestone timeline, skill-health rings that ask for a light review of older topics.

Case studies
- Incident war room with logs and charts, legacy code refactor audit, ETL data pipeline, vector search engine from scratch, LRU cache build, multi-step support agent.

Playground and visual output
- Charting studio, live neural network inspector, algorithm execution animator, network request flow canvas, memory allocation grid, decision tree canvas, state machine diagrammer, LLM token probability inspector.

Accessibility and phone
- Mobile code keyboard accessory bar, screen-reader labels, colour-blind safe themes, independent font scaling, fully rebindable hotkeys.

PART 2: ADD AT LEAST 40 MORE IDEAS OF YOUR OWN
Bold, specific, not in the list above. Keep everything well organised.

PART 3: POP-UPS AND VISUAL MOMENTS
Design a complete overlay system with the newest patterns: command palette, spring modals and bottom sheets, hover cards, toasts with actions, coach-marks pointing at the exact element, celebration overlays when tests pass or a case study is validated, an agent "peek" card sliding out of its avatar, a full-screen level-up moment, onboarding tour, a context menu on code selection, and a floating mini-agent. Each one premium, short, meaningful, with reduced-motion support.

PART 4: A "VISUAL LAB" SCREEN
Lists every component, animation and overlay so I can review them one by one.

VISUAL DIRECTION
Newest 2026 design only. Thin overlay scrollbars, one crisp line-icon set (no emoji as icons), layered glass, hairline borders, soft inner glows, spring motion, a deep slate base with sky-blue and indigo accents and a warm accent for success, a modern geometric sans with a refined monospace for code. Dark by default, light theme available. Phone and desktop. Real believable content (an actual Python lesson, realistic agent replies), no lorem ipsum, no fake statistics, nothing tied to a single country.

AT THE END
List every feature you added, grouped by area, and flag the 10 that make the biggest difference.
```
