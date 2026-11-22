# Build resources

`icon.png` is the app icon used by `npm run dist:win` (installer, portable exe and the installed app).

> **PLACEHOLDER.** It was generated from the fictional "Nabd Clinic" pulse mark (`public/favicon.svg`). The official KHENOV mark has not been supplied yet.

To swap it: replace `build/icon.png` with a square PNG of **1024 × 1024** (transparent corners are fine) and run `npm run dist:win` again. electron-builder converts the PNG to a multi-size `.ico` by itself (the converted file appears in `release/.icon-ico/icon.ico` after a build). Nothing else needs to change.
