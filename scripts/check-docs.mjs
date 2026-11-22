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
// The portfolio card: valid JSON, honest "Demo" label, both languages, and media names that the
// guides in docs/portfolio actually talk about.
const cardPath = join(root, 'docs', 'portfolio', 'card.json');
if (existsSync(cardPath)) {
  const guides = ['COVER.md', 'SCREENSHOTS.md', 'VIDEO.md']
    .map((name) => readFileSync(join(root, 'docs', 'portfolio', name), 'utf8'))
    .join('\n');
  try {
    const card = JSON.parse(readFileSync(cardPath, 'utf8'));
    if (card.type !== 'Demo') errors.push('card.json: type must be "Demo"');
    for (const key of ['title', 'summary', 'disclaimer']) {
      if (!card[key]?.ar || !card[key]?.en) errors.push(`card.json: ${key} needs ar and en`);
    }
    if (!Array.isArray(card.tags) || card.tags.length < 3 || card.tags.length > 4) {
      errors.push('card.json: 3 or 4 tags are expected');
    }
    for (const link of ['liveDemo', 'download']) {
      if (!card.links?.[link]) errors.push(`card.json: links.${link} is missing`);
    }
    const media = [card.media?.cover, ...(card.media?.screenshots ?? []), card.media?.video];
    for (const name of media) {
      if (!name || !guides.includes(name))
        errors.push(`card.json: media "${name}" is not in the guides`);
    }
    if (!/demo|عرض تجريبي/i.test(`${card.summary?.en} ${card.summary?.ar}`)) {
      errors.push('card.json: the summary must say it is a demo');
    }
  } catch (error) {
    errors.push(`card.json: ${error.message}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`docs OK (${markdown.length} markdown files, relative links valid)`);
