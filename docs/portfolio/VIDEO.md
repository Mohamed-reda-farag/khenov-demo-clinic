# 30-second video

**Target:** 30 seconds, 1280 × 720 (or 1920 × 1080), H.264 MP4, **muted** (no audio track), **under 4 MB**, file name `nabd-clinic-demo-30s.mp4`. Record in Arabic (the default), with bilingual captions added in the editor.

## Before recording

1. Do it **in the afternoon or evening** (after about 3 PM): the no-show action only exists once an appointment's time has ended.
2. Start fresh: user menu, **Reset demo**. Use the demo switch that removes delays:
   - browser: `http://localhost:5173/?demo=fast#/calendar` (or the hosted address with `?demo=fast`);
   - installed app: `& "$env:LOCALAPPDATA\Programs\Nabd Clinic\Nabd Clinic.exe" --demo=fast`.
3. Prepare the conflict (shot 2 below): in the calendar, find a time when **Dr. B** already has an appointment; remember that time and Dr. B.
4. Windows: turn on **Do not disturb** so no notification appears; close other windows; set display scaling to 100% if you can.
5. Rehearse twice. Move the mouse slowly and deliberately; pause a beat after each result.

## Script

| Time         | Screen                          | Action                                                                                                                           | On-screen text (AR / EN)                                   |
| ------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 0:00 to 0:03 | Title card (made in the editor) | Plain card with the app name and the demo label. Use text only; do not invent a logo.                                            | **نبض كلينك** / Nabd Clinic<br>عرض تجريبي · Demo by KHENOV |
| 0:03 to 0:09 | Calendar, week then day         | Drag an appointment over a busy slot (the card turns red with the reason), then to a free slot and drop. Undo toast appears.     | اسحب لتغيير الميعاد / Drag to reschedule                   |
| 0:09 to 0:15 | New appointment (`N`)           | Pick a patient, pick a time with Dr. A, switch to Dr. B: the red conflict message and the suggested times appear. Tap one, book. | التعارض يتكشف قبل الحجز / Conflicts caught before booking  |
| 0:15 to 0:20 | Appointment panel               | Confirm, Patient arrived, Done (the stepper moves). Then open an earlier appointment and press **Mark as no-show**; show Undo.   | مسار الحالة مع تراجع / Status flow with undo               |
| 0:20 to 0:25 | Doctor role                     | User menu, switch to Doctor. My day: **Patient arrived**. Open My schedule and flip Week to Day.                                 | دور الطبيب / The doctor's view                             |
| 0:25 to 0:28 | Reports                         | Open Reports; the KPIs count up and the status donut shows the no-shows. Toggle the dark theme.                                  | تقارير واضحة / Clear reports                               |
| 0:28 to 0:30 | End card (editor)               | Static card.                                                                                                                     | عرض تجريبي ببيانات وهمية / Demo with fictional data        |

Captions: Arabic on top (bigger), English below, white text on a semi-transparent dark bar, inside the bottom 15% of the frame, shown for the whole beat. Use **IBM Plex Sans Arabic** (free, the same typeface as the app).

## Recording on Windows (free)

- **Xbox Game Bar** (built in): `Win+G`, Capture, Record, or `Win+Alt+R`. Records the active window (the browser or the app) at up to 1080p. Files land in `Videos\Captures`. It cannot record the desktop or File Explorer.
- **OBS Studio** (free, open source, <https://obsproject.com>): Settings, Video, Base and Output resolution **1920 × 1080**, FPS **30**; add a **Window Capture** of the browser or app; Output, Recording Format **mkv** (safer if it crashes), then File, Remux Recordings to mp4.
- Record at 1920 × 1080 and 30 fps. In the browser press `F11` for full screen and keep zoom at 100%.

## Editing checklist

- [ ] Trim dead time; the whole video is 30.0 s or a little less.
- [ ] Speed up slow parts to 125% at most; never speed up text that must be read.
- [ ] Captions on every beat (Arabic and English), title card, end card.
- [ ] No audio track at all (mute and remove it).
- [ ] The "Demo by KHENOV" badge is visible in the app frames; no real names or numbers anywhere.
- [ ] Zoom in a little (110% to 120%) on the part that matters in each beat if the details are small.
- [ ] Export 1080p MP4, then compress (below).
- [ ] Play the compressed file on a phone-sized window: can you still read the captions?

Free editors that work: DaVinci Resolve (free edition) or Shotcut.

## Compress

Install ffmpeg once (free): `winget install Gyan.FFmpeg`, then open a new PowerShell.

Standard (1280 × 720, comfortably under 4 MB):

```powershell
ffmpeg -i raw.mp4 -an -vf "fps=30,scale=1280:-2:flags=lanczos" -c:v libx264 -preset slow -crf 27 -maxrate 900k -bufsize 1800k -pix_fmt yuv420p -profile:v high -movflags +faststart nabd-clinic-demo-30s.mp4
```

If the text still looks soft and you have room, keep 1080p (tested at about 3.9 MB for a very busy 30-second clip; a screen recording is usually smaller):

```powershell
ffmpeg -i raw.mp4 -an -vf "fps=30" -c:v libx264 -preset slow -crf 30 -maxrate 1000k -bufsize 2000k -pix_fmt yuv420p -profile:v high -movflags +faststart nabd-clinic-demo-30s.mp4
```

Check the size and the format:

```powershell
"{0:N2} MB" -f ((Get-Item nabd-clinic-demo-30s.mp4).Length / 1MB)
ffprobe -v error -show_entries stream=codec_name,width,height -of default=nw=1 nabd-clinic-demo-30s.mp4
```

It must say `h264`, no audio stream, and the size must be under 4 MB. If it is over, lower `-maxrate` (for example 800k) and run it again.
