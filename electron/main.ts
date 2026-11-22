import { join } from 'node:path';
import { app, BrowserWindow, Menu, shell } from 'electron';

/**
 * Demo switches for the installed app, which has no address bar: start it with `--demo=fast`,
 * `--demo=error`, `--demo=empty` (or a comma list such as `--demo=fast,error`). They reach the
 * renderer as the same `?demo=` query the browser version reads.
 */
function demoQuery(): Record<string, string> | undefined {
  const value = process.argv.find((arg) => arg.startsWith('--demo='))?.slice('--demo='.length);
  return value && /^[a-z,]+$/.test(value) ? { demo: value } : undefined;
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    title: 'Nabd Clinic',
    backgroundColor: '#F3F7F8',
    autoHideMenuBar: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });

  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devUrl) {
    void win.loadURL(devUrl);
  } else {
    const query = demoQuery();
    void win.loadFile(join(__dirname, '../renderer/index.html'), query ? { query } : undefined);
  }
}

void app.whenReady().then(() => {
  if (app.isPackaged) Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
