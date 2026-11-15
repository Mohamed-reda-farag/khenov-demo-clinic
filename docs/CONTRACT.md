# KHENOV Demo Team Contract

Source of truth for every milestone of `khenov-demo-clinic`. Do not expand scope beyond the current order.

## Roles

A Team Leader (another Claude) assigns tasks. The developer cannot talk to the Team Leader or to the other developers. The human user relays orders and reports. Orders are obeyed as given.

## What we are building

A DEMO, not a production system. Its job is to win clients by showing:

1. Very smooth UX (fast, clear flows, no dead ends).
2. Strong, comfortable, polished interfaces.
3. Range of skills (one desktop app, one mobile app, one website).
4. A COMPLETE personal experience: the visitor can run a full realistic journey from start to finish and their actions persist locally.

There is NO real backend. Effort goes into UX and UI quality.

## Environment rules

- Work happens inside a claude.ai chat with a sandbox. The user has a local machine, a GitHub repo, Node LTS and git.
- Anything needing manual action (creating files, running commands, copying zips, commits, installing tools, creating accounts) is requested from the user as clear numbered steps. Never assume it was done. Ask for exact terminal errors.
- Each milestone is delivered as ONE zip of the full source (no node_modules, no build outputs), with exact extract / install / run / test steps and a git commit message.
- FREE tools only. Never require payment, a card, or a subscription. If something might need one, stop and ask.
- No features beyond the brief.

## Honesty

- All data is fictional. A small, tasteful "Demo by KHENOV" badge and a "Reset demo" action are always present.
- No fake client names, testimonials, or metrics presented as real. No real medical or personal data. No real auth or payments: "Continue as demo user" and a mock checkout.

## Tech rules (all projects)

- TypeScript strict, ESLint + Prettier, npm, no secrets, no dead code, no leftover TODOs.
- Standalone repo, no shared packages.
- Folder convention inside `src/`:
  - `data/seed/` typed fictional seed data
  - `data/repository/` interfaces + local implementations (the UI NEVER touches storage directly)
  - `lib/demo/` the demo kit
  - `i18n/` ar.json, en.json
  - `theme/` design tokens
  - `features/<feature>/` screens + components + hooks of one feature
  - `components/ui/` shared primitives
- Demo kit (`lib/demo/`):
  - storage wrapper with namespace `khenov-demo:<app>:v<SEED_VERSION>` and safe try/catch
  - `delay(min = 200, max = 600)` used by repositories to simulate network
  - `resetDemo()` clears the namespace and reseeds, behind a confirm dialog
  - seed versioning: bumping SEED_VERSION reseeds automatically
  - optional `?demo=fast` switch to disable delays for recording videos

## Design system rules

- Tokens first (color, 8pt spacing, radius, typography scale, shadow, motion durations). Use only tokens. Each app has its own identity fitting its sector, at the same craftsmanship level.
- Every screen designs ALL states: loading (skeletons), empty, error, success. Disabled / hover / active / focus visible.
- Core task in 3 interactions or less. Confirmations, undo where destructive, optimistic updates.
- No Lorem ipsum, no generic stock look, no placeholder boxes. Realistic Arabic and English copy.
- Bilingual AR/EN with correct RTL/LTR, mirrored layouts and directional icons. Default language Arabic, switchable at any time. Localize numbers, dates, currency (EGP). Never animate Arabic letter by letter.
- Animate only transform/opacity, short durations, respect reduced-motion. Accessibility: contrast, keyboard / screen-reader basics, labels, touch targets 44px+.
- Performance: lazy-load heavy things, optimized images, smooth on mid-range devices.

## Process

Work in milestones. At the end of each milestone STOP and send this report:

1. Milestone and status
2. What was built (short)
3. File tree of what changed
4. How to run and test (exact commands)
5. Decisions taken and why
6. Manual steps needed from the user
7. Known issues / risks
8. Quality-gate checklist results (states, RTL, motion, a11y, journey)
9. Proposed next milestone

`PROJECT_STATE.md` (repo root) is updated on every milestone (done / next / decisions / how to run). `docs/CONTRACT.md` holds this contract. The next milestone does not start until the Team Leader's new order arrives via the user.

## Project order: khenov-demo-clinic (Clinic Management DESKTOP app)

- Stack: Vite + React + TypeScript + Electron (electron-vite), Zustand, react-i18next, React Router, Radix primitives + Tailwind, lucide icons, date-fns. The renderer must also run in a normal browser (live web demo): no Node APIs in the renderer.
- Identity: calm, clean, light theme with a dark option, medical-trustworthy but modern (teal/blue), generous whitespace, dense-but-readable tables. Desktop-first: wide layouts, keyboard shortcuts, Command Palette (Ctrl/Cmd+K), row actions, resizable/collapsible sidebar.
- Roles (fake login, "Continue as demo"): Receptionist, Doctor.
- Fictional data: 4 doctors, ~30 patients (name, phone, age only; no medical history), ~40 appointments around today, services with EGP prices.
- Receptionist journey: login, today dashboard, weekly calendar (drag to reschedule, click empty slot to create), new appointment (patient search or quick-add, doctor, service, slot with conflict detection), status flow Pending > Confirmed > Arrived > Done / Cancelled with undo, simple patient profile, services and doctors management, simple reports with charts.
- Doctor journey: login, my day queue, mark arrived/done, short visit note (non-medical), my schedule.
- Also: notifications panel (simulated), global search, settings (language, theme, Reset demo).

Milestones:

- M0 Foundation: repo setup, tokens, themes, i18n AR/EN RTL, app shell, demo kit, seed data, repository layer, fake login. Runs in browser and Electron.
- M1 Receptionist core: dashboard, calendar, new appointment, status flow, full states.
- M2 Patients, doctors view, services, reports, notifications, search, shortcuts.
- M3 Polish: motion, RTL audit on every screen, a11y pass, empty/error states audit, performance, Reset demo.
- M4 Packaging: Electron builds (Windows first), static web build, app icon from KHENOV assets, README, PORTFOLIO PACK (cover spec, screenshot shot list, 30-second video script, project summary in AR and EN).

User environment: Windows 11/10, PowerShell (mention CMD if it differs), Node v24.15.0, git 2.48.1. If a package is incompatible with Node 24, say so and suggest Node 22 LTS before workarounds. Replies to the user are in Egyptian Arabic; code, commands and file names stay in English.
