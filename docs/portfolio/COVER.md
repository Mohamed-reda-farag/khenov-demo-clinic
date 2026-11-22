# Cover image

**File:** `nabd-clinic-cover.webp`, **1600 × 1000 px** (16:10), WebP, aim for under 300 KB.

## What to show

The receptionist **Calendar, week view, Arabic, light theme** (the calm teal identity), with:

- the sidebar and top bar visible, the "Demo by KHENOV" badge in the top bar;
- the current week with a busy mix of appointment colors (waiting, arrived, done, cancelled, no-show);
- one appointment open in the side panel, so the status stepper shows.

No dialogs, no toasts, no error states. Do not show the browser frame.

## Safe margins

The portfolio site may crop the cover to wide, square or tall cards. Keep everything that matters (the panel and the main calendar area) inside the central **1200 × 760** area, leaving **200 px** on the left and right and **120 px** on top and bottom. The edges may show the sidebar and empty calendar rows, nothing important.

## How to produce it from a browser screenshot

1. Run the app (`npm run dev`, or the hosted demo). Open `http://localhost:5173/?demo=fast#/calendar`, continue as demo user, language Arabic, light theme.
2. In Chrome or Edge press `F12`, then `Ctrl+Shift+M` (device toolbar). Choose **Responsive** and type **1600 × 1000**, scale 100%. Set "Device pixel ratio" to **2** (three-dot menu, Add device pixel ratio) for a sharper image.
3. Open an appointment so the panel is visible. Press `Ctrl+Shift+P`, type `screenshot`, choose **Capture screenshot** (not "full size"). You get a PNG (3200 × 2000 at ratio 2).
4. Convert to WebP at 1600 × 1000 with ffmpeg (free, see [VIDEO.md](VIDEO.md) for installing it):

   ```powershell
   ffmpeg -i cover.png -vf "scale=1600:1000:flags=lanczos" -c:v libwebp -quality 82 nabd-clinic-cover.webp
   ```

5. Check the file is 1600 × 1000, under 300 KB, and looks right when cropped to a square around the center.
