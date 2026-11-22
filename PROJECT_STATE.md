# PROJECT_STATE: khenov-demo-clinic (Nabd Clinic)

## Done

- **M0 Foundation** (approved): tokens, AR/EN + RTL, app shell, Command Palette, demo kit, seed, repository layer, fake login, settings.
- **M1 Receptionist core** (approved)
  - Dashboard with real data: today's counters, next appointments, per-doctor load, quick actions.
  - Calendar: week (Saturday start) and day-by-doctor views, doctor filter, 09:00-21:00 grid, 15-minute snapping, now line, drag to reschedule (live ghost, conflict flagged before drop), keyboard alternative through the appointment panel.
  - New appointment dialog: searchable patient combobox (AR/EN/phone) with quick add, doctor, service, date, free-slot picker, inline conflict messages with nearest free slots.
  - Appointment panel: status flow Pending > Confirmed > Arrived > Done (+ Cancelled with optional reason), edit / reschedule, delete with confirm. Every change shows a toast with Undo (Ctrl/Cmd+Z too).
  - Repositories enforce overlap, patient overlap, working hours and the status flow, and throw typed `RepositoryError`s.
  - 50 unit tests (conflicts, slots, status flow, lane layout, seed anchor, repository rules), part of `npm run check`.

- **M2 Patients, doctors, services, reports, notifications, search, shortcuts, Doctor role** (approved)
  - M1 fixes: custom localized date picker (Radix Popover + date-fns, Saturday-first, AR/EN digits and names, keyboard operable, no native date input left); drag ghost is clipped so it never covers or hides under the sticky header, and the grid auto-scrolls (vertical and horizontal) while dragging near an edge.
  - Patients: searchable / sortable / filterable table, profile with appointment history, add / edit / delete (blocked with a clear message while upcoming appointments exist; deleting removes past history).
  - Doctors: cards with hours and today's load, detail page with a read-only weekly schedule, edit (name, specialty, hours, active). Hours are enforced in the repository (grid range, no upcoming appointment left outside, inactive doctors refuse new bookings).
  - Services: table, add / edit / delete (blocked while upcoming appointments use it; duration and specialty locked then).
  - Reports (lazy-loaded): range selector, KPIs, plain-SVG charts (by day, by status, busiest hours, by doctor), each with a text summary and a "show as table" switch.
  - Notifications: bell with unread badge, panel (read / unread, mark all read, empty / loading / error), generated from real actions plus a few seeded ones.
  - Global search inside the Command Palette: patients, doctors, services, appointments, Arabic normalization, grouped and keyboard navigable.
  - Shortcuts: `?` cheat sheet, N, T, [ ], /, Ctrl/Cmd+K, Ctrl/Cmd+Z, G then D / C / P / S / R.
  - Doctor role: My day queue (arrived / done, visit note up to 200 characters), My schedule (read-only week), friendly "not available for your role" screen, role switch from the user menu without a reset.
  - 89 unit tests.

- **M3 Polish** (approved)
  - User fixes: booking is no longer possible by clicking a calendar cell (only the "New appointment" button, N, or the palette); drag never triggers a click (a capture-phase guard swallows the click after a drop). Booking, editing and dragging into the past are refused: `past_time` in the repository, mirrored in the form (no past slots, disabled past days, "try tomorrow") and in the drag ghost.
  - Motion: route transitions, shimmer skeletons (transform only), status-badge pop, count-up numbers (reduced-motion safe), entry animations for dialogs, popovers, toasts, blocks and list items.
  - Audit: RTL and dark pass on every screen (see the report), contrast checked for every token pair in both themes, accessibility fixes (route announcements and focus, linked field errors, status icons, chart descriptions, landmarks).
  - `?demo=error` (every list fails once, Retry recovers) and `?demo=empty` (clean clinic in its own storage) to reach every error and empty state.
  - Performance: every heavy screen and dialog is a separate chunk; the Electron renderer is minified.
  - Reset demo: explains what is reset, keeps preferences, and confirms on the login screen.
  - 110 unit tests (past-time rule with an injectable clock, demo switches, repository rules).

