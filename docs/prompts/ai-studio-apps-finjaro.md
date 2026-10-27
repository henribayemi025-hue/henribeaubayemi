# Prompts AI Studio : les applications de l'environnement Finjaro (27/10)

Demande de Beau : dire seulement CE QUE FAIT chaque application, sans couleurs ni mise en page : AI Studio propose le design lui-même. À coller dans AI Studio (Build). Commencer chaque prompt par le bloc COMMUN. Le résultat sert d'inspiration, rien n'est repris sans relecture.

## Bloc COMMUN (à mettre au début de chaque prompt)

```
Build a complete single-page web app prototype. I am giving you ONLY what the app does. You decide everything about how it looks and feels: name styling, layout, navigation, colours, typography, motion, icons, empty states, pop-ups. Use the newest 2026 design thinking, surprise me, and make it a product people would love to open every day.
Context: this app belongs to the Finjaro family, a worldwide set of connected business apps sharing one account and one team of AI agents called Léo. It is for any company in any country.
Rules: every screen says one thing, with very little text. No invented statistics, testimonials or fake social proof (label sample data as sample). Amounts appear in the viewer's own currency; vary sample currencies, never assume one. Every number comes from a clear calculation or source that the user can inspect, never from the AI's own arithmetic. Any irreversible, external or money-related action needs a clear human confirmation, with undo where possible. Real, believable sample content, no lorem ipsum. Works on desktop and phone.
At the end, list the features you added and flag the 10 that matter most.
```

## 1. Finjaro Finance

```
APP: Finjaro Finance. It shows a company's money in one place and helps it decide what to do next.
It does: connects bank accounts and payment tools; shows cash position now and a forecast of the coming weeks and months; tracks money in and out by category; manages invoices to send and bills to pay, with due dates and reminders; lets the user build budgets and compare them to reality; flags unusual spending and late payers; simulates "what if" scenarios (hire someone, lose a client, raise prices); prepares payments for approval (nothing is paid without a human confirmation); explains in plain words why a number moved; produces a monthly summary for the owner and one for an accountant. Léo agents chase late invoices, categorise transactions, and draft payments for approval.
```

## 2. Finjaro Chat

```
APP: Finjaro Chat. A team messaging app in the spirit of Google Chat, where people and AI agents work side by side.
It does: direct messages, group conversations and topic spaces; threads inside spaces; files and links shared inline; search across everything; mentions and notifications that stay calm; presence and status; short video or voice calls; reactions and replies; pinned items per space; message translation across languages; tasks created from a message; AI agents (Léo) as members of any space who can summarise a thread, answer questions, draft replies, turn a discussion into tasks, and take actions in other Finjaro apps, always showing what they are about to do and asking for confirmation before anything risky. Guests from outside the company can be invited to a single space.
```

## 3. Finjaro RH

```
APP: Finjaro RH (human resources). It helps a company hire, onboard, look after and organise its people.
It does: a team directory with roles and who reports to whom; hiring (open roles, candidates through stages, interview scheduling, structured scorecards, offer drafts); onboarding checklists per new person with automatic reminders; leave and absence requests with approvals and team calendar; work schedules and time off balances; employee documents (contracts, certificates) with expiry alerts; performance reviews and goals; anonymous team feedback and simple pulse surveys; preparation of payroll inputs for the accountant; answers to staff questions from the company's own policies. Léo agents screen applications against a written job profile, chase missing documents and draft job posts, but a human decides every hiring, pay and termination matter. Handle personal data carefully and show who can see what.
```

## 4. Finjaro Accounting

```
APP: Finjaro Accounting. Bookkeeping for small and medium businesses that an owner can actually understand.
It does: records sales, purchases and expenses; reads receipts and invoices from photos or emails and proposes the entry; keeps a chart of accounts and double-entry books where debits always equal credits; reconciles bank lines with entries; produces the standard reports (profit and loss, balance sheet, cash flow, aged receivables and payables); handles tax amounts according to the company's country rules chosen in settings; manages a month-end checklist; locks closed periods; exports for an external accountant; keeps a full audit trail of who changed what. A Léo assistant answers questions about the books and prepares entries, but every figure is computed by deterministic code and cites the entries behind it; a separate check blocks any display where an invariant breaks (debits equal credits, parts sum to the total, signs, period). A human validates the choice of each measure.
```

## 5. Finjaro Sales (idée en plus)

```
APP: Finjaro Sales. A light customer-relationship tool for small teams.
It does: keeps contacts and companies; a pipeline of deals through stages; a unified timeline per customer (emails, calls, notes, invoices); follow-up reminders; quote creation and tracking; a daily "who to contact today" list; email drafts to prospects that a human approves before sending; imports from spreadsheets; simple reports on pipeline and conversion based only on real recorded data. Léo agents research a prospect from public information, draft follow-ups, update the pipeline from conversations, and never contact anyone without approval.
```

## 6. Finjaro Stock (idée en plus)

```
APP: Finjaro Stock. Inventory and orders for sellers and small shops.
It does: product catalogue with photos supplied by the seller; stock levels per location; incoming and outgoing movements; low-stock alerts and suggested reorders; purchase orders to suppliers; sales orders from several channels in one list; barcode or camera scanning on a phone; stock count sessions that reconcile differences; margin per product from real costs and prices; links to Finjaro Finance and Finjaro Accounting so each movement posts its entries. Léo agents propose reorders and flag odd movements, a human approves purchases.
```

## 7. Finjaro Docs (idée en plus)

```
APP: Finjaro Docs. Documents, contracts and company knowledge in one place that agents can read.
It does: writing and editing documents together in real time; templates (contract, quote, policy, minutes); versions with a clear history and restore; comments and approvals; electronic signature requests with a signed copy kept; folders with permissions per person and per team; fast search that understands meaning; a company handbook that stays in sync with the documents; expiry reminders for contracts. Léo agents draft documents from a short instruction, summarise long ones, answer questions from the company's own documents with the source cited, and flag clauses to review, but signing and sending to outsiders always needs a human.
```
