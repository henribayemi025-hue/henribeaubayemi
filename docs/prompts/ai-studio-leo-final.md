# Léo : prompt final pour Google AI Studio (27/10)

Les 200 idées de Gemini reçues de Beau, triées. Écartées : ce qui n'est pas dans le cadre (organigramme / vue d'ensemble des agents, jeux), ce qui affirme des choses non prouvées (badges SOC2 / RGPD, probabilité de réponse, taux de réussite inventé, capteur de lumière), et ce qui est dangereux pour l'argent (confirmation à la voix, approbation depuis l'écran verrouillé). Règle de texte : presque aucun mot à l'écran. Devise : montants dans la monnaie de la personne, exemples variés, jamais une devise « par défaut » (CLAUDE.md). À coller dans AI Studio (Build) ; le résultat sert d'inspiration.

```
Build a single-page web app: "Léo", a workspace where a company's AI agents do real work. People chat with agents, agents write and run code, read and draft messages, use connected tools and links, and show a decision or conclusion to approve instead of asking for prompts. Worldwide product, any company.

THE ONE RULE THAT BEATS ALL OTHERS: ALMOST NO TEXT
Every screen says one thing: at most one short title (often none), one main action, and the numbers that matter. No paragraphs, no subtitles that explain, no marketing copy. Meaning is carried by icons, colour, motion, spacing and typography. Explanations hide behind a small "how it works" control. Count every word as a cost. Labels are one or two words.

SCOPE (essentials only)
Chat with agents (the main surface), code the agents write and run, messaging and approvals, links and connectors, tasks and a "Confirm" card before any risky action, and trust in numbers. Do NOT build: organisation charts, building views, games, gamification, swarm maps.

A first version exists, so do NOT redo it. Add NEW things and surprise me.

PART 1: BUILD EVERY IDEA BELOW as real interactive pieces (believable sample data, labelled as sample; no invented statistics; amounts shown in the viewer's own currency, vary the samples across currencies, never assume one).

Approvals and confirm
- Approval stack: pending actions as stacked cards that collapse as you approve, clear ten in seconds.
- Impact slider: slide to confirm a high-stakes action (amount and recipient count shown as numbers only).
- Press-and-hold confirm for destructive actions; confirm colour by severity (blue, orange, red).
- One-tap undo toast with a 30-second countdown after any critical execution; undo history bar.
- Dry-run "Simulate" preview before Confirm; batch-approve low-risk items; approve-if-under-threshold rule; auto-approve threshold sliders.
- Reject chips (three quick reasons) that teach the agent; delegate an approval by tagging a teammate.
- Focus spotlight that dims everything except the one card needing a human.
- Fail-safe circuit breaker: an agent auto-pauses after repeated failures, with a clear visual state.
- Audit drawer on every task: a timestamped trail of what happened.

Trust and numbers
- Every number carries a tiny source pill; click it to open the exact payload drawer.
- Distinct look for raw source values vs calculated values; hover shows formula, unit, currency, timestamp.
- Honest null state ("missing at source", never a fake zero); mismatch glow when two sources disagree.
- Freshness dots and "2 min ago" micro-labels; precision toggle (14K / 14,250 / 14,250.42); masked values with unlock.
- Numbers flash softly when a live update arrives; skeleton-to-value crossfade with no layout shift.

Chat
- Decision-first bubbles: buttons first, explanation folded under a chevron; three-word status lines.
- Zero-prompt cards: agents answer with buttons, toggles and charts instead of questions.
- Agent-to-agent chatter in a collapsible sub-thread; drag any past card into the prompt bar as context.
- Inline entity chips with hover previews; contextual action chips under the input; sticky active-decision header.
- Swipe to branch a "what-if" thread; reaction-based correction drawer; tone micro-slider on drafts.
- Context meter ring around the input; voice-to-widget (speech becomes a form); pin a metric as a live widget.
- Scrubbing mini-charts inside bubbles; focus-curtain that dims all but the selected message.

Code
- Live code canvas that runs while streaming, linking lines to the output they produced.
- Diff-only code sheets; one-tap sandbox run; error-to-fix arrow flow; zero-text terminal (Data in, Script run, Success icons).
- Flowchart toggle for any code block; mock-data toggle before running on live data; secret-masked keys.
- Cost, memory and time badges on code cards; execution timeline; revert-state button; copy-output-only.
- Execution replay scrubber: replay an agent's steps like a video.

Messaging
- Draft inbox as a swipe stack (send / edit); ghost draft in translucent blue that Tab accepts.
- Diff-only drafts (added and removed text only); three reply variants as stacked micro-cards.
- Audience impact bar (recipient count, external or internal); channel pill with switch; sender-identity badge; time-zone clock per recipient.
- Attachment safety badges; link validator checks; opt-out warning dot; language badge; outbound quota meter.

Links and connectors
- Connector grid with live health halos; one-tap re-auth sheet; scoped permission toggles (read / write / delete).
- Data-flow pulses along connector lines; read-only sandbox switch; granular folder or table selector.
- Rate-limit warnings at 80%; one-tap revoke; shared vs personal credential badge; failover switch toast.
- Link paste becomes a compact preview card; connector suggestions appear when relevant.

Agents
- Status halo avatars (working, waiting, idle); tool micro-icons under each avatar; agent pulse sparkline.
- Hand-off ribbon showing a payload passing from one agent to the next; one-tap pause on hover.
- Autonomy level indicator; memory inspector chips; pace slider (cautious to fast); sleep toggle; cost-per-task counter; role shapes for agent types.

Visual wow, still with no text
- Glass decision sheets with two buttons and one metric; buttons that morph from running to done or review.
- Risk-tinted card borders (info, high value, destructive); hover-to-reveal details; spring drawer stacks.
- Soft ambient edge glow while an agent works; 3-frame icon animations; radial icon-only context menu.
- Elastic pull-to-dismiss; subtle card tilt; toast pipeline with only logo, arrow and state icon.
- Command palette (Cmd/Ctrl+K) and a persona switcher inside it.

Phone and access
- Full-screen swipe approvals, one-handed thumb-zone actions, sticky command bar above the keyboard, hold-to-talk anywhere.
- Haptic patterns (success / confirm / error), offline queue for approvals, large-touch mode, high-contrast mode with shapes instead of colour.
- Reduced-motion default respect, system theme sync, full keyboard flow, screen-reader focus on the active confirm card.

PART 2: ADD AT LEAST 40 MORE IDEAS OF YOUR OWN
Specific, bold, not listed above, and still nearly text-free.

PART 3: POP-UPS AND VISUAL MOMENTS
A complete overlay system with the newest patterns: command palette, spring sheets, hover cards, toasts with actions, coach-marks that point, a "peek" card sliding out of an agent avatar, a floating mini-agent, a celebration moment when a batch is cleared. Each short, premium, reduced-motion safe, and wordless where possible.

PART 4: A "VISUAL LAB" SCREEN
Every component, animation and overlay in one place to review one by one, with one-word labels only.

VISUAL DIRECTION
Newest 2026 design only: thin overlay scrollbars, one crisp line-icon set (no emoji as icons), layered glass, hairline borders, soft inner glows, spring motion, calm dark base with one precise accent plus semantic colours (green, amber, red), a modern geometric sans and a refined monospace for code and numbers (tabular figures). Dark by default, light theme available. Desktop and phone. Believable content, no lorem ipsum, no fake statistics, nothing tied to a single country.

AT THE END
List every feature you added, grouped by area, with at most one short line each, and flag the 10 that make the biggest difference.
```
