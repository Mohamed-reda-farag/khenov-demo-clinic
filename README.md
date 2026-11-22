# Nabd Clinic / نبض كلينك

A **fictional clinic management demo** built by KHENOV as a portfolio piece: a desktop app (Electron) that also runs in the browser. **It is a demo, not a product.** All people, phone numbers, appointments and prices are made up; there is no backend, no real login and no real payment. Everything you do is saved only on your own device and can be reset at any time.

> Live demo: `<LIVE_DEMO_URL>` (placeholder, filled in after hosting). Windows download: `<DOWNLOAD_URL>` (placeholder).

## What you can try

Open the app and pick a role, then press **Continue as demo user**.

**Receptionist** (the full journey, start to finish)

1. **Dashboard**: today's counters, next appointments, load per doctor.
2. **Calendar**: weekly or daily view, filter by specialty and doctor, drag an appointment to reschedule it (the card follows the pointer, the target slot is shown, conflicts are flagged before you drop).
3. **New appointment** (`N`): searchable patient list with quick add, doctor, service, free-slot picker, clear conflict messages with the nearest free slots. Past times are refused.
4. **Status flow**: Pending, Confirmed, Arrived, Done. Or Cancelled, or **No-show** (only after the appointment's end time). Done, Cancelled and No-show are final and read-only. Every change has an **Undo** toast (`Ctrl/Cmd+Z`).
5. **Patients, Doctors, Services**: searchable tables, profiles, edit rules enforced with clear messages.
6. **Reports**: KPIs and plain-SVG charts (by day, status, busiest hours, by doctor), each with a text summary and a "show as table" switch.

**Doctor** (Dr. Hala Mansour; switch roles from the user menu without a reset)

- **My day**: today's queue with _Patient arrived_, _Complete visit_, _Did not attend_ and short visit notes.
- **My schedule**: your own appointments by week or day; click one to see the same actions.
- **My reports**: your own numbers only (never other doctors, never the clinic as a whole).

Everything is bilingual: **Arabic (default, full RTL)** and English, switchable at any time. Light and dark themes. Numbers, dates and currency (EGP) are localized.

## Run it

You need **Node.js LTS** (22 or newer) and git.

```powershell
npm install
npm run dev              # browser: http://localhost:5173
npm run dev:electron     # desktop window
```

Other commands:

| Command                   | What it does                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `npm run check`           | Type-check, lint, format check, i18n key parity, motion rule, docs links, unit tests |
| `npm run build:web`       | Static site in `dist/`                                                               |
| `npm run verify:dist`     | Checks `dist/` (files exist, relative paths, noindex, no dev URLs, no debug tools)   |
| `npm run release:web`     | `build:web` and `verify:dist` together                                               |
| `npm run build:electron`  | Desktop bundle in `out/`                                                             |
| `npm run verify:electron` | Same checks for `out/renderer`                                                       |
| `npm run preview`         | Serves `dist/` locally                                                               |

Hosting the static build is described in [docs/DEPLOY.md](docs/DEPLOY.md).

## Windows app

`npm run dist:win` builds a Windows installer (`NabdClinic-Demo-<version>-Setup.exe`) and a portable file (`...-Portable.exe`) with electron-builder. They are **not code-signed**, so Windows SmartScreen shows "Unknown publisher" the first time: choose _More info_, then _Run anyway_ (only for a file you got from the official link; compare its SHA-256 first). Steps, testing, the icon and the text to give downloaders are in [docs/BUILD-WINDOWS.md](docs/BUILD-WINDOWS.md). The installed app takes the same switches as a command-line argument, for example `--demo=fast`. The app icon is currently a **placeholder**.

## Portfolio Pack

Cover, screenshot list, 30-second video script, project summary and card data: [docs/portfolio/](docs/portfolio/README.md).

## Demo switches

Add them to the address, **before** the `#`, for example `http://localhost:5173/?demo=fast#/calendar`. Combine with commas: `?demo=fast,error`.

| Switch        | Effect                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------- |
| `?demo=fast`  | No simulated network delay (for recording videos)                                           |
| `?demo=error` | The first load of every list fails, so every error state and its _Try again_ can be shown   |
| `?demo=empty` | A clean clinic with no patients or appointments, kept in its own storage                    |
| `?debug=drag` | **Development only** (`npm run dev`): draws the drag math on the calendar. Not in any build |

**Reset demo** (user menu, or the login screen) clears the demo data and reseeds it after a confirmation. Language, theme and sidebar preferences are kept.

## Keyboard shortcuts

Press `?` in the app for the list. They work when no field or dialog is open.

| Keys                         | Action                                                 |
| ---------------------------- | ------------------------------------------------------ |
| `Ctrl/Cmd+K` or `/`          | Command palette and global search                      |
| `?`                          | Shortcuts sheet                                        |
| `Ctrl/Cmd+Z`                 | Undo the last change                                   |
| `N`                          | New appointment (receptionist)                         |
| `T`                          | Today / this week                                      |
| `[` and `]`                  | Previous / next week or day                            |
| `G` then `D` `C` `P` `S` `R` | Go to dashboard, calendar, patients, services, reports |

## How it is built

- **Stack**: Vite, React, TypeScript (strict), Electron (electron-vite), Zustand, react-i18next, hash routing, Radix primitives, Tailwind v4 locked to design tokens, lucide icons, date-fns, Vitest. No chart library (plain SVG) and no native date input (custom date picker).
- **No backend**: `src/data/repository/` is the only way the UI reaches data. Today it is implemented on `localStorage`; swapping it for a real API would not touch the screens.
- **Rules live in the repository**, not only in the UI: overlaps, working hours, no past bookings, the status flow, locked finished appointments and the no-show timing are enforced there and thrown as typed errors that the UI turns into messages. A single ordered write queue keeps changes consistent, and optimistic updates come with Undo.
- **Anchored seed**: the fictional data (4 doctors, 30 patients, about 40 appointments around today plus history for the reports) is generated relative to _today_, so the demo is meaningful on any day. `SEED_VERSION` (in `src/lib/demo/config.ts`) re-seeds automatically when the data shape changes. Storage keys are namespaced `khenov-demo:clinic:v<SEED_VERSION>`.
- **Role-scoped data**: the doctor's report is computed in the repository from the stored session; no argument can ask for another doctor's numbers.
- **Folders** (`src/`): `data/seed`, `data/repository`, `lib/demo` (demo kit), `i18n`, `theme` (design tokens), `features/<feature>`, `components/ui`. The contract is in [docs/CONTRACT.md](docs/CONTRACT.md); progress and decisions are in [PROJECT_STATE.md](PROJECT_STATE.md).
- **Honesty**: a "Demo by KHENOV" badge is always visible, and there is no real authentication or payment.

### Accessibility and performance

- Every screen has loading (skeleton), empty, error and success states. Focus is always visible, controls are at least 44 px, status is never shown by color alone (icon and label too), charts have text summaries and a table view, route changes are announced, and reduced-motion is respected.
- Only `transform` and `opacity` are animated. Routes and heavy dialogs are lazy-loaded; the entry script is about 134 KB gzipped.

## Credits and licenses

- Typeface: **IBM Plex Sans Arabic**, SIL Open Font License 1.1, via `@fontsource/ibm-plex-sans-arabic`.
- Icons: **Lucide** (ISC).
- UI primitives: **Radix UI** (MIT). Also React, Zustand, date-fns, i18next, react-i18next, React Router, Vite, Tailwind CSS, Electron and electron-vite (all MIT).
- The "Nabd Clinic" name and its pulse mark (`public/favicon.svg`) belong to this fictional demo. The KHENOV logo is not part of this repository.

The source is provided for portfolio review (`UNLICENSED`): please ask before reusing it.

---

## بالعربي

**نبض كلينك** تطبيق تجريبي لإدارة العيادة (عيادة وهمية) من **KHENOV**، بيشتغل كتطبيق سطح مكتب وفي المتصفح. ده **عرض تجريبي** مش منتج: كل الأسماء والأرقام والمواعيد والأسعار وهمية، ومفيش سيرفر ولا تسجيل دخول حقيقي ولا دفع حقيقي. كل اللي بتعمله بيتحفظ على جهازك بس، وتقدر ترجّع العرض لحالته الأولى في أي وقت (**إعادة ضبط العرض** من قائمة المستخدم).

- **موظف الاستقبال**: لوحة النهارده، تقويم بالسحب والإفلات، حجز موعد مع كشف التعارض، مسار الحالة (قيد الانتظار، مؤكد، وصل، تمّ، ملغي، لم يحضر) مع تراجع، المرضى والأطباء والخدمات، والتقارير.
- **الطبيب**: يومي، جدولي (أسبوع أو يوم)، وتقاريري (أرقامه هو بس).
- العربية هي الأساس (يمين لشمال بالكامل) مع الإنجليزية، ووضع فاتح وداكن.

للتشغيل: `npm install` ثم `npm run dev` (المتصفح) أو `npm run dev:electron` (نافذة سطح المكتب). للنشر على استضافة مجانية شوف [docs/DEPLOY.md](docs/DEPLOY.md).
