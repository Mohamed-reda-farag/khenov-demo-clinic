# Hosting the web demo

The web build is a plain static site (`dist/`): no server code, hash routing, and every path inside it is relative. It therefore works from the root of a host, from any sub-path, and from `file://`.

## Recommended host: Cloudflare Pages (free), Direct Upload

Why: it serves the demo from the **root of its own address** (`https://<project>.pages.dev/`), static requests are free and unlimited on the free plan, it reads the `_headers` file in `dist/` (long cache for hashed files, noindex header), and it needs no build step on the host: we upload the folder we already built and verified. GitHub Pages is the fallback (free, but the address is a sub-path `https://<user>.github.io/<repo>/`, it cannot set headers, and the repository must be public on a free account).

Free-plan limits that matter here: 20,000 files per site (the demo has about 70) and 25 MiB per file (the largest is about 0.45 MB).

> **No account has been created for you.** Creating the Cloudflare account (free, no card) is the first manual step below.

### One-time setup

1. Create a free account at <https://dash.cloudflare.com/sign-up> and verify the email.
2. Build and verify:

   ```powershell
   npm run release:web
   ```

   It must end with `verify-dist OK`.

3. Log in from the terminal (opens the browser once):

   ```powershell
   npx wrangler login
   ```

4. Create the project and upload:

   ```powershell
   npx wrangler pages project create nabd-clinic-demo --production-branch main
   npx wrangler pages deploy dist --project-name nabd-clinic-demo --branch main
   ```

   The command prints the address, `https://nabd-clinic-demo.pages.dev` (the name may get a suffix if it is taken).

   Prefer clicking? In the Cloudflare dashboard open **Workers & Pages**, create a **Pages** project with **Direct Upload**, and drag the `dist` folder in. Direct Upload projects cannot be switched to Git integration later.

`npx` downloads Wrangler on demand; it is not added to the project's dependencies.

### Updating the demo

```powershell
npm run release:web
npx wrangler pages deploy dist --project-name nabd-clinic-demo --branch main
```

### Check the result

```powershell
curl.exe -I https://nabd-clinic-demo.pages.dev/
curl.exe -I https://nabd-clinic-demo.pages.dev/assets/<any file name from dist/assets>
```

Expected: the entry page has `cache-control: no-cache`; files in `/assets/` have `cache-control: public, max-age=31536000, immutable`; every response has `x-robots-tag: noindex, nofollow`. If a header is missing, the host did not read `_headers`: the demo still works, and the `<meta name="robots" content="noindex, nofollow">` tag in `index.html` keeps it out of search engines.

Then open the address, continue as a demo user, open the calendar and reports (lazy-loaded screens), and reload on a deep link such as `/#/calendar`.

## Other hosts and sub-paths

- Any static host works: upload the contents of `dist/`. `_headers` is only used by Cloudflare Pages and Netlify; other hosts ignore it.
- A sub-path (for example `https://example.com/demos/nabd/`) needs no setting: `vite.config.mts` uses `base: './'` and the app uses hash routing, so nothing depends on where it is placed. `npm run verify:dist` fails if `index.html` ever gets a root-absolute path.
- The desktop build reads the same files from disk (`file://`), which is why paths stay relative.

## What `npm run verify:dist` checks

`index.html` exists; it has a `noindex` robots tag; it uses only relative paths and no external resources; every script, style, lazy chunk, font and image named in the build exists; no `localhost:<port>`, `127.0.0.1` or `0.0.0.0` address is inside; the development-only drag overlay is not in the build; no source maps; no file over 5 MB. `npm run verify:electron` runs the same checks on `out/renderer`.
