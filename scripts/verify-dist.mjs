// Checks a finished build before it is hosted or packaged.
// Usage: node scripts/verify-dist.mjs [dir]   (default: dist; use out/renderer for the desktop build)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? 'dist');
const errors = [];
const fail = (message) => {
  if (!errors.includes(message)) errors.push(message);
};

if (!existsSync(join(dir, 'index.html'))) {
  console.error(`verify-dist: ${dir}/index.html not found. Run the build first.`);
  process.exit(1);
}

/** Every file under `root`, as paths relative to `dir` using "/". */
function walk(root, prefix = '') {
  return readdirSync(root).flatMap((name) => {
    const full = join(root, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    return statSync(full).isDirectory() ? walk(full, rel) : [rel];
  });
}
const files = walk(dir);
const exists = (rel) => existsSync(join(dir, rel));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

// 1. index.html: noindex, and only relative references (they must work on any path and from file://).
if (!/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) {
  fail('index.html has no <meta name="robots" content="noindex, ..."> tag');
}
const refs = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map((m) => m[1]);
for (const ref of refs) {
  if (/^(data:|#|mailto:)/.test(ref)) continue;
  if (/^(https?:)?\/\//.test(ref)) {
    fail(`index.html loads an external resource: ${ref}`);
  } else if (ref.startsWith('/')) {
    fail(`index.html uses a root-absolute path (breaks sub-paths and file://): ${ref}`);
  } else if (!exists(ref.replace(/^\.\//, '').split(/[?#]/)[0])) {
    fail(`index.html references a missing file: ${ref}`);
  }
}

// 2. Every file named inside the scripts and styles (lazy chunks, fonts, images) exists.
//    Vite writes them as "./Name-hash.js" (relative to the file) or "assets/Name-hash.js".
const textFiles = files.filter((f) => ['.js', '.css', '.html'].includes(extname(f)));
const relativeRef = /["'`(]\.\/([A-Za-z0-9_.@-]+\.(?:js|css|woff2?|svg|png|webp|jpe?g|ico))["'`)]/g;
const assetRef = /assets\/[A-Za-z0-9_.@-]+\.(?:js|css|woff2?|svg|png|webp|jpe?g|ico)/g;
for (const file of textFiles) {
  const text = readFileSync(join(dir, file), 'utf8');
  const here = file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '';
  for (const match of text.matchAll(relativeRef)) {
    const target = here ? `${here}/${match[1]}` : match[1];
    if (!exists(target)) fail(`${file} references a missing file: ./${match[1]}`);
  }
  for (const match of text.matchAll(assetRef)) {
    if (!exists(match[0])) fail(`${file} references a missing asset: ${match[0]}`);
  }
  // 3. No development URLs. A bare "http://localhost" is only react-router's URL base, not a request.
  const dev = text.match(/(?:https?:\/\/)?(?:localhost:\d+|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/);
  if (dev) fail(`${file} contains a development address: ${dev[0]}`);
}

// 4. Development-only tools must not ship (see src/features/calendar/dragDebug.ts).
const leaked = files.filter((f) => /DragDebug/i.test(f));
for (const file of leaked) fail(`development-only file in the build: ${file}`);
for (const file of textFiles) {
  if (/DragDebugOverlay|data-drag-debug/.test(readFileSync(join(dir, file), 'utf8'))) {
    fail(`${file} contains the drag debug overlay`);
  }
}

// 5. No source maps, and nothing unexpectedly large for a free static host.
for (const file of files) {
  if (file.endsWith('.map')) fail(`source map in the build: ${file}`);
  if (statSync(join(dir, file)).size > 5 * 1024 * 1024) fail(`file larger than 5 MB: ${file}`);
}

if (errors.length > 0) {
  console.error(`verify-dist: ${errors.length} problem(s) in ${dir}`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
const total = files.reduce((sum, f) => sum + statSync(join(dir, f)).size, 0);
console.log(
  `verify-dist OK: ${dir} (${files.length} files, ${(total / 1024).toFixed(0)} KB; ` +
    'relative paths, noindex, no dev URLs, no debug tools)',
);
