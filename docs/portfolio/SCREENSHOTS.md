# Screenshot shot list

**Viewport for all shots: 1440 × 900**, device pixel ratio 2, captured with the browser's **Capture screenshot** (see [COVER.md](COVER.md), steps 2 and 3), then converted to WebP at 1440 × 900 (command at the end). Always continue as a demo user first and use `?demo=fast`.

Do it **in the afternoon or evening** (after about 3 PM local time): the seed is built around today, and the no-show action only exists for appointments whose time has already ended.

Start from a fresh state: user menu, **Reset demo**.

| #   | File                                 | Role and language | Theme | Address and steps                                                                                                                                                                                        |
| --- | ------------------------------------ | ----------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `01-calendar-week-ar-light.webp`     | Receptionist, AR  | Light | `/?demo=fast#/calendar`. Week view. Open one appointment so the panel with the stepper shows. (This is also the cover.)                                                                                  |
| 2   | `02-drag-reschedule-en-light.webp`   | Receptionist, EN  | Light | Calendar, Day view. Press and hold an appointment, drag it over a busy slot so the red message shows. **Do not release.** Take this one as a frame from the video (command below), not with DevTools.    |
| 3   | `03-booking-conflict-ar-light.webp`  | Receptionist, AR  | Light | Press `N`. Pick a patient. Pick Dr. A and a free time that is **busy for Dr. B** (look at the calendar first). Then switch the doctor to Dr. B: the red conflict message and the suggested times appear. |
| 4   | `04-status-flow-noshow-en-dark.webp` | Receptionist, EN  | Dark  | Calendar, open an appointment from earlier today that is still Confirmed. The panel shows the stepper and **Mark as no-show**. Toggle the dark theme from the top bar.                                   |
| 5   | `05-doctor-my-day-ar-light.webp`     | Doctor, AR        | Light | User menu, switch to Doctor (Dr. Hala Mansour). Open **My day**: counters and the queue with **Patient arrived** and **Did not attend**.                                                                 |
| 6   | `06-reports-en-dark.webp`            | Receptionist, EN  | Dark  | `/?demo=fast#/reports`, range **Last 30 days**. Wait for the numbers to finish counting. Show the KPIs and the status donut (with no-shows).                                                             |

Notes

- Hide the browser's bookmarks bar and extensions. Capture only the page (the DevTools command does this).
- Arabic shots keep numbers in Arabic-Indic digits (the app does this itself).
- Do not edit the interface in the images. You may crop, never retouch.
- Every shot must show the "Demo by KHENOV" badge (top bar). Shots 1, 5 and 6 are the best candidates for the card gallery.

Convert each PNG:

```powershell
ffmpeg -i 01.png -vf "scale=1440:900:flags=lanczos" -c:v libwebp -quality 82 01-calendar-week-ar-light.webp
```

Take shot 2 from the finished video (a frame at 0:05, here):

```powershell
ffmpeg -ss 5 -i nabd-clinic-demo-30s.mp4 -frames:v 1 -c:v libwebp -quality 82 02-drag-reschedule-en-light.webp
```

**Why there is no capture script:** a repeatable script would need Playwright as a development dependency plus a browser download of about 170 MB, for six images that are taken once. Manual steps keep the project free of that.
