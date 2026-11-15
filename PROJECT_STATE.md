# PROJECT_STATE: khenov-demo-clinic (Nabd Clinic)

## Done

- **M0 Foundation** (delivered, awaiting Team Leader review)
  - Vite + React 19 + TypeScript strict, Tailwind v4 (token-driven), Electron via electron-vite.
  - Design tokens (light + dark), AR/EN i18n with RTL/LTR, Intl formatters (numbers, dates, EGP).
  - App shell: resizable/collapsible sidebar, topbar, Command Palette (Ctrl/Cmd+K), role-based navigation.
  - Demo kit: namespaced storage, delay, seeding + versioning, resetDemo with confirm dialog, `?demo=fast`.
  - Seed: 4 doctors, 30 patients, 9 services, 40 appointments around today.
  - Repository layer (interfaces + local implementation), fake login (Receptionist / Doctor), settings (language, theme, Reset demo).

## Next

- M1 Receptionist core (dashboard, weekly calendar, new appointment, status flow). Waiting for the Team Leader's order.

## Decisions

- One renderer, two entry points: `vite` for the browser, `electron-vite` for desktop. Hash routing so it works from file:// and on any static host.
- Tailwind v4 with the default palette, radius, text and shadow scales reset; only token-backed utilities exist.
- Preferences (language, theme, sidebar) are stored outside the versioned namespace, so Reset demo and SEED_VERSION bumps keep them.
- Hover/focus feedback is instant; only transform and opacity are animated.
- The demo Doctor user is the first doctor (Dr. Hala Mansour, `dr-1`).
- Extra folders beyond the convention: `src/app/` (router, guards, bootstrap) and `src/stores/` (Zustand).
- Brand name "Nabd Clinic / نبض كلينك" is a fictional demo brand.

## How to run

```powershell
npm install
npm run dev              # browser: http://localhost:5173
npm run dev:electron     # desktop window
npm run check            # typecheck + lint + prettier + i18n parity
npm run build:web        # static site in dist/
npm run build:electron   # compiled app in out/
```

Add `?demo=fast` to the browser URL to disable simulated delays.
