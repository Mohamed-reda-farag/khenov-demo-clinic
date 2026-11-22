import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/theme/theme.css', import.meta.url), 'utf8');

// A filling transform animation (`both` / `forwards`) leaves `transform: matrix(...)` on the route
// wrapper, which makes it the containing block of every `position: fixed` element inside it
// (the drag ghost drifted by the sidebar width and the top bar height).
const rule = /\.anim-route\s*{([^}]*)}/.exec(css)?.[1] ?? '';
if (!rule.includes('animation:')) {
  console.error('check-motion: .anim-route rule not found in theme.css');
  process.exit(1);
}
if (/\b(both|forwards)\b/.test(rule)) {
  console.error('check-motion: .anim-route must not use animation-fill-mode both/forwards');
  process.exit(1);
}
console.log('motion OK (route wrapper leaves no transform behind)');
