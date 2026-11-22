// Checks that every relative link in README.md and docs/**/*.md points at a file that exists.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath decodes %20 and handles Windows drive letters (the project path may contain spaces).
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const markdown = [];
const collect = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collect(full);
    else if (name.endsWith('.md')) markdown.push(full);
  }
};
markdown.push(join(root, 'README.md'));
collect(join(root, 'docs'));

const errors = [];
for (const file of markdown) {
  const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    if (!existsSync(resolve(dirname(file), target))) {
      errors.push(`${file.slice(root.length + 1)}: broken link ${match[1]}`);
    }
  }
}
if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`docs OK (${markdown.length} markdown files, relative links valid)`);
