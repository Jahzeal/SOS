// Generates src/app/dark-fallback.css  ->  run: node scripts/gen-dark-fallback.mjs
//
// Many dashboard pages were written with light-only classes (bg-white, text-slate-900 ...)
// and show white patches in dark mode. This file gives every such class a dark equivalent.
// Every rule has the same weight as a plain Tailwind class, so an explicit `dark:` class
// on the element always wins. Anything inside `.print-doc` (receipts, invoices) is left alone.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const c = require('tailwindcss/colors');

const hex = (h, a) => {
  const n = parseInt(h.slice(1), 16);
  const rgb = `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
  return a === undefined ? `rgb(${rgb})` : `rgb(${rgb} / ${a})`;
};
const S = c.slate;
const SKIP = ':where(:not(.print-doc, .print-doc *))';
const rules = [];
// exact class token, plus its opacity variants ("bg-white/90")
const tok = (cls, withOpacity = true) =>
  [`[class~="${cls}"]`, ...(withOpacity ? [`[class*=" ${cls}/"]`, `[class^="${cls}/"]`] : [])];
const add = (classes, decl, { state = '', opacity = true, extra = '' } = {}) => {
  const sel = classes.flatMap((k) => tok(k, opacity)).join(', ');
  rules.push(`:where(.dark) :is(${sel})${extra}${SKIP}${state} { ${decl} }`);
};
const neutrals = ['slate', 'gray', 'zinc', 'neutral'];
const n = (prefix, shades) => neutrals.flatMap((name) => shades.map((s) => `${prefix}-${name}-${s}`));

// ---- Neutral surfaces
// White stays white only on round shapes with no text in them (switch knobs, dots).
// Round pills and chips that carry text must go dark, or their lightened text vanishes.
add(['bg-white'], `background-color: ${hex(S[900])};`, {
  extra: ':where(:not(.rounded-full:not([class*="text-"]):not([class*="px-"])))',
});
add(n('bg', [50]), `background-color: ${hex(S[800], 0.5)};`);
add(n('bg', [100]), `background-color: ${hex(S[800])};`);
add(n('bg', [200]), `background-color: ${hex(S[700])};`);
add(n('bg', [900, 950]), `background-color: ${hex(S[700])};`, { opacity: false });
// ---- Neutral text
add(n('text', [950, 900, 800]), `color: ${hex(S[100])};`);
add(n('text', [700]), `color: ${hex(S[200])};`);
add(n('text', [600]), `color: ${hex(S[300])};`);
add(n('text', [500]), `color: ${hex(S[400])};`);
// ---- Neutral borders and dividers
add(n('border', [100]), `border-color: ${hex(S[800])};`);
add(n('border', [200]), `border-color: ${hex(S[700], 0.8)};`);
add(n('border', [300]), `border-color: ${hex(S[600])};`);
for (const [shades, colour] of [[[100, 150], S[800]], [[200], S[700]]]) {
  const sel = n('divide', shades).map((k) => `[class~="${k}"]`).join(', ');
  rules.push(`:where(.dark) :is(${sel}) > :not([hidden]) ~ :not([hidden]) { border-color: ${hex(colour)}; }`);
}
// ---- Gradients built from white / near-white
for (const [cls, colour] of [['white', S[900]], ['slate-50', S[900]], ['slate-100', S[800]]]) {
  add([`from-${cls}`], `--tw-gradient-from: ${hex(colour)} var(--tw-gradient-from-position); --tw-gradient-to: ${hex(colour, 0)} var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);`, { opacity: false });
  add([`to-${cls}`], `--tw-gradient-to: ${hex(colour)} var(--tw-gradient-to-position);`, { opacity: false });
}
// ---- Neutral hover states
add(n('hover:bg', [50, 100]), `background-color: ${hex(S[800])};`, { state: ':hover' });
add(['hover:bg-white'], `background-color: ${hex(S[800])};`, { state: ':hover' });
add(n('hover:bg', [200]), `background-color: ${hex(S[700])};`, { state: ':hover' });
add(n('hover:bg', [800, 900]), `background-color: ${hex(S[600])};`, { state: ':hover', opacity: false });
add(n('hover:text', [950, 900, 800, 700, 600]), `color: #fff;`, { state: ':hover' });
add(n('hover:border', [300, 400]), `border-color: ${hex(S[500])};`, { state: ':hover' });
// ---- Disabled fields
add(n('disabled:bg', [50, 100]), `background-color: ${hex(S[800])};`, { state: ':disabled' });
add(n('disabled:text', [400, 500]), `color: ${hex(S[500])};`, { state: ':disabled' });
// ---- Focus state used by older inputs ("focus:bg-white")
add(['focus:bg-white'], `background-color: ${hex(S[900])};`, { state: ':focus', opacity: false });

// ---- Tinted panels, chips and their text
const hues = ['teal', 'emerald', 'green', 'blue', 'indigo', 'sky', 'cyan', 'violet', 'purple', 'amber', 'yellow', 'orange', 'rose', 'red'];
// Token names from tailwind.config.js and the built-in palette each one points at.
const aliases = { accent: 'teal', success: 'emerald', warning: 'amber', danger: 'rose' };
for (const h of [...hues, ...Object.keys(aliases)]) {
  const p = c[aliases[h] ?? h];
  add([`bg-${h}-50`], `background-color: ${hex(p[950], 0.4)};`);
  add([`bg-${h}-100`], `background-color: ${hex(p[900], 0.45)};`);
  add([`bg-${h}-200`], `background-color: ${hex(p[800], 0.6)};`);
  add([`text-${h}-950`, `text-${h}-900`, `text-${h}-800`], `color: ${hex(p[200])};`);
  add([`text-${h}-700`], `color: ${hex(p[300])};`);
  add([`text-${h}-600`], `color: ${hex(p[400])};`);
  add([`border-${h}-100`, `border-${h}-200`, `border-${h}-300`], `border-color: ${hex(p[800], 0.7)};`);
  add([`hover:bg-${h}-50`, `hover:bg-${h}-100`], `background-color: ${hex(p[900], 0.5)};`, { state: ':hover' });
  add([`hover:text-${h}-600`, `hover:text-${h}-700`, `hover:text-${h}-800`], `color: ${hex(p[300])};`, { state: ':hover' });
}

const header = `/* GENERATED FILE - do not edit by hand. Edit scripts/gen-dark-fallback.mjs and run:
     node scripts/gen-dark-fallback.mjs
   Dark-mode equivalents for light-only Tailwind classes. An explicit \`dark:\` class on an
   element always wins over these. Content inside \`.print-doc\` is never touched, and nothing applies when printing. */\n`;
writeFileSync(new URL('../src/app/dark-fallback.css', import.meta.url), header + '@media screen {\n' + rules.join('\n') + '\n}\n');
console.log(`wrote ${rules.length} rules`);