- **M3.1a user-reported fixes, receptionist** (approved)
  - Calendar: specialty filter next to the doctor filter (shared calendar store; doctor options narrow to the specialty; changing it resets an incompatible doctor; "all" clears).
  - The navigation button says "Today" in day view and "This week" in week view, jumps accordingly, and is subtle / `aria-disabled` when the current day or week is already shown (also on the doctor's schedule).
  - Finished appointments (Done, Cancelled, No-show) are locked: the repository throws `locked_status` for any change of time, doctor, service or patient; the UI shows no grab cursor, no Edit action and a read-only note. Visit notes stay writable.
  - Drag: the card follows the pointer at the exact grabbed point (offset taken at pointerdown, applied to the ghost); a dashed slot shows the snapped target, computed from the card's top edge. Pure functions in `lib/scheduling/drag.ts`.
  - New status No-show (`no_show`, "لم يحضر"): Pending or Confirmed to No-show only once the end time has passed (`now >= end`, injectable clock), final, undo through the toast. Own icon (UserX), violet token pair, label in AR/EN, dashboard counter, panel action, notification and toast text. Reports: separate count, "no-show rate" KPI, donut slice and summary. Seed: a few past no-shows.
  - 159 unit tests.

- **M3.1b doctor role + drag fix** (approved)
  - Drag root cause: the route wrapper `.anim-route` kept `transform: matrix(1,0,0,1,0,0)` after its entry animation (`animation-fill-mode: both`), which made it the containing block of the `position: fixed` ghost, so the ghost was shifted by the sidebar width and top bar height. Fixed by rendering the ghost in a portal on `document.body`, and by `backwards` fill on `.anim-route` (guarded by `npm run check:motion`). Math is one viewport space in `lib/scheduling/drag.ts` (`resolveDrag`): ghost = pointer minus grab offset, column from the ghost's horizontal centre, time from the ghost's top edge.
  - Drag debug overlay (dev only): open the calendar with `?debug=drag` (`npm run dev`). It draws the pointer (red dot, must sit on the grabbed point of the ghost), the ghost top edge (magenta line) and the computed slot (green outline), plus a readout. It is absent from production builds. To remove it for good: delete `features/calendar/dragDebug.ts` and `DragDebugOverlay.tsx` and the two lines that use them in `CalendarGrid.tsx`.
  - Doctor: "My schedule" has Day / Week (default Week) with the same Today / This week rule; the shared `features/appointments/VisitActions.tsx` serves "My day" and the panel that opens from a schedule card (Patient arrived, Complete visit, Did not attend after the end time, visit note, read-only note for finished ones).
  - Doctor "My reports" (`/my-reports`, G then R): `repositories.reports.myReport(range)` takes the doctor from the stored session (never from an argument; `forbidden` otherwise) and reuses the pure `aggregate` functions through `buildDoctorReport`. No by-doctor chart, no clinic comparison, no revenue.
  - "Working day" in the average-per-working-day KPI means a day of the range with at least one not-cancelled appointment of that doctor.
  - Arabic spelling unified to "النهاردة".

- **M4a Web hosting, README, repo hygiene** (delivered, awaiting Team Leader review)
  - Static web build is host-agnostic (`base: './'`, hash routing); tested from the root, from a nested sub-path and from `file://`. `index.html` carries `noindex, nofollow`; `public/_headers` adds the same header plus long cache for hashed files and no-cache for the entry page (Cloudflare Pages / Netlify read it, other hosts ignore it).
  - Recommended host: Cloudflare Pages with Direct Upload (root address, free unlimited static requests, `_headers`). Steps in `docs/DEPLOY.md`. **No account has been created; waiting for approval.**
  - `npm run verify:dist` / `verify:electron` (`scripts/verify-dist.mjs`) and `npm run release:web`; `npm run check:docs` (README / docs relative links) is part of `npm run check`.
  - `README.md` (English + short Arabic), version 1.0.0, `license: UNLICENSED` (portfolio review only).
  - `?debug=drag` is development only: the overlay chunk and its strings are absent from the web and desktop builds (checked by `verify-dist`).
  - `npm audit`: 0 vulnerabilities in production dependencies; 7 moderate ones in the dev-only lint chain (typescript-eslint / minimatch), not shipped. Left as is on purpose (the suggested fix touches the lint stack); re-check before M4b ships.
  - Identity: app name "Nabd Clinic / نبض كلينك", page title "Nabd Clinic · Demo" (EN) or "نبض كلينك · عرض تجريبي" (AR), window title follows the page. The only mark in the repo is the fictional Nabd pulse mark (`public/favicon.svg`); the KHENOV logo is not in the repo and is needed from the user for the app icon (see the M4a report).

- **M4b Windows build + Portfolio Pack** (delivered, awaiting Team Leader review)
  - `electron-builder` 26 is a **devDependency only** (packaging tool, not shipped; no runtime dependency added). Config in `electron-builder.yml`; `npm run dist:win` = `build:electron` + `verify:electron` + electron-builder. Targets: NSIS installer (per user, choose folder) and portable, x64, unsigned (`signExecutable: false`: signing skipped, icon and version info still written). Output goes to `release/` (git-ignored). English and Arabic locales only; no `node_modules` inside the app.
  - The installed app has no address bar, so `electron/main.ts` turns a `--demo=fast|error|empty` argument into the same `?demo=` query. Packaged `app.asar` was smoke-tested in real Electron (file:// inside the asar, hash routing, lazy screens, flags).
  - **App icon is a PLACEHOLDER**: `build/icon.png` rendered from the fictional Nabd pulse mark. To swap it: replace `build/icon.png` with the KHENOV mark (square 1024 x 1024 PNG) and rebuild; electron-builder produces the `.ico`.
  - `package.json` now has `productName` ("Nabd Clinic"), which also names the user-data folder (`%APPDATA%\Nabd Clinic`).
  - Portfolio Pack in `docs/portfolio/` (cover, 6 screenshots, 30 s video script, summary AR/EN, `card.json`). `check:docs` also validates `card.json`. Media files (`docs/portfolio/media/`) are not committed.
  - Not done in the sandbox: the NSIS installer step (needs wine on Linux); it runs natively on Windows. The portable build (102 MB) and the unpacked app were built; the installer payload measured 73 MB.

## Next

- After M4b approval: tag v1.0.0, deploy the three demos together (hosting account not created yet), swap the placeholder icon for the KHENOV mark, produce the real screenshots and video.

## Decisions

- One renderer, two entry points: `vite` for the browser, `electron-vite` for desktop. Hash routing so it works from file:// and on any static host.
- Tailwind v4 with the default palette, radius, text and shadow scales reset; only token-backed utilities exist.
- Preferences (language, theme, sidebar) are stored outside the versioned namespace, so Reset demo and SEED_VERSION bumps keep them.
- Hover/focus feedback is instant; only transform and opacity are animated.
- The demo Doctor user is the first doctor (Dr. Hala Mansour, `dr-1`).
- Extra folders beyond the convention: `src/app/` (router, guards, bootstrap) and `src/stores/` (Zustand).
- Brand name "Nabd Clinic / نبض كلينك" is a fictional demo brand.

- Seed version is 2. Seed times are built in wall-clock time (no DST drift) and are re-anchored to today's date whenever the demo is opened on a later day.
- All appointment writes are optimistic and run through a single ordered queue, so Undo can never be applied out of order.
- Drag and drop uses native pointer events (no library). The ghost is a fixed element moved with `transform`, and column rectangles are measured at pointer time, so there is no layout work while dragging.
- Native `<select>` and `<input type="date">` are used for doctor, service and date fields (free, accessible, no extra dependency). The date input follows the browser's locale.
- Doctor role screens are real (My day, My schedule); each role sees a friendly message on screens that belong to the other role.
- Seed is version 3: ~55 extra past appointments (days -3 to -28) so the reports have data; the 40 appointments around today are unchanged. Notifications are stored in the demo namespace and seeded relative to now.
- Deleting a patient also removes their past appointments; deleting a service keeps past appointments (shown as "Deleted service").
- Charts are plain SVG; the reports route is code-split (it is small because there is no chart library).
- Palette results are ordered patients, doctors, services, then appointments, so the strongest match is first.

- "Now" comes from `src/lib/clock.ts` (the real clock; tests inject one with `setClock`). A start time earlier than the current time rounded up to the next quarter hour is in the past. Existing past appointments keep their time and can still change status or notes; only moving them to a past time is refused.
- Booking is available only from the toolbar button, N and the palette; calendar cells are not interactive.
- `?demo=` accepts a comma list: `fast`, `error`, `empty`.

## Dependencies added

- M1: `vitest` (dev): unit tests.
- M3: none.
- M2: `@radix-ui/react-popover` (date picker and notifications panel: focus handling, positioning, Esc) and `@radix-ui/react-dropdown-menu` (user menu: roving focus, typeahead, correct menu semantics).

## How to run

```powershell
npm install
npm run dev              # browser: http://localhost:5173
npm run dev:electron     # desktop window
npm run check            # typecheck + lint + prettier + i18n parity + unit tests
npm run test             # unit tests only
npm run build:web        # static site in dist/
npm run build:electron   # compiled app in out/
```

Add `?demo=fast` to the browser URL to disable simulated delays, `?demo=error` to see every error state (Retry recovers), `?demo=empty` for a clean clinic. Combine them: `?demo=fast,error`.

- Seed is version 4 (M3.1a): past appointments now include no-shows, so stored demo data is re-seeded once (preferences are kept).
- Repository error codes are lowercase snake case like the existing ones: `locked_status` is the LOCKED_STATUS error.
- Release tag (after M4b is approved): `git tag -a v1.0.0 -m "Nabd Clinic demo 1.0.0"` then `git push origin v1.0.0`.
