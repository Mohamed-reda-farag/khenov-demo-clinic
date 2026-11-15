import { readFileSync } from 'node:fs';

const load = (name) =>
  JSON.parse(readFileSync(new URL(`../src/i18n/${name}.json`, import.meta.url), 'utf8'));

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? flatten(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

const ar = new Set(flatten(load('ar')));
const en = new Set(flatten(load('en')));
const missingInEn = [...ar].filter((key) => !en.has(key));
const missingInAr = [...en].filter((key) => !ar.has(key));

if (missingInEn.length || missingInAr.length) {
  console.error('i18n mismatch');
  if (missingInEn.length) console.error('Missing in en.json:', missingInEn.join(', '));
  if (missingInAr.length) console.error('Missing in ar.json:', missingInAr.join(', '));
  process.exit(1);
}
console.log(`i18n OK (${ar.size} keys in both languages)`);
