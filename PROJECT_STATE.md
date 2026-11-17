# PROJECT_STATE: khenov-demo-clinic (Nabd Clinic)

## Done

- **M0 Foundation** (approved): tokens, AR/EN + RTL, app shell, Command Palette, demo kit, seed, repository layer, fake login, settings.
- **M1 Receptionist core** (delivered, awaiting Team Leader review)
  - Dashboard with real data: today's counters, next appointments, per-doctor load, quick actions.
  - Calendar: week (Saturday start) and day-by-doctor views, doctor filter, 09:00-21:00 grid, 15-minute snapping, now line, click an empty slot to book, drag to reschedule (live ghost, conflict flagged before drop), keyboard alternative through the appointment panel.
  - New appointment dialog: searchable patient combobox (AR/EN/phone) with quick add, doctor, service, date, free-slot picker, inline conflict messages with nearest free slots.
  - Appointment panel: status flow Pending > Confirmed > Arrived > Done (+ Cancelled with optional reason), edit / reschedule, delete with confirm. Every change shows a toast with Undo (Ctrl/Cmd+Z too).
  - Repositories enforce overlap, patient overlap, working hours and the status flow, and throw typed `RepositoryError`s.
  - 50 unit tests (conflicts, slots, status flow, lane layout, seed anchor, repository rules), part of `npm run check`.

## Next

- M2 Patients, doctors view, services, reports, notifications, search, shortcuts. Waiting for the Team Leader's order.

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
- Doctor role keeps the placeholder pages; it cannot reach receptionist routes.

## Dependencies added in M1

- `vitest` (dev): unit tests for the scheduling rules, repositories and seed.

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

Add `?demo=fast` to the browser URL to disable simulated delays.
