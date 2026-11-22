# Windows build (installer and portable)

Free tooling only: [electron-builder](https://www.electron.build) (a development dependency, never shipped inside the app). **Nothing is code-signed and no paid service is used.** Mac builds are not provided.

## Requirements

- Windows 10 or 11, Node.js 22 LTS or newer, git, an internet connection for the first build (it downloads Electron and the NSIS tools, about 150 MB, into `%LOCALAPPDATA%\electron` and `%LOCALAPPDATA%\electron-builder`).
- About 1 GB of free disk space and 3 to 10 minutes (most of it is compression).

## Build

```powershell
npm ci
npm run dist:win
```

`dist:win` runs, in order: the desktop bundle (`build:electron`), the output check (`verify:electron`), then electron-builder. The configuration is in `electron-builder.yml`.

Output, in `release/` (ignored by git):

| File                                 | What it is                                                             |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `NabdClinic-Demo-1.0.0-Setup.exe`    | Installer (NSIS, per user, no administrator rights, choose the folder) |
| `NabdClinic-Demo-1.0.0-Portable.exe` | Single file that runs without installing                               |
| `win-unpacked/`                      | The unpacked app (for debugging; do not share)                         |

Expected size: the installer is about **73 MB**, the portable file about **102 MB** (it is compressed less). Both are 64-bit (x64) only. The version in the file names comes from `version` in `package.json`.

## Test it

1. Run `NabdClinic-Demo-1.0.0-Setup.exe`, accept the SmartScreen prompt (below), install, and start **Nabd Clinic** from the Start menu. Or double-click the portable file.
2. The window title is "نبض كلينك · عرض تجريبي", the language is Arabic (right to left), and the login screen appears. Choose a role and **Continue as demo user**.
3. Open Calendar, Reports and Patients (these load on demand). Drag an appointment. Switch the role from the user menu. Try **Reset demo**.
4. Switch to English and to the dark theme, close the app, open it again: the choices and your demo data are still there.
5. Uninstall from Windows Settings, Apps. Demo data stays in `%APPDATA%\Nabd Clinic` until you delete that folder.

### Demo switches in the installed app

There is no address bar, so the `?demo=` switches become a command-line argument:

```powershell
& "$env:LOCALAPPDATA\Programs\Nabd Clinic\Nabd Clinic.exe" --demo=fast
& "$env:LOCALAPPDATA\Programs\Nabd Clinic\Nabd Clinic.exe" --demo=fast,error
.\NabdClinic-Demo-1.0.0-Portable.exe --demo=empty
```

`fast` removes the simulated network delay (use it when recording the video), `error` and `empty` show the error and empty states. The `?debug=drag` overlay is for `npm run dev` only and does not exist here.

## SmartScreen: "Windows protected your PC / Unknown publisher"

This message is expected and is not a sign of a problem. Windows shows it for any program that is not signed with a paid code-signing certificate and has not yet been downloaded by many people. The demo is deliberately unsigned.

Text you can give to someone who downloads it:

> **English.** Windows may show "Windows protected your PC" with "Unknown publisher" because this demo is not signed with a paid certificate. If you got the file from KHENOV and trust it: choose **More info**, then **Run anyway**. You can compare the file's fingerprint first with `Get-FileHash .\NabdClinic-Demo-1.0.0-Setup.exe` (the expected SHA-256 is published next to the download). The demo contains only fictional data and needs no account.
>
> **بالعربي.** ممكن ويندوز يعرض رسالة "Windows protected your PC" مع "Unknown publisher" لأن العرض التجريبي مش موقّع بشهادة مدفوعة. لو نزّلت الملف من KHENOV وواثق فيه: اضغط **More info** ثم **Run anyway**. وتقدر تتأكد من بصمة الملف الأول بالأمر `Get-FileHash`، والبصمة المتوقعة (SHA-256) منشورة جنب رابط التحميل. العرض فيه بيانات وهمية بس ومحتاجش حساب.

Browsers may also say the download is "not commonly downloaded". Keep it only if the file came from the official link. When publishing the download, publish its SHA-256 next to it:

```powershell
Get-FileHash .\release\NabdClinic-Demo-1.0.0-Setup.exe -Algorithm SHA256
```

## Icon (placeholder)

The icon is `build/icon.png`, generated from the fictional Nabd pulse mark. **It is a placeholder until the official KHENOV mark is supplied.** To swap it, replace that one file with a square 1024 × 1024 PNG and rebuild; electron-builder converts it to `.ico` itself (see `build/README.md`).

## If the build fails

- Paste the first error line. Common causes: no internet on the first run, antivirus locking `release/` (close it, delete `release/`, retry), or a very old Node (use Node 22 LTS).
- An error about "cannot create symbolic link" belongs to old electron-builder versions that unpacked signing tools; this project skips signing (`signExecutable: false`) and uses electron-builder 26, so it should not appear. If it does, turn on Windows **Developer Mode** (Settings, For developers) or use an Administrator PowerShell, delete `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign`, and retry.
